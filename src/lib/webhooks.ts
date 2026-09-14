import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────

export type WebhookEvent =
  | "reservation.created"
  | "reservation.cancelled"
  | "order.created"
  | "order.completed"
  | "payment.succeeded"
  | "payment.failed";

export type WebhookPayload = {
  event: WebhookEvent;
  restaurantId: string;
  timestamp: string;
  data: Record<string, unknown>;
};

export type WebhookDeliveryResult = {
  success: boolean;
  attempts: number;
  lastError?: string;
};

// ─── HMAC-SHA256 Signature ────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Signer un payload avec HMAC-SHA256.
 */
export async function signWebhookPayload(
  secret: string,
  payload: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `sha256=${toHex(signature)}`;
}

/**
 * Vérifier la signature HMAC d'un webhook reçu.
 */
export async function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
): Promise<boolean> {
  const expected = await signWebhookPayload(secret, payload);

  if (expected.length !== signature.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Webhook Registration ─────────────────────────────────────────────

/**
 * Enregistrer un endpoint webhook.
 */
export async function registerWebhook(
  restaurantId: string,
  url: string,
  events: WebhookEvent[],
  secret: string,
  name?: string,
): Promise<string> {
  const existingCount = await db.webhookEndpoint.count({
    where: { restaurantId, active: true },
  });

  if (existingCount >= 10) {
    throw new Error("WEBHOOK_LIMIT_REACHED");
  }

  const endpoint = await db.webhookEndpoint.create({
    data: {
      restaurantId,
      url,
      events,
      secret,
      name: name ?? null,
    },
  });

  logger.info("webhook.registered", {
    webhookId: endpoint.id,
    restaurantId,
    url,
    events,
  });

  return endpoint.id;
}

// ─── Webhook Delivery ─────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // exponential backoff in ms

/**
 * Livrer un événement webhook à un endpoint avec retry.
 */
export async function deliverWebhook(
  webhookId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<WebhookDeliveryResult> {
  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id: webhookId },
  });

  if (!endpoint || !endpoint.active) {
    return { success: false, attempts: 0, lastError: "endpoint_inactive" };
  }

  const body: WebhookPayload = {
    event,
    restaurantId: endpoint.restaurantId,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const bodyString = JSON.stringify(body);
  const signature = await signWebhookPayload(endpoint.secret, bodyString);

  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: JSON.parse(JSON.stringify(body)),
      status: "pending",
    },
  });

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ECoffee-Event": event,
          "X-ECoffee-Signature": signature,
          "X-ECoffee-Delivery": delivery.id,
          "User-Agent": "ECoffeeNode-Webhook/1.0",
        },
        body: bodyString,
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        await db.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "success",
            attempts: attempt + 1,
            responseStatus: response.status,
            completedAt: new Date(),
          },
        });

        await db.webhookEndpoint.update({
          where: { id: webhookId },
          data: {
            lastDeliveryAt: new Date(),
            lastDeliveryStatus: "success",
          },
        });

        logger.info("webhook.delivered", {
          webhookId,
          event,
          deliveryId: delivery.id,
          attempts: attempt + 1,
          status: response.status,
        });

        return { success: true, attempts: attempt + 1 };
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown_error";
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "failed",
      attempts: MAX_RETRIES,
      lastError,
      completedAt: new Date(),
    },
  });

  await db.webhookEndpoint.update({
    where: { id: webhookId },
    data: {
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: "failed",
    },
  });

  logger.error("webhook.delivery_failed", {
    webhookId,
    event,
    deliveryId: delivery.id,
    lastError,
  });

  return { success: false, attempts: MAX_RETRIES, lastError };
}

/**
 * Envoyer un événement à tous les endpoints abonnés d'un restaurant.
 */
export async function broadcastWebhook(
  restaurantId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<WebhookDeliveryResult[]> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { restaurantId, active: true, events: { has: event } },
  });

  const results = await Promise.allSettled(
    endpoints.map((ep) => deliverWebhook(ep.id, event, payload)),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { success: false, attempts: 0, lastError: r.reason?.message ?? "unknown" },
  );
}
