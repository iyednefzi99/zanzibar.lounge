import { NextRequest, NextResponse } from "next/server";

import { getActiveRestaurants } from "@/lib/restaurant";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await rateLimit(`v1:restaurants:ip:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

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
