import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const PORT = 3000;

app.use(express.json());

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
    credentials: { s3ClientCreated: false, bucketAccessible: false, error: null },
    publicUrl: { reachable: false, error: null }
  };

  try {
    const s3 = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (s3) {
      results.credentials.s3ClientCreated = true;
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        results.credentials.bucketAccessible = true;
      } catch (err: any) {
        results.credentials.bucketAccessible = false;
        results.credentials.error = err.message;
      }
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
      console.error("R2 credentials missing: Check R2_BUCKET_NAME");
      return res.status(500).json({ error: "R2 credentials missing: Check bucket name" });
    }
    if (!publicUrlBase) {
      console.error("R2 credentials missing: Check R2_PUBLIC_URL");
      return res.status(500).json({ error: "R2 credentials missing: Check public URL" });
    }

    // Generate a unique filename (no folder prefix for testing)
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const imageKey = `${Date.now()}-${safeFilename}`;

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
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3.send(command);
    res.json(response.Contents || []);
  } catch (error: any) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: error.message });
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
