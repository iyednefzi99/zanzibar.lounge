const CACHE_NAME = "e-coffee-v1";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API calls
  if (request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Network first for HTML pages
      if (request.headers.get("accept")?.includes("text/html")) {
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached || caches.match("/offline"));
      }

      // Cache first for static assets
      if (cached) return cached;

      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    }),
  );
});

// Background sync for offline orders
self.addEventListener("sync", (event: ExtendableEvent & { tag?: string }) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  const cache = await caches.open("offline-orders");
  const keys = await cache.keys();

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const body = await response.json();
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await cache.delete(request);
    }
  }
}

// Push notification handler
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "E-Coffee Node";
  const options = {
    body: data.body || "Nouvelle notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge.png",
    data: data.url,
    actions: [
      { action: "open", title: "Ouvrir" },
      { action: "dismiss", title: "Fermer" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data || "/"),
    );
  }
});
