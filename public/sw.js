// Service Worker pour les notifications push.
//
// Ce fichier est placé dans public/ pour être accessible depuis la racine.
// Il gère les événements push et notificationclick.

/* eslint-disable @typescript-eslint/no-unused-vars -- service worker globals */

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
      // Si une fenêtre est déjà ouverte sur le même site, la focus
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      return self.clients.openWindow(url);
    }),
  );
});

// Activer le service worker immédiatement sans attendre le rechargement
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});
