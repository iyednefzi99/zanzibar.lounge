import { NextResponse } from "next/server";

import { getActiveRestaurants } from "@/lib/restaurant";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurants = await getActiveRestaurants();

    return NextResponse.json({
      ok: true,
      data: {
        restaurants: restaurants.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          address: r.address,
          phone: r.phone,
          timezone: r.timezone,
        })),
      },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.list", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
