import crypto from "node:crypto";

import { Channel, MessageRole, ReservationStatus } from "@/generated/prisma/client";

import { site } from "@/content/site";
import { db } from "@/lib/db";
import { env, hasSms, hasWhatsApp } from "@/lib/env";
import { ensureConversation, recordMessage } from "@/lib/channels";
import { sendSms } from "@/lib/channels/sms";
import { sendWhatsAppTemplate } from "@/lib/channels/whatsapp";
import { serviceSlotOf, formatSlot } from "@/lib/hours";

/**
 * Rappels de réservation.
 *
 * Deux fenêtres : la veille pour les réservations prises à l'avance, et deux
 * heures avant pour celles prises le jour même — sinon un client qui réserve
 * à 15 h pour 20 h ne recevrait jamais de rappel.
 */

const DAY_BEFORE = { fromHours: 20, toHours: 28 };
const SAME_DAY = { fromHours: 1.5, toHours: 3 };

export type ReminderReport = {
  sent: number;
  failed: number;
  completed: number;
};

export async function sendDueReminders(
  now: Date = new Date(),
): Promise<ReminderReport> {
  const candidates = await db.reservation.findMany({
    where: {
      status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING] },
      reminderSentAt: null,
      OR: [
        window(now, DAY_BEFORE.fromHours, DAY_BEFORE.toHours),
        window(now, SAME_DAY.fromHours, SAME_DAY.toHours),
      ],
    },
    include: { guest: true },
    take: 200,
  });

  let sent = 0;
  let failed = 0;

  for (const reservation of candidates) {
    if (reservation.guest.optedOut) {
      // On note quand même le rappel comme traité : inutile de le reprendre
      // à chaque passage du cron.
      await db.reservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: now },
      });
      continue;
    }

    const locale = reservation.guest.locale;
    const { minutes } = serviceSlotOf(reservation.startsAt);
    const time = formatSlot(minutes);

    const result = await deliverReminder(reservation.guest.phone, locale, {
      date: reservation.serviceDate,
      time,
      partySize: reservation.partySize,
      reference: reservation.reference,
    });

    if (result.ok) {
      sent += 1;
      await db.reservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: now },
      });
      await logReminder(reservation.guestId, result.channel, result.body, locale);
    } else {
      failed += 1;
      console.error("[rappels] envoi impossible", {
        reference: reservation.reference,
        reason: result.reason,
      });
    }
  }

  const completed = await closeFinishedServices(now);

  return { sent, failed, completed };
}

// --------------------------------------------------------------------------

type ReminderData = {
  date: string;
  time: string;
  partySize: number;
  reference: string;
};

type DeliveryResult =
  | { ok: true; channel: Channel; body: string }
  | { ok: false; reason: string };

async function deliverReminder(
  phone: string,
  locale: string,
  data: ReminderData,
): Promise<DeliveryResult> {
  const body = reminderText(locale, data);

  if (hasWhatsApp) {
    // Hors fenêtre de 24 h, seul un modèle approuvé passe. Sans modèle
    // configuré, on ne tente pas : Meta rejetterait le texte libre.
    const result = env.WHATSAPP_REMINDER_TEMPLATE
      ? await sendWhatsAppTemplate(
          phone,
          env.WHATSAPP_REMINDER_TEMPLATE,
          templateLanguage(locale),
          [data.date, data.time, String(data.partySize), data.reference],
        )
      : { ok: false as const, reason: "aucun modèle WhatsApp configuré" };

    if (result.ok) return { ok: true, channel: Channel.WHATSAPP, body };
  }

  if (hasSms) {
    const result = await sendSms(phone, body);
    if (result.ok) return { ok: true, channel: Channel.SMS, body };
    return { ok: false, reason: result.reason };
  }

  return { ok: false, reason: "aucun canal disponible" };
}

function reminderText(locale: string, data: ReminderData): string {
  const { date, time, partySize, reference } = data;

  if (locale === "ar") {
    return `تذكير: طاولتك في ${site.name} يوم ${date} على ${time} لـ ${partySize} أشخاص (${reference}). ردَّ بـ «نعم» للتأكيد أو «لا» للإلغاء.`;
  }
  if (locale === "en") {
    return `Reminder: your table at ${site.name} on ${date} at ${time} for ${partySize} (${reference}). Reply YES to confirm or NO to cancel.`;
  }
  return `Rappel : votre table au ${site.name} le ${date} à ${time} pour ${partySize} personne(s) (${reference}). Répondez OUI pour confirmer, NON pour annuler.`;
}

function templateLanguage(locale: string): string {
  return { fr: "fr", ar: "ar", en: "en" }[locale] ?? "fr";
}

async function logReminder(
  guestId: string,
  channel: Channel,
  body: string,
  locale: string,
): Promise<void> {
  const conversation = await ensureConversation(guestId, channel, locale);
  await recordMessage(conversation.id, MessageRole.AGENT, body);
}

/**
 * Ménage : une table encore marquée « installée » deux heures après la fin du
 * service ne l'est plus vraiment. Sans ça, la capacité se met à mentir.
 */
async function closeFinishedServices(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - 2 * 60 * 60_000);
  const result = await db.reservation.updateMany({
    where: { status: ReservationStatus.SEATED, endsAt: { lt: cutoff } },
    data: { status: ReservationStatus.COMPLETED, completedAt: now, tableId: null },
  });
  return result.count;
}

function window(now: Date, fromHours: number, toHours: number) {
  return {
    startsAt: {
      gte: new Date(now.getTime() + fromHours * 3_600_000),
      lt: new Date(now.getTime() + toHours * 3_600_000),
    },
  };
}

/** Comparaison à temps constant du secret du cron. */
export function isAuthorizedCron(request: Request): boolean {
  if (!env.CRON_SECRET) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
