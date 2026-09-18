import { Channel } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/content/site";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { createReservation } from "@/lib/reservations";
import { normalizePhone } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(24),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().min(0).max(2879),
  partySize: z.number().int().min(1).max(site.booking.maxPartySize),
  zone: z.enum(["terrasse", "salle", "salon"]).nullish(),
  notes: z.string().trim().max(400).nullish(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = clientIp(request);

  const ipLimit = await rateLimit(`v1:booking:ip:${ip}`, 8, 10 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(ipLimit.retryAfter) } },
    );
  }

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Missing slug" },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

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

    const phone = normalizePhone(input.phone);
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const phoneLimit = await rateLimit(`v1:booking:phone:${phone}`, 4, 60 * 60_000);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "retry-after": String(phoneLimit.retryAfter) } },
      );
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
      restaurantId: restaurant.id,
    });

    if (!result.ok) {
      const status =
        result.error.code === "FULL" ? 409 : 400;
      return NextResponse.json(
        { ok: false, error: result.error.code },
        { status },
      );
    }

    const reservation = result.value;

    return NextResponse.json({
      ok: true,
      data: {
        reference: reservation.reference,
        date: reservation.serviceDate,
        time: reservation.time,
        partySize: reservation.partySize,
        zone: reservation.zone,
      },
    });
  } catch (error) {
    logger.error("api.v1.restaurants.reservations.create", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
