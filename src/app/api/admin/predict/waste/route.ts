import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getWasteStats, logWaste } from "@/lib/predict";

function getRestaurantId() {
  return process.env.OWNER_RESTAURANT_SLUG
    ? (
        db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        }) as Promise<{ id: string } | null>
      ).then((r) => r?.id ?? null)
    : Promise.resolve(null);
}

export async function GET() {
  try {
    await requireAdmin();
    const restaurantId = await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const stats = await getWasteStats(restaurantId);
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof Error && err.name === "AdminForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const restaurantId = await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      category?: string;
      quantity?: number;
      unit?: string;
      reason?: string;
      costCents?: number;
      menuItemId?: string;
      loggedBy?: string;
      notes?: string;
    };

    if (!body.category || body.quantity == null || !body.reason) {
      return NextResponse.json(
        { error: "Missing required fields: category, quantity, reason" },
        { status: 400 },
      );
    }

    const entry = await logWaste(restaurantId, {
      category: body.category,
      quantity: body.quantity,
      unit: body.unit,
      reason: body.reason,
      costCents: body.costCents,
      menuItemId: body.menuItemId,
      loggedBy: body.loggedBy,
      notes: body.notes,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === "AdminForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
