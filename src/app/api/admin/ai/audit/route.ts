import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getAuditLogs } from "@/lib/ai/audit";

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
  const limit = Number(url.searchParams.get("limit")) || 50;
  const offset = Number(url.searchParams.get("offset")) || 0;
  const operation = url.searchParams.get("operation") || undefined;

  const logs = await getAuditLogs(restaurantId, { limit, offset, operation });
  return NextResponse.json({ logs });
}
