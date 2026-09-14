import { NextResponse } from "next/server";

import { getRestaurantBySlug } from "@/lib/restaurant";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Missing slug" },
      { status: 400 },
    );
  }

  try {
    const restaurant = await getRestaurantBySlug(slug);

    if (!restaurant) {
      return NextResponse.json(
        { ok: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    if (!restaurant.active) {
      return NextResponse.json(
        { ok: false, error: "Restaurant is inactive" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          phone: restaurant.phone,
          timezone: restaurant.timezone,
          locale: restaurant.locale,
        },
      },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.get", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
