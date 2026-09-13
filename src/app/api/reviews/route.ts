import { NextResponse } from "next/server";
import { z } from "zod";

import { createReview, getApprovedReviews } from "@/lib/reviews";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  reservationRef: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  phone: z.string().min(1),
  locale: z.enum(["fr", "ar", "en"]).default("fr"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  const reviews = await getApprovedReviews(limit, offset);
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rl = await rateLimit(`review:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { reservationRef, rating, title, body: reviewBody, phone, locale } = parsed.data;

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  let reservationId: string | undefined;
  if (reservationRef) {
    const reservation = await db.reservation.findFirst({
      where: { reference: reservationRef.trim().toUpperCase() },
    });
    if (reservation && reservation.guestId === guest.id) {
      reservationId = reservation.id;
    }
  }

  const result = await createReview({
    guestId: guest.id,
    reservationId,
    rating,
    title,
    body: reviewBody,
    locale,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
