import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/content/site";
import { availability } from "@/lib/reservations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { serviceWindow } from "@/lib/hours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const query = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : AAAA-MM-JJ"),
  party: z.coerce.number().int().min(1).max(site.booking.maxPartySize).default(2),
});

/** Créneaux libres d'une date — alimente le sélecteur d'heure du formulaire. */
export async function GET(request: Request) {
  const limit = await rateLimit(`availability:${clientIp(request)}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const url = new URL(request.url);
  const parsed = query.safeParse({
    date: url.searchParams.get("date"),
    party: url.searchParams.get("party") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { date, party } = parsed.data;

  if (!serviceWindow(date)) {
    return NextResponse.json({ date, closed: true, slots: [] });
  }

  const slots = await availability(date, party);

  return NextResponse.json({
    date,
    closed: false,
    slots: slots.map((slot) => ({
      minutes: slot.minutes,
      label: slot.label,
      available: slot.available,
    })),
  });
}
