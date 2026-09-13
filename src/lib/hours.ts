/**
 * Horaires d'ouverture et créneaux réservables.
 *
 * Convention interne : les heures sont des **minutes depuis minuit du jour de
 * service**. Une fermeture à 2 h du matin vaut donc 1560, pas 120 — c'est ce qui
 * permet de traiter « vendredi 1 h du matin » comme la fin du service du
 * vendredi et non comme le début de celui du samedi.
 */

import { site } from "@/content/site";
import {
  addDays,
  hmToMinutes,
  minutesToHM,
  parseLocalDateTime,
  toISODate,
  toZoned,
  weekdayOf,
} from "@/lib/time";

const TZ = site.timezone;

export type ServiceWindow = {
  /** Date de service au format ISO (le jour où le service commence). */
  serviceDate: string;
  /** Minutes depuis minuit du jour de service. */
  open: number;
  close: number;
};

export type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string; opensWeekday: number; today: boolean };

/** Fenêtre de service d'une date donnée, ou `null` si l'on n'ouvre pas. */
export function serviceWindow(isoDate: string): ServiceWindow | null {
  if (site.closedDates.includes(isoDate)) return null;

  const hours = site.hours.find((h) => h.day === weekdayOf(isoDate));
  if (!hours) return null;

  const open = hmToMinutes(hours.open);
  const close = hmToMinutes(hours.close);
  if (close <= open) return null;

  return { serviceDate: isoDate, open, close };
}

/**
 * Fenêtres actives à une date calendaire : celle qui démarre ce jour-là, et la
 * queue de la veille si le service s'est prolongé après minuit.
 */
function windowsCovering(isoDate: string): Array<{
  window: ServiceWindow;
  /** Décalage à appliquer pour comparer à l'heure de cette date calendaire. */
  shift: number;
}> {
  const result: Array<{ window: ServiceWindow; shift: number }> = [];

  const previous = serviceWindow(addDays(isoDate, -1));
  if (previous && previous.close > 1440) {
    result.push({ window: previous, shift: -1440 });
  }

  const today = serviceWindow(isoDate);
  if (today) result.push({ window: today, shift: 0 });

  return result;
}

/** L'établissement est-il ouvert à cette heure locale de cette date ? */
export function isOpenAtLocal(isoDate: string, minutes: number): boolean {
  return windowsCovering(isoDate).some(
    ({ window, shift }) =>
      minutes >= window.open + shift && minutes < window.close + shift,
  );
}

/** Ouvert ou fermé maintenant, et jusqu'à / à partir de quand. */
export function openStatus(now: Date = new Date()): OpenStatus {
  const parts = toZoned(now, TZ);
  const isoDate = toISODate(now, TZ);
  const minutes = parts.hour * 60 + parts.minute;

  for (const { window, shift } of windowsCovering(isoDate)) {
    if (minutes >= window.open + shift && minutes < window.close + shift) {
      return { open: true, closesAt: minutesToHM(window.close) };
    }
  }

  // Prochaine ouverture, dans les huit jours qui viennent.
  for (let offset = 0; offset < 8; offset += 1) {
    const date = addDays(isoDate, offset);
    const window = serviceWindow(date);
    if (!window) continue;
    if (offset === 0 && minutes >= window.open) continue;

    return {
      open: false,
      opensAt: minutesToHM(window.open),
      opensWeekday: weekdayOf(date),
      today: offset === 0,
    };
  }

  return { open: false, opensAt: "", opensWeekday: -1, today: false };
}

/**
 * Le service qui a cours, et où l'on se trouve dedans.
 *
 * Sert au cadran de la porte : on veut la fenêtre en cours — celle d'hier si
 * l'on est à 1 h du matin — et la position de l'instant présent à l'intérieur.
 * Hors service, on rend la fenêtre qui s'ouvre aujourd'hui, sans position :
 * la porte est dessinée, mais éteinte.
 */
export function activeService(now: Date = new Date()): {
  window: ServiceWindow;
  /** Minutes depuis minuit du jour de service, ou `null` hors ouverture. */
  nowMinutes: number | null;
} | null {
  const isoDate = toISODate(now, TZ);
  const parts = toZoned(now, TZ);
  const minutes = parts.hour * 60 + parts.minute;

  for (const { window, shift } of windowsCovering(isoDate)) {
    if (minutes >= window.open + shift && minutes < window.close + shift) {
      return { window, nowMinutes: minutes - shift };
    }
  }

  const today = serviceWindow(isoDate);
  return today ? { window: today, nowMinutes: null } : null;
}

/** Dernière installation possible pour une fenêtre de service. */
export function lastSeating(window: ServiceWindow): number {
  return window.close - site.booking.lastSeatingBufferMinutes;
}

/**
 * Créneaux réservables d'une date de service, en minutes depuis minuit.
 * `from` permet d'écarter les créneaux déjà passés (préavis compris).
 */
export function slotsFor(isoDate: string, now: Date = new Date()): number[] {
  const window = serviceWindow(isoDate);
  if (!window) return [];

  const { slotMinutes, minLeadMinutes } = site.booking;
  const earliestInstant = now.getTime() + minLeadMinutes * 60_000;
  const slots: number[] = [];

  for (
    let minute = ceilTo(window.open, slotMinutes);
    minute <= lastSeating(window);
    minute += slotMinutes
  ) {
    const instant = slotInstant(isoDate, minute);
    if (!instant || instant.getTime() < earliestInstant) continue;
    slots.push(minute);
  }

  return slots;
}

/**
 * Instant UTC d'un créneau. Gère le passage de minuit : 1500 minutes le
 * vendredi, c'est 1 h du matin le samedi.
 */
export function slotInstant(isoDate: string, minutes: number): Date | null {
  const dayOffset = Math.floor(minutes / 1440);
  const withinDay = minutes - dayOffset * 1440;
  return parseLocalDateTime(
    addDays(isoDate, dayOffset),
    minutesToHM(withinDay),
    TZ,
  );
}

/**
 * Retrouve la date de service et le créneau d'un instant. Utilisé quand une
 * réservation revient de la base et qu'il faut la resituer dans un service.
 */
export function serviceSlotOf(instant: Date): {
  serviceDate: string;
  minutes: number;
} {
  const parts = toZoned(instant, TZ);
  const isoDate = toISODate(instant, TZ);
  const minutes = parts.hour * 60 + parts.minute;

  const previous = serviceWindow(addDays(isoDate, -1));
  if (previous && previous.close > 1440 && minutes < previous.close - 1440) {
    return { serviceDate: previous.serviceDate, minutes: minutes + 1440 };
  }

  return { serviceDate: isoDate, minutes };
}

/** Affichage d'un créneau : 1500 → « 01:00 ». */
export function formatSlot(minutes: number): string {
  return minutesToHM(minutes);
}

function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}
