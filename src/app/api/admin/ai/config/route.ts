import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getConfig, upsertConfig } from "@/lib/ai/config";
import { getCostSummary } from "@/lib/ai/cost-tracker";

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

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const summary = url.searchParams.get("summary");

  if (summary === "true") {
    const cost = await getCostSummary(restaurantId, 30);
    return NextResponse.json({ summary: cost });
  }

  const config = await getConfig(restaurantId);
  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
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
  const allowed = [
    "provider",
    "model",
    "maxTokens",
    "temperature",
    "dailyBudgetCents",
    "monthlyBudgetCents",
    "enabled",
    "fallbackProvider",
    "fallbackModel",
  ];

  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in input) filtered[key] = input[key];
  }

  const config = await upsertConfig(restaurantId, filtered as {
    provider?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    dailyBudgetCents?: number;
    monthlyBudgetCents?: number;
    enabled?: boolean;
    fallbackProvider?: string;
    fallbackModel?: string;
  });

  return NextResponse.json({ config });
}
