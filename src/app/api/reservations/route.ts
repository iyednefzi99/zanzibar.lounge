import { Channel } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/content/site";
import { locales } from "@/i18n/config";
import { sendOnBestChannel } from "@/lib/channels";
import { isOtpRequired, verifyCode } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createReservation } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(24),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().min(0).max(2879),
  partySize: z.number().int().min(1).max(site.booking.maxPartySize),
  zone: z.enum(["terrasse", "salle", "salon"]).nullish(),
  notes: z.string().trim().max(400).nullish(),
  locale: z.enum(locales).default("fr"),
  /** Code reçu par SMS ou WhatsApp, exigé si BOOKING_REQUIRE_OTP est actif. */
  code: z.string().trim().regex(/^\d{6}$/).optional(),
  /**
   * Champ leurre : rempli uniquement par les robots.
   *
   * Volontairement accepté par le schéma. Le refuser ici renverrait une erreur
   * nommant le champ — autrement dit, le mode d'emploi pour le contourner. Il
   * est traité plus bas, par une réponse de succès qui ne crée rien.
   */
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Deux garde-fous : un contre le martèlement d'une même adresse, un contre
  // la réservation en rafale d'un même numéro.
  const ipLimit = await rateLimit(`booking:ip:${ip}`, 8, 10 * 60_000);
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
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Le pot de miel a été rempli : on renvoie un succès crédible sans rien créer.
  if (input.website) {
    return NextResponse.json({ ok: true, reference: "ZL-0000" });
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "booking_failed", code: "INVALID_PHONE" },
      { status: 400 },
    );
  }

  const phoneLimit = await rateLimit(`booking:phone:${phone}`, 4, 60 * 60_000);
  if (!phoneLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(phoneLimit.retryAfter) } },
    );
  }

  // Vérification du numéro, quand elle est activée : on ne crée rien tant que
  // la personne n'a pas prouvé qu'elle reçoit les messages de ce numéro.
  if (isOtpRequired()) {
    const outcome = await verifyCode(phone, input.code ?? "");
    if (outcome !== "ok") {
      return NextResponse.json(
        { error: "booking_failed", code: "INVALID_CODE", reason: outcome },
        { status: 400 },
      );
    }
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
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "booking_failed", ...result.error },
      { status: result.error.code === "FULL" ? 409 : 400 },
    );
  }

  const reservation = result.value;

  // La confirmation part en arrière-plan : si WhatsApp est indisponible, le
  // client a déjà sa réservation à l'écran, et l'échec ne doit pas la masquer.
  void sendOnBestChannel(
    phone,
    confirmationText(input.locale, {
      name: input.name,
      date: reservation.serviceDate,
      time: reservation.time,
      partySize: reservation.partySize,
      reference: reservation.reference,
    }),
  ).catch((error) => {
    console.error("[reservations] confirmation non envoyée", {
      reference: reservation.reference,
      error: error instanceof Error ? error.message : error,
    });
  });

  return NextResponse.json({
    ok: true,
    reference: reservation.reference,
    date: reservation.serviceDate,
    time: reservation.time,
    partySize: reservation.partySize,
    zone: reservation.zone,
  });
}

function confirmationText(
  locale: string,
  data: {
    name: string;
    date: string;
    time: string;
    partySize: number;
    reference: string;
  },
): string {
  const { name, date, time, partySize, reference } = data;

  if (locale === "ar") {
    return `أهلاً ${name}، حجزك في ${site.name} مؤكَّد: ${date} على ${time} لـ ${partySize} أشخاص. المرجع ${reference}. للتعديل أو الإلغاء، ردَّ على هذه الرسالة.`;
  }
  if (locale === "en") {
    return `Hi ${name} — your table at ${site.name} is confirmed: ${date} at ${time} for ${partySize}. Reference ${reference}. Reply to this message to change or cancel.`;
  }
  return `Bonjour ${name}, votre table au ${site.name} est confirmée : le ${date} à ${time} pour ${partySize} personne(s). Référence ${reference}. Répondez à ce message pour modifier ou annuler.`;
}
