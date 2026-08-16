/**
 * Conversions de fuseau horaire sans dépendance : tout passe par `Intl`.
 *
 * Toutes les dates stockées en base sont des instants UTC. Tout ce que voit un
 * client — un créneau, un horaire d'ouverture, « demain » — est exprimé dans le
 * fuseau de l'établissement. Ces deux mondes ne se croisent qu'ici.
 */

export type ZonedParts = {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number;
  /** 0 = dimanche … 6 = samedi */
  weekday: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatterCache.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    formatterCache.set(timeZone, cached);
  }
  return cached;
}

/** Décompose un instant dans le fuseau demandé. */
export function toZoned(date: Date, timeZone: string): ZonedParts {
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    // Intl rend « 24 » pour minuit dans certains environnements.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: Math.max(0, WEEKDAYS.indexOf(get("weekday"))),
  };
}

/** Décalage du fuseau par rapport à UTC, en millisecondes, à cet instant. */
function offsetMs(date: Date, timeZone: string): number {
  const p = toZoned(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
  // On retire les millisecondes : `toZoned` ne les rend pas.
  return asUtc - (date.getTime() - (date.getTime() % 60000));
}

/**
 * Instant UTC correspondant à une date-heure locale du fuseau.
 * Deux passes suffisent à converger, même autour d'un changement d'heure.
 */
export function fromZoned(
  parts: Omit<ZonedParts, "weekday">,
  timeZone: string,
): Date {
  const naive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  let ts = naive - offsetMs(new Date(naive), timeZone);
  ts = naive - offsetMs(new Date(ts), timeZone);
  return new Date(ts);
}

/** « 2026-08-15 » + « 19:30 » → instant UTC. */
export function parseLocalDateTime(
  isoDate: string,
  time: string,
  timeZone: string,
): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, y, mo, d] = dateMatch;
  const [, h, mi] = timeMatch;
  const hour = Number(h);
  const minute = Number(mi);
  if (hour > 23 || minute > 59) return null;

  const utc = fromZoned(
    {
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour,
      minute,
    },
    timeZone,
  );

  // Rejette les dates impossibles (31 février) que `Date.UTC` normalise.
  const back = toZoned(utc, timeZone);
  if (back.day !== Number(d) || back.month !== Number(mo)) return null;

  return utc;
}

/** « 2026-08-15 » dans le fuseau de l'établissement. */
export function toISODate(date: Date, timeZone: string): string {
  const p = toZoned(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** « 19:30 » dans le fuseau de l'établissement. */
export function toHM(date: Date, timeZone: string): string {
  const p = toZoned(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** « 08:00 » → 480. Accepte « 26:00 » (2 h du matin le lendemain) → 1560. */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** 1560 → « 02:00 ». Les minutes au-delà de 24 h reviennent dans la journée. */
export function minutesToHM(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`;
}

/** 0 = dimanche … 6 = samedi, pour une date ISO nue. */
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
