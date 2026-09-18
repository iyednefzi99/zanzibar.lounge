import { NextRequest, NextResponse } from "next/server";

import { getApprovedReviews } from "@/lib/reviews";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = clientIp(request);
  const rl = await rateLimit(`v1:reviews:ip:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  const { slug } = await params;
  const url = new URL(request.url);

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Missing slug" },
      { status: 400 },
    );
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
  const offsetRaw = url.searchParams.get("offset");
  const offset = offsetRaw ? Number(offsetRaw) : 0;

  if (limitRaw && (Number.isNaN(limit) || limit < 1)) {
    return NextResponse.json(
      { ok: false, error: "Invalid limit" },
      { status: 400 },
    );
  }
  if (offsetRaw && (Number.isNaN(offset) || offset < 0)) {
    return NextResponse.json(
      { ok: false, error: "Invalid offset" },
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

    const reviews = await getApprovedReviews(limit, offset);

    return NextResponse.json({
      ok: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          locale: r.locale,
          guest: r.guest,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.reviews", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
