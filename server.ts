import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import admin from "firebase-admin";

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// FIREBASE ADMIN SDK & FCM INITIALIZATION
// ==========================================
let firebaseAdminApp: admin.app.App | null = null;

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    firebaseAdminApp = admin.app();
    return firebaseAdminApp;
  }

  try {
    // 1. Check for service-account.json file in root
    const serviceAccountPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Firebase Admin] Initialized with local service-account.json");
      return firebaseAdminApp;
    }

    // 2. Check for FIREBASE_SERVICE_ACCOUNT_KEY env string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY");
      return firebaseAdminApp;
    }

    // 3. Check for individual FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

    if (clientEmail && privateKey) {
      // Clean up escaped newlines in private key
      privateKey = privateKey.replace(/\\n/g, "\n");
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized with CLIENT_EMAIL & PRIVATE_KEY");
      return firebaseAdminApp;
    }

    // 4. Fallback to default application credentials if projectId exists
    if (projectId) {
      firebaseAdminApp = admin.initializeApp({
        projectId,
      });
      console.log("[Firebase Admin] Initialized with Project ID:", projectId);
      return firebaseAdminApp;
    }

    console.warn("[Firebase Admin] No credentials found. FCM server dispatch will require service-account.json or environment variables.");
    return null;
  } catch (err: any) {
    console.error("[Firebase Admin] Failed to initialize:", err.message);
    return null;
  }
};

initFirebaseAdmin();

