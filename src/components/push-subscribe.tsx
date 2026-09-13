"use client";

import { useEffect, useState } from "react";

type PushState = "unsupported" | "denied" | "subscribed" | "unsubscribed";

/**
 * Bouton d'abonnement aux notifications push.
 *
 * Gère l'enregistrement du service worker, la demande de permission,
 * et l'abonnement/désabonnement via l'API Web Push.
 *
 * Nécessite les variables d'env VAPID_PUBLIC_KEY côté client
 * (exposée via NEXT_PUBLIC_VAPID_PUBLIC_KEY).
 */
export function PushSubscribeButton() {
  const [state, setState] = useState<PushState>("unsupported");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isSupported =
      "serviceWorker" in navigator && "PushManager" in window;

    if (!isSupported) return;

    // Vérifier l'état actuel
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? "subscribed" : "unsubscribed");
      });
    });
  }, []);

  async function handleToggle() {
    if (state === "denied" || state === "unsupported") return;

    setLoading(true);

    try {
      if (state === "subscribed") {
        // Désabonnement
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setState("unsubscribed");
      } else {
        // Abonnement
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState("denied");
          return;
        }

        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured");
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode(
                  ...new Uint8Array(sub.getKey("p256dh")!),
                ),
              ),
              auth: btoa(
                String.fromCharCode(
                  ...new Uint8Array(sub.getKey("auth")!),
                ),
              ),
            },
          }),
        });

        setState("subscribed");
      }
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (state === "unsupported" || state === "denied") return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm transition-colors disabled:opacity-40 ${
        state === "subscribed"
          ? "border-lagoon/50 text-lagoon hover:bg-lagoon/10"
          : "border-shell/25 text-shell hover:border-brass hover:text-brass"
      }`}
    >
      {loading
        ? "…"
        : state === "subscribed"
          ? "Notifications activées"
          : "Recevoir les notifications"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
