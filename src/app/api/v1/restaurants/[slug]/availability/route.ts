import { NextRequest, NextResponse } from "next/server";

import { site } from "@/content/site";
import { availability } from "@/lib/reservations";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { serviceWindow } from "@/lib/hours";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = clientIp(request);
  const limit = await rateLimit(`v1:availability:ip:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
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

  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { ok: false, error: "Invalid or missing date param (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const partyRaw = url.searchParams.get("party");
  const party = partyRaw ? Number(partyRaw) : 2;
  if (!Number.isInteger(party) || party < 1 || party > site.booking.maxPartySize) {
    return NextResponse.json(
      { ok: false, error: `Party size must be 1–${site.booking.maxPartySize}` },
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

    if (!serviceWindow(date)) {
      return NextResponse.json({
        ok: true,
        data: { date, closed: true, slots: [] },
      });
    }

    const slots = await availability(date, party, new Date(), restaurant.id);

    return NextResponse.json({
      ok: true,
      data: {
        date,
        partySize: party,
        closed: false,
        slots: slots.map((slot) => ({
          minutes: slot.minutes,
          label: slot.label,
          remaining: slot.remaining,
          available: slot.available,
        })),
      },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.availability", {
      slug,
      date,
      party,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
