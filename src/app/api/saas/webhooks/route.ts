import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- GET: list webhooks ---

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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      webhooks: endpoints.map((e) => ({
        id: e.id,
        url: e.url,
        events: e.events,
        active: e.active,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("webhook list failed", { error: message, restaurantId });
    return NextResponse.json(
      { error: "webhook_list_failed", message },
      { status: 500 },
    );
  }
}

// --- POST: create webhook ---

const postBody = z.object({
  restaurantId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string().min(1).max(100)).min(1).max(20),
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
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  const existingCount = await db.webhookEndpoint.count({
    where: { restaurantId: parsed.data.restaurantId, active: true },
  });

  if (existingCount >= 10) {
    return NextResponse.json(
      { error: "webhook_limit_reached", message: "Maximum 10 active webhooks per restaurant" },
      { status: 400 },
    );
  }

  const secret = crypto.randomBytes(32).toString("hex");

  try {
    const endpoint = await db.webhookEndpoint.create({
      data: {
        restaurantId: parsed.data.restaurantId,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
      },
    });

    logger.info("webhook created", {
      webhookId: endpoint.id,
      restaurantId: parsed.data.restaurantId,
      url: parsed.data.url,
    });

    return NextResponse.json({
      ok: true,
      webhook: {
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        secret: endpoint.secret,
        active: endpoint.active,
        createdAt: endpoint.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("webhook creation failed", {
      error: message,
      restaurantId: parsed.data.restaurantId,
    });
    return NextResponse.json(
      { error: "webhook_creation_failed", message },
      { status: 500 },
    );
  }
}
