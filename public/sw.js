const CACHE_NAME = 'shasznair-cafe-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/coffee_logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and bypass API / Firestore network requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.hostname.includes('firestore') || url.hostname.includes('googleapis') || url.hostname.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
        }).catch(() => {
          // Silent fail for background refresh
        });
        return cachedResponse;
      }
      return fetch(event.request).catch((err) => {
        console.warn('[SW] Fetch failed:', err);
        // Fallback for document requests to index.html for SPA support
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw err;
      });
    })
  );
});

// ==========================================
// BACKGROUND PUSH NOTIFICATIONS & LOCKSCREEN
// ==========================================

self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    try {
      data = { body: event.data.text() };
    } catch (e2) {
      data = {};
    }
  }

  // Handle FCM payload format (notification object or data payload)
  const notificationTitle = data.notification?.title || data.data?.title || data.title || '🔔 New POS Order Received!';
  const notificationBody = data.notification?.body || data.data?.body || data.body || 'A new order has arrived. Tap to view transaction.';
  const orderNumber = data.data?.orderNumber || data.orderNumber || '';
  const orderId = data.data?.orderId || data.orderId || '';
  const clickAction = data.data?.click_action || data.fcmOptions?.link || '/?view=pos';

  const notificationOptions = {
    body: notificationBody,
    icon: '/coffee_logo.jpg',
    badge: '/coffee_logo.jpg',
    vibrate: [300, 100, 300, 100, 300], // Urgent rhythmic cafe pulse
    requireInteraction: true,          // Keep notification on lockscreen until interacted
    renotify: true,                    // Trigger sound/vibration every time
    tag: orderNumber ? `pos-order-${orderNumber}` : `pos-order-${Date.now()}`,
    data: {
      url: clickAction,
      orderId,
      orderNumber,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_pos', title: '☕ Open POS Register' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/?view=pos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_POS_ORDER',
            orderId: event.notification.data?.orderId,
            orderNumber: event.notification.data?.orderNumber
          });
          return client.focus();
        }
      }
      // Otherwise open a fresh window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

