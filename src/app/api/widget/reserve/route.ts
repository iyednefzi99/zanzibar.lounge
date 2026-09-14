import { Channel } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/content/site";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { normalizePhone } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createReservation } from "@/lib/reservations";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(24),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().min(0).max(2879),
  partySize: z.number().int().min(1).max(site.booking.maxPartySize),
  zone: z.enum(["terrasse", "salle", "salon"]).nullish(),
  notes: z.string().trim().max(400).nullish(),
  locale: z.enum(["fr", "ar", "en"]).default("fr"),
});

export async function POST(request: Request) {
  const ip = clientIp(request);

  const ipLimit = await rateLimit(`widget:reserve:ip:${ip}`, 6, 10 * 60_000);
  if (!ipLimit.allowed) {
    const response = NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(ipLimit.retryAfter) } },
    );
    addCors(response);
    return response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = NextResponse.json(
      { error: "invalid_body" },
      { status: 400 },
    );
    addCors(response);
    return response;
  }

  const parsed = body.safeParse(payload);
  if (!parsed.success) {
    const response = NextResponse.json(
      {
        error: "invalid_body",
        issues: parsed.error.issues.map((i) => i.path),
      },
      { status: 400 },
    );
    addCors(response);
    return response;
  }

  const input = parsed.data;

  const phone = normalizePhone(input.phone);
  if (!phone) {
    const response = NextResponse.json(
      { error: "booking_failed", code: "INVALID_PHONE" },
      { status: 400 },
    );
    addCors(response);
    return response;
  }

  const phoneLimit = await rateLimit(`widget:reserve:phone:${phone}`, 3, 60 * 60_000);
  if (!phoneLimit.allowed) {
    const response = NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(phoneLimit.retryAfter) } },
    );
    addCors(response);
    return response;
  }

  const restaurant = await getRestaurantBySlug(input.slug);
  if (!restaurant) {
    const response = NextResponse.json(
      { error: "booking_failed", code: "RESTAURANT_NOT_FOUND" },
      { status: 404 },
    );
    addCors(response);
    return response;
  }

  if (!restaurant.active) {
    const response = NextResponse.json(
      { error: "booking_failed", code: "RESTAURANT_INACTIVE" },
      { status: 404 },
    );
    addCors(response);
    return response;
  }

  const result = await createReservation({
    name: input.name,
    phone,
    serviceDate: input.date,
    minutes: input.minutes,
    partySize: input.partySize,
    zone: input.zone ?? null,
    notes: input.notes ?? null,
    channel: Channel.WEB,
    locale: input.locale,
    restaurantId: restaurant.id,
  });

  if (!result.ok) {
    const status = result.error.code === "FULL" ? 409 : 400;
    const response = NextResponse.json(
      { error: "booking_failed", ...result.error },
      { status },
    );
    addCors(response);
    return response;
  }

  const reservation = result.value;

  logger.info("widget.reservation.created", {
    slug: input.slug,
    reference: reservation.reference,
    partySize: reservation.partySize,
  });

  const response = NextResponse.json({
    ok: true,
    reference: reservation.reference,
    date: reservation.serviceDate,
    time: reservation.time,
    partySize: reservation.partySize,
    zone: reservation.zone,
  });

  addCors(response);
  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function addCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
}
