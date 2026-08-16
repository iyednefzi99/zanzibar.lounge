import { NextResponse } from "next/server";
import { z } from "zod";

import { locales } from "@/i18n/config";
import { isOtpRequired, requestCode } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  phone: z.string().trim().min(6).max(24),
  locale: z.enum(locales).default("fr"),
});

/**
 * Envoi d'un code de vérification.
 *
 * Chaque appel coûte un SMS : les plafonds sont serrés, et la réponse est
 * toujours la même — dire « numéro inconnu » transformerait l'endpoint en
 * annuaire des clients.
 */
export async function POST(request: Request) {
  if (!isOtpRequired()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const ipLimit = await rateLimit(`otp:ip:${clientIp(request)}`, 10, 60 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(ipLimit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const phoneLimit = await rateLimit(`otp:phone:${phone}`, 3, 60 * 60_000);
  if (!phoneLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(phoneLimit.retryAfter) } },
    );
  }

  await requestCode(phone, parsed.data.locale);

  return NextResponse.json({ ok: true });
}
