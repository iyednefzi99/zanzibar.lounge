import { NextRequest, NextResponse } from "next/server";

import { getMenu } from "@/lib/orders";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = clientIp(request);
  const limit = await rateLimit(`v1:menu:ip:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

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

    const menu = await getMenu(restaurant.id);

    return NextResponse.json({
      ok: true,
      data: { items: menu },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.menu", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
