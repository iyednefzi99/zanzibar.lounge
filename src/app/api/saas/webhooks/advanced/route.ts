import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  registerWebhook,
  type WebhookEvent,
} from "@/lib/webhooks";
import { createAuditLog } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS: WebhookEvent[] = [
  "reservation.created",
  "reservation.cancelled",
  "order.created",
  "order.completed",
  "payment.succeeded",
  "payment.failed",
];

// --- GET: list webhooks with delivery status ---

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "missing restaurantId" },
      { status: 400 },
    );
  }

  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: { restaurantId },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            event: true,
            status: true,
            attempts: true,
            lastError: true,
            responseStatus: true,
            createdAt: true,
            completedAt: true,
          },
        },
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      webhooks: endpoints.map((e) => ({
        id: e.id,
        name: e.name,
        url: e.url,
        events: e.events,
        active: e.active,
        lastDeliveryAt: e.lastDeliveryAt?.toISOString() ?? null,
        lastDeliveryStatus: e.lastDeliveryStatus,
        totalDeliveries: e._count.deliveries,
        recentDeliveries: e.deliveries.map((d) => ({
          id: d.id,
          event: d.event,
          status: d.status,
          attempts: d.attempts,
          lastError: d.lastError,
          responseStatus: d.responseStatus,
          createdAt: d.createdAt.toISOString(),
          completedAt: d.completedAt?.toISOString() ?? null,
        })),
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("advanced webhooks list failed", { error: message, restaurantId });
    return NextResponse.json(
      { error: "webhook_list_failed", message },
      { status: 500 },
    );
  }
}

// --- POST: create webhook with custom events ---

const postBody = z.object({
  restaurantId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum(VALID_EVENTS as [string, ...string[]])).min(1).max(20),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = postBody.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { restaurantId, url, events, name } = parsed.data;

  try {
    const secret = crypto.randomBytes(32).toString("hex");
    const webhookId = await registerWebhook(
      restaurantId,
      url,
      events as WebhookEvent[],
      secret,
      name,
    );

    await createAuditLog(restaurantId, "webhook.created", null, {
      webhookId,
      url,
      events,
      name,
    });

    return NextResponse.json({
      ok: true,
      webhook: {
        id: webhookId,
        name: name ?? null,
        url,
        events,
        secret,
        active: true,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("advanced webhook creation failed", {
      error: message,
      restaurantId,
    });
    return NextResponse.json(
      { error: "webhook_creation_failed", message },
      { status: 500 },
    );
  }
}

// --- DELETE: remove webhook ---

const deleteBody = z.object({
  webhookId: z.string().min(1),
  restaurantId: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = deleteBody.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  const { webhookId, restaurantId } = parsed.data;

  try {
    const endpoint = await db.webhookEndpoint.findFirst({
      where: { id: webhookId, restaurantId },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "webhook_not_found" },
        { status: 404 },
      );
    }

    await db.webhookEndpoint.delete({ where: { id: webhookId } });

    await createAuditLog(restaurantId, "webhook.deleted", null, {
      webhookId,
      url: endpoint.url,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("advanced webhook deletion failed", {
      error: message,
      webhookId,
      restaurantId,
    });
    return NextResponse.json(
      { error: "webhook_deletion_failed", message },
      { status: 500 },
    );
  }
}
