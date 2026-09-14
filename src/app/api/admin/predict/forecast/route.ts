import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { forecastDemand, getForecasts } from "@/lib/predict";

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

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const restaurantId = await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json(
        { error: "Missing query parameter: date" },
        { status: 400 },
      );
    }

    const date = new Date(dateStr);
    const forecasts = await getForecasts(restaurantId, date);
    return NextResponse.json(forecasts);
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
      date?: string;
      hour?: number;
      dayOfWeek?: number;
      predictedCovers?: number;
      confidence?: number;
      factors?: Record<string, unknown>[];
    };

    if (!body.date || body.hour == null || body.dayOfWeek == null) {
      return NextResponse.json(
        { error: "Missing required fields: date, hour, dayOfWeek" },
        { status: 400 },
      );
    }

    const entry = await forecastDemand(restaurantId, {
      date: new Date(body.date),
      hour: body.hour,
      dayOfWeek: body.dayOfWeek,
      predictedCovers: body.predictedCovers ?? 0,
      confidence: body.confidence ?? 0.5,
      factors: body.factors,
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
