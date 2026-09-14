// Service Worker pour les notifications push et le cache offline.
//
// Ce fichier est placé dans public/ pour être accessible depuis la racine.
// Il gère les événements push, notificationclick, et le cache des assets statiques.

const CACHE_NAME = "zanzibar-v1";
const STATIC_ASSETS = ["/offline", "/icon-192.png", "/icon-512.png"];

// Installation : pré-cacher les assets critiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Stratégie de cache : network-first pour les pages, cache-first pour les assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Pour les assets statiques (images, CSS, JS) : cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Pour les pages : network-first avec fallback offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les pages naviguées
        if (response.ok && event.request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached ?? caches.match("/offline")),
      ),
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Zanzibar Lounge",
      body: event.data.text(),
      url: "/",
    };
  }

  const title = payload.title || "Zanzibar Lounge";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/badge-72.png",
    tag: payload.tag || "zanzibar-push",
    renotify: true,
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
