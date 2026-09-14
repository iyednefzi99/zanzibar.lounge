import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { processVoiceOrder } from "@/lib/voice/voice-ordering";

export const dynamic = "force-dynamic";

async function getRestaurantId() {
  return process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id ?? null
    : null;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const orders = await db.voiceOrder.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const order = await processVoiceOrder({
    restaurantId,
    reservationId: typeof input.reservationId === "string" ? input.reservationId : undefined,
    tableNumber: typeof input.tableNumber === "string" ? input.tableNumber : undefined,
    items: input.items as { name: string; quantity: number; price: number; modifiers?: string[] }[],
    language: typeof input.language === "string" ? input.language : undefined,
    transcript: typeof input.transcript === "string" ? input.transcript : undefined,
  });

  return NextResponse.json(order, { status: 201 });
}
