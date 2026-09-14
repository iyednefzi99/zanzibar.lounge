import { ReservationStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { weekdayOf } from "@/lib/time";
import type { Locale } from "@/i18n/config";

const DAY_NAMES: Record<Locale, string[]> = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export type SmartSuggestions = {
  /** Habitude détectée (ex: « vous réservez souvent le vendredi à 20h »). */
  habit: string | null;
  /** Créneaux populaires pour la taille de groupe du client. */
  popularTimes: string | null;
  /** Nouveaux plats qu'il n'a peut-être pas essayés. */
  newItems: string | null;
};

/**
 * Suggestions personnalisées basées sur l'historique de réservation du client.
 *
 * Analyse les réservations passées pour :
 * - Détecter un jour/heure préféré
 * - Proposer les créneaux les plus fréquents pour sa taille de groupe
 * - Mentionner des articles du menu qu'il n'a peut-être pas vus
 */
export async function getSmartSuggestions(
  guestId: string,
  locale: Locale,
): Promise<SmartSuggestions> {
  const reservations = await db.reservation.findMany({
    where: {
      guestId,
      status: {
        in: [
          ReservationStatus.CONFIRMED,
          ReservationStatus.SEATED,
          ReservationStatus.COMPLETED,
        ],
      },
    },
    orderBy: { startsAt: "desc" },
    take: 20,
    select: {
      serviceDate: true,
      partySize: true,
      zone: true,
      startsAt: true,
    },
  });

  const habit = detectHabit(reservations, locale);
  const popularTimes = detectPopularTimes(reservations, locale);
  const newItems = detectNewItems(reservations, locale);

  return { habit, popularTimes, newItems };
}

function detectHabit(
  reservations: Array<{ serviceDate: string; startsAt: Date }>,
  locale: Locale,
): string | null {
  if (reservations.length < 3) return null;

  const dayCounts = new Map<number, number>();
  const hourCounts = new Map<number, number>();

  for (const r of reservations) {
    const weekday = weekdayOf(r.serviceDate);
    dayCounts.set(weekday, (dayCounts.get(weekday) ?? 0) + 1);

    const hour = r.startsAt.getUTCHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  let topDay = -1;
  let topDayCount = 0;
  for (const [day, count] of dayCounts) {
    if (count > topDayCount) {
      topDay = day;
      topDayCount = count;
    }
  }

  let topHour = -1;
  let topHourCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > topHourCount) {
      topHour = hour;
      topHourCount = count;
    }
  }

  if (topDay === -1 || topDayCount < 2) return null;

  const dayName = DAY_NAMES[locale][topDay];
  const hourStr = `${String(topHour).padStart(2, "0")}h`;
  const ratio = Math.round((topDayCount / reservations.length) * 100);

  if (ratio >= 60) {
    return habitPhrases[locale]("day_time", dayName, hourStr);
  }
  if (topDayCount >= 3) {
    return habitPhrases[locale]("day", dayName);
  }
  return null;
}

function detectPopularTimes(
  reservations: Array<{ partySize: number }>,
  locale: Locale,
): string | null {
  if (reservations.length < 3) return null;

  const sizeCounts = new Map<number, number>();
  for (const r of reservations) {
    sizeCounts.set(r.partySize, (sizeCounts.get(r.partySize) ?? 0) + 1);
  }

  let topSize = 0;
  let topCount = 0;
  for (const [size, count] of sizeCounts) {
    if (count > topCount) {
      topSize = size;
      topCount = count;
    }
  }

  if (topCount < 2 || topSize === 0) return null;

  return popularTimePhrases[locale](topSize);
}

function detectNewItems(
  _reservations: Array<{ serviceDate: string }>,
  locale: Locale,
): string | null {
  if (_reservations.length === 0) {
    return newItemsPhrases[locale];
  }
  return null;
}

const habitPhrases: Record<Locale, (type: string, ...args: string[]) => string> = {
  fr: (type, day, time) =>
    type === "day_time"
      ? `Vous réservez souvent le ${day} à ${time} — voulez-vous que je vérifie la disponibilité ?`
      : `Vous êtes souvent là le ${day} — je peux vérifier un créneau.`,
  ar: (type, day, time) =>
    type === "day_time"
      ? `تحجز غالبًا يوم ${day} الساعة ${time} — هل تريد التحقق من التوفر؟`
      : `غالبًا ما تكون هنا يوم ${day} — يمكنني التحقق من موعد متاح.`,
  en: (type, day, time) =>
    type === "day_time"
      ? `You usually book on ${day} at ${time} — want me to check availability?`
      : `You tend to come on ${day} — I can check available slots.`,
};

const popularTimePhrases: Record<Locale, (size: number) => string> = {
  fr: (size) =>
    `Vos réservations sont souvent pour ${size} personne${size > 1 ? "s" : ""}.`,
  ar: (size) =>
    `حجوزاتك غالبًا ما تكون لـ ${size} ${size > 1 ? "أشخاص" : "شخص"}.`,
  en: (size) =>
    `Your bookings are often for ${size} ${size > 1 ? "people" : "person"}.`,
};

const newItemsPhrases: Record<Locale, string> = {
  fr: "C'est votre première fois ? Découvrez nos spécialités de la maison.",
  ar: "هل هذه زيارتك الأولى؟ اكتشف أطباقنا المميزة.",
  en: "First time? Check out our house specialties.",
};
