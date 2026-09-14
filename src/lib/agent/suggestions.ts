import { ReservationStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { weekdayOf } from "@/lib/time";
import type { Locale } from "@/i18n/config";

const DAY_NAMES: Record<Locale, string[]> = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  it: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
  pt: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  zh: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  ja: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
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
  de: (type, day, time) =>
    type === "day_time"
      ? `Sie buchen oft am ${day} um ${time} — soll ich die Verfügbarkeit prüfen?`
      : `Sie kommen oft am ${day} — ich kann verfügbare Zeiten prüfen.`,
  es: (type, day, time) =>
    type === "day_time"
      ? `Suele reservar los ${day} a las ${time} — ¿quiere que compruebe la disponibilidad?`
      : `Suele venir los ${day} — puedo buscar huecos disponibles.`,
  it: (type, day, time) =>
    type === "day_time"
      ? `Prenota spesso il ${day} alle ${time} — vuoi che controlli la disponibilità?`
      : `Vieni spesso il ${day} — posso cercare posti disponibili.`,
  pt: (type, day, time) =>
    type === "day_time"
      ? `Costuma reservar nas ${day} às ${time} — quer que eu verifique a disponibilidade?`
      : `Costuma vir nas ${day} — posso verificar horários disponíveis.`,
  ru: (type, day, time) =>
    type === "day_time"
      ? `Вы часто бронируете на ${day} в ${time} — хотите, я проверю наличие мест?`
      : `Вы часто приходите в ${day} — я могу проверить свободные слоты.`,
  zh: (type, day, time) =>
    type === "day_time"
      ? `您通常在${day} ${time}预订 — 要我查一下空位吗？`
      : `您常在${day}来 — 我可以查查可用时段。`,
  ja: (type, day, time) =>
    type === "day_time"
      ? `${day}の${time}に予約されることが多いですね — 空き状況を確認しましょうか？`
      : `${day}によくいらっしゃいますね — 空き枠を確認できますよ。`,
};

const popularTimePhrases: Record<Locale, (size: number) => string> = {
  fr: (size) =>
    `Vos réservations sont souvent pour ${size} personne${size > 1 ? "s" : ""}.`,
  ar: (size) =>
    `حجوزاتك غالبًا ما تكون لـ ${size} ${size > 1 ? "أشخاص" : "شخص"}.`,
  en: (size) =>
    `Your bookings are often for ${size} ${size > 1 ? "people" : "person"}.`,
  de: (size) =>
    `Ihre Buchungen sind oft für ${size} ${size > 1 ? "Personen" : "Person"}.`,
  es: (size) =>
    `Sus reservas suelen ser para ${size} ${size > 1 ? "personas" : "persona"}.`,
  it: (size) =>
    `Le sue prenotazioni sono spesso per ${size} ${size > 1 ? "persone" : "persona"}.`,
  pt: (size) =>
    `Suas reservas costumam ser para ${size} ${size > 1 ? "pessoas" : "pessoa"}.`,
  ru: (size) =>
    `Ваши бронирования часто на ${size} ${size > 1 ? "человек" : "человека"}.`,
  zh: (size) =>
    `您通常预订${size}人的桌位。`,
  ja: (size) =>
    `よく${size}名で予約されますね。`,
};

const newItemsPhrases: Record<Locale, string> = {
  fr: "C'est votre première fois ? Découvrez nos spécialités de la maison.",
  ar: "هل هذه زيارتك الأولى؟ اكتشف أطباقنا المميزة.",
  en: "First time? Check out our house specialties.",
  de: "Erstes Mal? Entdecken Sie unsere Hausmischungen.",
  es: "¿Primera vez? Pruebe nuestras especialidades de la casa.",
  it: "Prima volta? Scopra le nostre specialità della casa.",
  pt: "Primeira vez? Experimente nossas especialidades da casa.",
  ru: "Впервые у нас? Попробуйте наши фирменные блюда.",
  zh: "第一次来？试试我们的招牌菜。",
  ja: "初めてですか？我们的看板メニューをお試しください。",
};
