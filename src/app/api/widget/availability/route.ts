import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/content/site";
import { availability } from "@/lib/reservations";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { serviceWindow } from "@/lib/hours";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const query = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  party: z.coerce.number().int().min(1).max(site.booking.maxPartySize).default(2),
});

export async function GET(request: Request) {
  const limit = await rateLimit(`widget:availability:${clientIp(request)}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const url = new URL(request.url);
  const parsed = query.safeParse({
    slug: url.searchParams.get("slug"),
    date: url.searchParams.get("date"),
    party: url.searchParams.get("party") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { slug, date, party } = parsed.data;

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
    const response = NextResponse.json({
      ok: true,
      data: { date, closed: true, slots: [] },
    });
    addCors(response);
    return response;
  }

  const slots = await availability(date, party, new Date(), restaurant.id);

  const response = NextResponse.json({
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

  addCors(response);
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

function addCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
}
