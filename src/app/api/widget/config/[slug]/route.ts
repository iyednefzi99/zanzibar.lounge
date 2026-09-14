import { NextResponse } from "next/server";

import { site } from "@/content/site";
import { getRestaurantBySlug } from "@/lib/restaurant";

export const runtime = "nodejs";
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

  const hours = site.hours.map((h) => ({
    day: h.day,
    open: h.open,
    close: h.close,
  }));

  const zones = site.zones.map((z) => ({
    id: z.id,
    capacity: z.capacity,
  }));

  const response = NextResponse.json({
    ok: true,
    data: {
      name: restaurant.name,
      slug: restaurant.slug,
      timezone: restaurant.timezone,
      locale: restaurant.locale,
      logoUrl: restaurant.logoUrl,
      brandColor: restaurant.brandColor,
      hours,
      zones,
      booking: {
        maxPartySize: site.booking.maxPartySize,
        slotMinutes: site.booking.slotMinutes,
        minLeadMinutes: site.booking.minLeadMinutes,
        maxDaysAhead: site.booking.maxDaysAhead,
      },
    },
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");

  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
