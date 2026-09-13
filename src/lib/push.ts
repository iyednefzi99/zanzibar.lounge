import crypto from "node:crypto";

import { db } from "@/lib/db";

/**
 * Notifications push via Web Push API (RFC 8291).
 *
 * Pas de dépendance lourde : l'envoi utilise fetch() avec les headers VAPID
 * signés manuellement. Les clés VAPID sont générées une fois et stockées
 * dans les variables d'environnement.
 *
 * Variables requises :
 * - VAPID_PUBLIC_KEY  : clé publique base64url (exposée au client)
 * - VAPID_PRIVATE_KEY : clé privée base64url (côté serveur uniquement)
 * - VAPID_EMAIL       : contact du propriétaire (mailto:…)
 */

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type PushResult = {
  sent: number;
  failed: number;
  errors: string[];
};

// --- Souscription / désabonnement ---

export async function subscribe(
  endpoint: string,
  p256dh: string,
  auth: string,
  guestId?: string,
): Promise<void> {
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, guestId: guestId ?? null },
    update: { p256dh, auth, guestId: guestId ?? null },
  });
}

export async function unsubscribe(endpoint: string): Promise<void> {
  await db.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function getSubscriptionCount(): Promise<number> {
  return db.pushSubscription.count();
}

// --- Envoi ---

export async function sendPush(
  payload: PushPayload,
  guestId?: string,
): Promise<PushResult> {
  const where = guestId
    ? { guestId }
    : {}; // tous les abonnés si pas de guestId

  const subscriptions = await db.pushSubscription.findMany({
    where,
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!privateKey || !publicKey || !email) {
    return {
      sent: 0,
      failed: subscriptions.length,
      errors: ["VAPID keys not configured"],
    };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const endpointsToDelete: string[] = [];

  for (const sub of subscriptions) {
    try {
      const status = await sendWebPush(sub.endpoint, sub.p256dh, sub.auth, body, privateKey, publicKey, email);
      if (status === 201) {
        sent++;
      } else if (status === 410) {
        // Gone : l'abonnement n'est plus valide
        endpointsToDelete.push(sub.endpoint);
        failed++;
      } else {
        failed++;
        errors.push(`${sub.endpoint}: HTTP ${status}`);
      }
    } catch (err) {
      failed++;
      errors.push(`${sub.endpoint}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // Nettoyer les abonnements expirés
  if (endpointsToDelete.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: endpointsToDelete } },
    });
  }

  return { sent, failed, errors };
}

// --- Web Push bas-niveau ---

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  body: string,
  privateKey: string,
  publicKey: string,
  email: string,
): Promise<number> {
  const url = new URL(endpoint);

  // Version simplifiée : on utilise la VAPID auth avec le body en clair.
  // Le client déchiffre via le service worker.
  // Pour une prod complète, il faudrait chiffrer avec AESGCM + HKDF.
  const timestamp = Math.floor(Date.now() / 1000);
  const vapidHeaders = getVapidHeaders(url.origin, publicKey, privateKey, email, timestamp);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      ...vapidHeaders,
    },
    body: Buffer.from(body),
    signal: AbortSignal.timeout(10_000),
  });

  return response.status;
}

function getVapidHeaders(
  origin: string,
  publicKey: string,
  privateKey: string,
  email: string,
  timestamp: number,
): Record<string, string> {
  const header = {
    aud: origin,
    exp: timestamp + 43200, // 12h
    sub: email,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedBody = "";

  // SHA-256 du payload (vide pour les push notifications)
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = crypto
    .createSign("SHA256")
    .update(data)
    .sign(importVapidKey(privateKey), "base64url");

  return {
    Authorization: `vapid t=${encodedHeader}, k=${publicKey}, s=${signature}`,
  };
}

function importVapidKey(keyBase64: string): crypto.KeyObject {
  const keyBuffer = Buffer.from(keyBase64, "base64url");
  return crypto.createPrivateKey({
    key: keyBuffer,
    format: "der",
    type: "pkcs8",
  });
}

function base64urlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// --- Génération de clés VAPID (script one-shot) ---

export function generateVapidKeys(): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });

  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });

  return {
    publicKey: pubDer.toString("base64url"),
    privateKey: privDer.toString("base64url"),
  };
}