const getS3Client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Diagnostic endpoint to verify R2 configuration
app.get("/api/diagnose-r2", async (req, res) => {
  const results = {
    credentials: { s3ClientCreated: false, bucketAccessible: false, error: null as string | null },
    publicUrl: { reachable: false, error: null as string | null }
  };

  try {
    const s3 = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (s3 && bucketName) {
      results.credentials.s3ClientCreated = true;
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        results.credentials.bucketAccessible = true;
      } catch (err: any) {
        results.credentials.bucketAccessible = false;
        results.credentials.error = err.message;
      }
    } else {
      results.credentials.error = s3 ? "R2_BUCKET_NAME not set" : "R2 credentials missing";
    }

    if (publicUrlBase) {
      try {
        const response = await fetch(publicUrlBase, { method: 'HEAD' });
        results.publicUrl.reachable = response.ok;
        if (!response.ok) results.publicUrl.error = `Status: ${response.status}`;
      } catch (err: any) {
        results.publicUrl.error = err.message;
      }
    } else {
      results.publicUrl.error = "R2_PUBLIC_URL not set";
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// API route to get a presigned URL for Cloudflare R2
app.post("/api/upload-url", async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body;
    
    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType are required" });
    }

    const s3 = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxxxx.r2.dev

    if (!s3) {
      console.error("R2 credentials missing: Check CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
      return res.status(500).json({ error: "R2 credentials missing: Check account ID and keys" });
    }
    if (!bucketName) {
      console.error("R2 bucket name missing: Check R2_BUCKET_NAME");
      return res.status(500).json({ error: "R2 bucket name missing: Check bucket name" });
    }
    if (!publicUrlBase) {
      console.error("R2 public URL missing: Check R2_PUBLIC_URL");
      return res.status(500).json({ error: "R2 public URL missing: Check public URL" });
    }

    // Generate a unique filename with optional folder prefix
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folderPrefix = folder ? `${folder.replace(/\/$/, '')}/` : '';
    const imageKey = `${folderPrefix}${Date.now()}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${imageKey}`;
    
    console.log("DEBUG: Generated public URL:", publicUrl);
    console.log("DEBUG: Image key:", imageKey);

    res.json({ signedUrl, publicUrl, imageKey });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate presigned URL" });
  }
});

// Diagnostic: List files in bucket
app.get("/api/list-files", async (req, res) => {
  try {
    const s3 = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    
    if (!s3 || !bucketName) {
      return res.json({ message: "R2 not configured", files: [] });
    }

    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3.send(command);
    res.json(response.Contents || []);
  } catch (error: any) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// FCM PUSH NOTIFICATION API ENDPOINTS
// ==========================================

// Check status of FCM configuration
app.get("/api/fcm-status", async (req, res) => {
  const adminReady = !!firebaseAdminApp;
  let tokensCount = 0;
  let tokens: string[] = [];
  let firestoreConnected = false;

  if (adminReady) {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("fcm_tokens").get();
      tokensCount = snapshot.size;
      tokens = snapshot.docs.map(d => d.data().token).filter(Boolean);
      firestoreConnected = true;
    } catch (e: any) {
      // Firestore check optional if permissions not provided
    }
  }

  res.json({
    adminReady,
    hasVapidKey: !!process.env.VITE_FIREBASE_VAPID_KEY,
    firestoreConnected,
    tokensCount,
  });
});

// Notify POS / Cashier registers about a new order
app.post("/api/notify-new-order", async (req, res) => {
  try {
    const { orderId, orderNumber, customerName, total, orderType, itemsSummary, customTokens } = req.body;

    if (!firebaseAdminApp) {
      // Re-attempt init in case env was loaded late
      initFirebaseAdmin();
    }

    if (!firebaseAdminApp) {
      return res.status(503).json({
        error: "Firebase Admin is not configured on server. Please set service-account.json or FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.",
      });
    }

    let targetTokens: string[] = [];

    // 1. If tokens were passed in request, use them
    if (Array.isArray(customTokens) && customTokens.length > 0) {
      targetTokens = customTokens.filter(t => typeof t === 'string' && t.trim().length > 0);
    }

    // 2. Otherwise fetch cashier and admin tokens from Firestore `fcm_tokens`
    if (targetTokens.length === 0) {
      try {
        const db = admin.firestore();
        const tokensSnap = await db.collection("fcm_tokens").get();
        targetTokens = tokensSnap.docs
          .map(doc => doc.data())
          .filter(data => data && data.token && (data.role === 'cashier' || data.role === 'admin' || !data.role))
          .map(data => data.token);
      } catch (err: any) {
        console.warn("[FCM] Could not fetch tokens from Firestore directly:", err.message);
      }
    }

    if (targetTokens.length === 0) {
      console.log("[FCM] No active cashier/admin device tokens found to notify.");
      return res.json({ success: true, message: "No registered device tokens to notify.", count: 0 });
    }

    // De-duplicate tokens
    targetTokens = Array.from(new Set(targetTokens));

    const formattedTotal = total != null ? `₱${Number(total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '';
    const formattedType = (orderType || 'Order').toString().toUpperCase();
    const title = `🔔 New Order #${orderNumber || ''}`;
    const bodyText = `${customerName || 'Guest'} (${formattedType}) • ${formattedTotal}${itemsSummary ? `\n${itemsSummary}` : ''}`;

    const multicastMessage: admin.messaging.MulticastMessage = {
      tokens: targetTokens,
      notification: {
        title,
        body: bodyText,
      },
      data: {
        orderId: String(orderId || ''),
        orderNumber: String(orderNumber || ''),
        orderType: String(orderType || ''),
        total: String(total || ''),
        type: 'NEW_ORDER',
        click_action: '/?view=pos',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'pos_orders',
          priority: 'max',
          defaultVibrateTimings: false,
          vibrateTimingsMillis: [300, 100, 300, 100, 300],
          clickAction: '/?view=pos',
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: '/coffee_logo.jpg',
          badge: '/coffee_logo.jpg',
          vibrate: [300, 100, 300, 100, 300],
          requireInteraction: true,
          renotify: true,
          tag: orderNumber ? `pos-order-${orderNumber}` : `pos-order-${Date.now()}`,
          actions: [
            { action: 'open_pos', title: '☕ Open POS Register' }
          ],
        },
        fcmOptions: {
          link: '/?view=pos',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(multicastMessage);
    console.log(`[FCM] Dispatched new order #${orderNumber} push: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // Clean up invalid or expired tokens automatically
    if (response.failureCount > 0) {
      const invalidTokenIndexes: number[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/invalid-argument'
          ) {
            invalidTokenIndexes.push(idx);
          }
        }
      });

      if (invalidTokenIndexes.length > 0) {
        try {
          const db = admin.firestore();
          const batch = db.batch();
          for (const idx of invalidTokenIndexes) {
            const badToken = targetTokens[idx];
            const tokenDocId = Buffer.from(badToken.slice(-32)).toString('base64').replace(/[/+=]/g, '_');
            batch.delete(db.collection('fcm_tokens').doc(tokenDocId));
          }
          await batch.commit();
          console.log(`[FCM] Pruned ${invalidTokenIndexes.length} stale FCM tokens from Firestore.`);
        } catch (pruneErr) {
          console.warn('[FCM] Token pruning error:', pruneErr);
        }
      }
    }

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error: any) {
    console.error("[FCM] Error sending new order push notification:", error);
    res.status(500).json({ error: error.message || "Failed to dispatch push notification" });
  }
});

// Test push notification endpoint
app.post("/api/test-notification", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!firebaseAdminApp) {
      initFirebaseAdmin();
    }

    if (!firebaseAdminApp) {
      return res.status(503).json({
        error: "Firebase Admin is not configured. Please check server credentials.",
      });
    }

    let tokens: string[] = [];
    if (token) {
      tokens = [token];
    } else {
      const db = admin.firestore();
      const snap = await db.collection("fcm_tokens").get();
      tokens = snap.docs.map(d => d.data().token).filter(Boolean);
    }

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No target FCM tokens available for test." });
    }

    const testMessage: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: title || "🔔 POS Register Test Alert",
        body: body || "Your device is ready to receive instant loud order notifications & lockscreen vibration!",
      },
      data: {
        type: "TEST_NOTIFICATION",
        click_action: "/?view=pos",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "max",
          vibrateTimingsMillis: [300, 100, 300, 100, 300],
        },
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: "/coffee_logo.jpg",
          badge: "/coffee_logo.jpg",
          vibrate: [300, 100, 300, 100, 300],
          requireInteraction: true,
          renotify: true,
          tag: `pos-test-${Date.now()}`,
          actions: [{ action: "open_pos", title: "Open POS" }],
        },
        fcmOptions: {
          link: "/?view=pos",
        },
      },
    };

    const resp = await admin.messaging().sendEachForMulticast(testMessage);
    res.json({
      success: true,
      successCount: resp.successCount,
      failureCount: resp.failureCount,
    });
  } catch (error: any) {
    console.error("[FCM] Error sending test notification:", error);
    res.status(500).json({ error: error.message || "Failed to dispatch test notification" });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
