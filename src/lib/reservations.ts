/**
 * Le cœur métier : disponibilités, création, modification et annulation.
 *
 * Le formulaire du site et l'agent WhatsApp/SMS passent tous les deux par ici.
 * Aucune règle (horaires, capacité, préavis) ne doit être réécrite ailleurs —
 * sinon l'agent finira par promettre une table que le site refuse.
 */

import { Channel, Prisma, ReservationStatus, Zone } from "@/generated/prisma/client";

import { site, type ZoneId } from "@/content/site";
import { db } from "@/lib/db";
import {
  formatSlot,
  isOpenAtLocal,
  lastSeating,
  serviceWindow,
  slotInstant,
  slotsFor,
} from "@/lib/hours";
import { normalizePhone } from "@/lib/phone";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { addDays, toISODate } from "@/lib/time";

const TZ = site.timezone;

/** Statuts qui occupent réellement une table. */
const ACTIVE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.SEATED,
];

export type BookingError =
  | { code: "INVALID_PHONE" }
  | { code: "INVALID_NAME" }
  | { code: "INVALID_DATE" }
  | { code: "INVALID_PARTY_SIZE" }
  | { code: "CLOSED" }
  | { code: "TOO_SOON"; minutes: number }
  | { code: "TOO_FAR"; days: number }
  | { code: "PARTY_TOO_LARGE"; max: number }
  | { code: "FULL"; alternatives: string[] }
  | { code: "NOT_FOUND" }
  | { code: "ALREADY_CANCELLED" };

export type BookingResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: BookingError };

export type BookingInput = {
  name: string;
  phone: string;
  /** Date de service, AAAA-MM-JJ. */
  serviceDate: string;
  /** Minutes depuis minuit du jour de service (1500 = 1 h du matin). */
  minutes: number;
  partySize: number;
  zone?: ZoneId | null;
  notes?: string | null;
  channel: Channel;
  locale?: string;
  restaurantId?: string;
};

export type SlotAvailability = {
  minutes: number;
  /** « 19:30 » */
  label: string;
  /** Couverts encore disponibles sur ce créneau. */
  remaining: number;
  available: boolean;
};

// --------------------------------------------------------------------------
// Disponibilités
// --------------------------------------------------------------------------

/** Créneaux d'une date de service, avec le nombre de couverts restants. */
export async function availability(
  serviceDate: string,
  partySize = 1,
  now: Date = new Date(),
  restaurantId?: string,
): Promise<SlotAvailability[]> {
  const slots = slotsFor(serviceDate, now);
  if (slots.length === 0) return [];

  const rid = restaurantId ?? await getDefaultRestaurantId();
  const booked = await bookedCoversByMinute(serviceDate, rid);

  return slots.map((minutes) => {
    const taken = overlappingCovers(booked, minutes);
    const remaining = Math.max(0, site.booking.maxCoversPerSlot - taken);
    return {
      minutes,
      label: formatSlot(minutes),
      remaining,
      available: remaining >= partySize,
    };
  });
}

/** Jusqu'à trois créneaux proches encore libres, pour proposer une porte de sortie. */
export async function nearestAlternatives(
  serviceDate: string,
  minutes: number,
  partySize: number,
  now: Date = new Date(),
): Promise<string[]> {
  const sameDay = (await availability(serviceDate, partySize, now))
    .filter((slot) => slot.available)
    .sort(
      (a, b) => Math.abs(a.minutes - minutes) - Math.abs(b.minutes - minutes),
    )
    .slice(0, 3)
    .map((slot) => slot.label);

  if (sameDay.length > 0) return sameDay;

  // Rien ce jour-là : on regarde le lendemain.
  const nextDay = addDays(serviceDate, 1);
  return (await availability(nextDay, partySize, now))
    .filter((slot) => slot.available)
    .slice(0, 2)
    .map((slot) => `${nextDay} ${slot.label}`);
}

// --------------------------------------------------------------------------
// Création
// --------------------------------------------------------------------------

export async function createReservation(
  input: BookingInput,
  now: Date = new Date(),
): Promise<BookingResult<ReservationSummary>> {
  const validated = validate(input, now);
  if (!validated.ok) return validated;

  const { startsAt, endsAt } = validated.value;
  const phone = normalizePhone(input.phone)!;
  const name = input.name.trim();
  const restaurantId = input.restaurantId ?? await getDefaultRestaurantId();

  try {
    const reservation = await db.$transaction(
      async (tx) => {
        const taken = await coversBetween(tx, startsAt, endsAt, restaurantId);
        if (taken + input.partySize > site.booking.maxCoversPerSlot) {
          throw new CapacityError();
        }

        const guest = await tx.guest.upsert({
          where: { phone },
          create: {
            phone,
            name,
            locale: input.locale ?? "fr",
          },
          update: {
            name,
            ...(input.locale ? { locale: input.locale } : {}),
          },
        });

        const tableId = await pickTable(
          tx,
          startsAt,
          endsAt,
          input.partySize,
          input.zone ?? null,
          restaurantId,
        );

        return tx.reservation.create({
          data: {
            restaurantId,
            reference: newReference(),
            guestId: guest.id,
            startsAt,
            endsAt,
            serviceDate: input.serviceDate,
            partySize: input.partySize,
            zone: toPrismaZone(input.zone ?? null),
            tableId,
            status: ReservationStatus.CONFIRMED,
            channel: input.channel,
            notes: input.notes?.trim() || null,
          },
          include: { guest: true, table: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true, value: summarize(reservation) };
  } catch (error) {
    if (error instanceof CapacityError || isSerializationFailure(error)) {
      const alternatives = await nearestAlternatives(
        input.serviceDate,
        input.minutes,
        input.partySize,
        now,
      );
      return { ok: false, error: { code: "FULL", alternatives } };
    }
    throw error;
  }
}

// --------------------------------------------------------------------------
// Consultation, modification, annulation
// --------------------------------------------------------------------------

export type ReservationSummary = {
  id: string;
  reference: string;
  guestId: string;
  name: string | null;
  phone: string;
  serviceDate: string;
  minutes: number;
  time: string;
  partySize: number;
  zone: ZoneId | null;
  table: string | null;
  status: ReservationStatus;
  channel: Channel;
  notes: string | null;
  startsAt: Date;
};

/** Réservations à venir d'un numéro donné, de la plus proche à la plus lointaine. */
export async function upcomingForPhone(
  phone: string,
  now: Date = new Date(),
): Promise<ReservationSummary[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const rows = await db.reservation.findMany({
    where: {
      guest: { phone: normalized },
      startsAt: { gte: new Date(now.getTime() - 30 * 60_000) },
      status: { in: ACTIVE_STATUSES },
    },
    include: { guest: true, table: true },
    orderBy: { startsAt: "asc" },
  });

  return rows.map(summarize);
}

export async function findByReference(
  reference: string,
  restaurantId?: string,
): Promise<ReservationSummary | null> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const row = await db.reservation.findUnique({
    where: { restaurantId_reference: { restaurantId: rid, reference: reference.trim().toUpperCase() } },
    include: { guest: true, table: true },
  });
  return row ? summarize(row) : null;
}

/** Réservations d'un service, pour le back-office. */
export async function reservationsForDate(
  serviceDate: string,
  restaurantId?: string,
): Promise<ReservationSummary[]> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const rows = await db.reservation.findMany({
    where: { serviceDate, restaurantId: rid },
    include: { guest: true, table: true },
    orderBy: { startsAt: "asc" },
  });
  return rows.map(summarize);
}

export async function rescheduleReservation(
  reference: string,
  next: { serviceDate: string; minutes: number; partySize?: number },
  now: Date = new Date(),
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const existing = await db.reservation.findUnique({
    where: { restaurantId_reference: { restaurantId: rid, reference: reference.trim().toUpperCase() } },
    include: { guest: true },
  });
  if (!existing) return { ok: false, error: { code: "NOT_FOUND" } };
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    return { ok: false, error: { code: "ALREADY_CANCELLED" } };
  }

  const partySize = next.partySize ?? existing.partySize;
  const validated = validate(
    {
      name: existing.guest.name ?? "—",
      phone: existing.guest.phone,
      serviceDate: next.serviceDate,
      minutes: next.minutes,
      partySize,
      channel: existing.channel,
    },
    now,
  );
  if (!validated.ok) return validated;

  const { startsAt, endsAt } = validated.value;

  try {
    const updated = await db.$transaction(
      async (tx) => {
        const taken = await coversBetween(tx, startsAt, endsAt, rid, existing.id);
        if (taken + partySize > site.booking.maxCoversPerSlot) {
          throw new CapacityError();
        }

        const tableId = await pickTable(
          tx,
          startsAt,
          endsAt,
          partySize,
          fromPrismaZone(existing.zone),
          rid,
          existing.id,
        );

        return tx.reservation.update({
          where: { id: existing.id },
          data: {
            startsAt,
            endsAt,
            serviceDate: next.serviceDate,
            partySize,
            tableId,
            // Un déplacement remet la confirmation du client à zéro.
            confirmedByGuestAt: null,
            reminderSentAt: null,
          },
          include: { guest: true, table: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true, value: summarize(updated) };
  } catch (error) {
    if (error instanceof CapacityError || isSerializationFailure(error)) {
      const alternatives = await nearestAlternatives(
        next.serviceDate,
        next.minutes,
        partySize,
        now,
      );
      return { ok: false, error: { code: "FULL", alternatives } };
    }
    throw error;
  }
}

export async function cancelReservation(
  reference: string,
  by: "guest" | "staff" | "agent",
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const existing = await db.reservation.findUnique({
    where: { restaurantId_reference: { restaurantId: rid, reference: reference.trim().toUpperCase() } },
  });
  if (!existing) return { ok: false, error: { code: "NOT_FOUND" } };
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    return { ok: false, error: { code: "ALREADY_CANCELLED" } };
  }

  const updated = await db.reservation.update({
    where: { id: existing.id },
    data: {
      status: ReservationStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: by,
      tableId: null,
    },
    include: { guest: true, table: true },
  });

  return { ok: true, value: summarize(updated) };
}

/** Installe le client à sa table (bouton « Installer » du back-office). */
export async function seatReservation(
  reference: string,
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  return transition(reference, ReservationStatus.SEATED, { seatedAt: new Date() }, restaurantId);
}

/** Libère la table à la fin du repas. */
export async function completeReservation(
  reference: string,
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  const result = await transition(reference, ReservationStatus.COMPLETED, {
    completedAt: new Date(),
    tableId: null,
  }, restaurantId);

  // Accumuler les points de fidélité après une réservation terminée
  if (result.ok) {
    const { accrueForReservation } = await import("@/lib/loyalty");
    await accrueForReservation(
      result.value.guestId,
      result.value.partySize,
      result.value.reference,
    ).catch(() => {
      // Ne pas faire échouer la réservation si la fidélité échoue
    });
  }

  return result;
}

export async function markNoShow(
  reference: string,
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  return transition(reference, ReservationStatus.NO_SHOW, { tableId: null }, restaurantId);
}

async function transition(
  reference: string,
  status: ReservationStatus,
  // `Unchecked` autorise l'écriture directe de la clé étrangère `tableId`,
  // ce que la variante vérifiée réserve à l'objet relation.
  extra: Prisma.ReservationUncheckedUpdateInput,
  restaurantId?: string,
): Promise<BookingResult<ReservationSummary>> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const existing = await db.reservation.findUnique({
    where: { restaurantId_reference: { restaurantId: rid, reference: reference.trim().toUpperCase() } },
  });
  if (!existing) return { ok: false, error: { code: "NOT_FOUND" } };

  const updated = await db.reservation.update({
    where: { id: existing.id },
    data: { status, ...extra },
    include: { guest: true, table: true },
  });
  return { ok: true, value: summarize(updated) };
}

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

function validate(
  input: Omit<BookingInput, "notes" | "zone" | "locale">,
  now: Date,
): BookingResult<{ startsAt: Date; endsAt: Date }> {
  if (!input.name || input.name.trim().length < 2) {
    return { ok: false, error: { code: "INVALID_NAME" } };
  }

  if (!normalizePhone(input.phone)) {
    return { ok: false, error: { code: "INVALID_PHONE" } };
  }

  if (
    !Number.isInteger(input.partySize) ||
    input.partySize < 1 ||
    input.partySize > site.booking.maxPartySize
  ) {
    return input.partySize > site.booking.maxPartySize
      ? {
          ok: false,
          error: {
            code: "PARTY_TOO_LARGE",
            max: site.booking.maxPartySize,
          },
        }
      : { ok: false, error: { code: "INVALID_PARTY_SIZE" } };
  }

  const window = serviceWindow(input.serviceDate);
  if (!window) return { ok: false, error: { code: "CLOSED" } };

  const withinService =
    input.minutes >= window.open &&
    input.minutes <= lastSeating(window) &&
    isOpenAtLocal(input.serviceDate, Math.min(input.minutes, 1439));
  if (!withinService) return { ok: false, error: { code: "CLOSED" } };

  const startsAt = slotInstant(input.serviceDate, input.minutes);
  if (!startsAt) return { ok: false, error: { code: "INVALID_DATE" } };

  const leadMs = site.booking.minLeadMinutes * 60_000;
  if (startsAt.getTime() - now.getTime() < leadMs) {
    return {
      ok: false,
      error: { code: "TOO_SOON", minutes: site.booking.minLeadMinutes },
    };
  }

  const horizon = addDays(toISODate(now, TZ), site.booking.maxDaysAhead);
  if (input.serviceDate > horizon) {
    return {
      ok: false,
      error: { code: "TOO_FAR", days: site.booking.maxDaysAhead },
    };
  }

  const endsAt = new Date(
    startsAt.getTime() + site.booking.turnoverMinutes * 60_000,
  );

  return { ok: true, value: { startsAt, endsAt } };
}

// --------------------------------------------------------------------------
// Capacité et tables
// --------------------------------------------------------------------------

class CapacityError extends Error {}

type TxClient = Prisma.TransactionClient;

/** Couverts déjà réservés sur la plage donnée. */
async function coversBetween(
  tx: TxClient,
  startsAt: Date,
  endsAt: Date,
  restaurantId: string,
  excludeId?: string,
): Promise<number> {
  const result = await tx.reservation.aggregate({
    _sum: { partySize: true },
    where: {
      restaurantId,
      status: { in: ACTIVE_STATUSES },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return result._sum.partySize ?? 0;
}

/**
 * Attribue la plus petite table libre qui accueille le groupe. Renvoie `null`
 * si aucune table n'est enregistrée — la capacité globale fait alors seule loi,
 * et le placement se règle en salle.
 */
async function pickTable(
  tx: TxClient,
  startsAt: Date,
  endsAt: Date,
  partySize: number,
  zone: ZoneId | null,
  restaurantId: string,
  excludeReservationId?: string,
): Promise<string | null> {
  const candidates = await tx.restaurantTable.findMany({
    where: {
      restaurantId,
      active: true,
      capacity: { gte: partySize },
      ...(zone ? { zone: toPrismaZone(zone)! } : {}),
    },
    orderBy: [{ capacity: "asc" }, { name: "asc" }],
  });
  if (candidates.length === 0) return null;

  const busy = await tx.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ACTIVE_STATUSES },
      tableId: { in: candidates.map((table) => table.id) },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    select: { tableId: true },
  });

  const busyIds = new Set(busy.map((row) => row.tableId));
  return candidates.find((table) => !busyIds.has(table.id))?.id ?? null;
}

/** Couverts par créneau sur une date, pour l'affichage des disponibilités. */
async function bookedCoversByMinute(
  serviceDate: string,
  restaurantId: string,
): Promise<Array<{ start: number; end: number; covers: number }>> {
  const window = serviceWindow(serviceDate);
  if (!window) return [];

  const dayStart = slotInstant(serviceDate, window.open);
  const dayEnd = slotInstant(serviceDate, window.close);
  if (!dayStart || !dayEnd) return [];

  const rows = await db.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ACTIVE_STATUSES },
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    select: { startsAt: true, endsAt: true, partySize: true },
  });

  return rows.map((row) => ({
    start: Math.round((row.startsAt.getTime() - dayStart.getTime()) / 60_000) +
      window.open,
    end: Math.round((row.endsAt.getTime() - dayStart.getTime()) / 60_000) +
      window.open,
    covers: row.partySize,
  }));
}

function overlappingCovers(
  booked: Array<{ start: number; end: number; covers: number }>,
  minutes: number,
): number {
  const end = minutes + site.booking.turnoverMinutes;
  return booked
    .filter((row) => row.start < end && row.end > minutes)
    .reduce((total, row) => total + row.covers, 0);
}

// --------------------------------------------------------------------------
// Utilitaires
// --------------------------------------------------------------------------

/** Alphabet sans I, O, 0 ni 1 : une référence se dicte au téléphone. */
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newReference(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (byte) =>
    REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length],
  ).join("");
  return `ZL-${code}`;
}

function toPrismaZone(zone: ZoneId | null): Zone | null {
  if (!zone) return null;
  return { terrasse: Zone.TERRASSE, salle: Zone.SALLE, salon: Zone.SALON }[zone];
}

function fromPrismaZone(zone: Zone | null): ZoneId | null {
  if (!zone) return null;
  return { TERRASSE: "terrasse", SALLE: "salle", SALON: "salon" }[zone] as ZoneId;
}

type ReservationRow = Prisma.ReservationGetPayload<{
  include: { guest: true; table: true };
}>;

function summarize(row: ReservationRow): ReservationSummary {
  const minutes = minutesOf(row.serviceDate, row.startsAt);
  return {
    id: row.id,
    reference: row.reference,
    guestId: row.guestId,
    name: row.guest.name,
    phone: row.guest.phone,
    serviceDate: row.serviceDate,
    minutes,
    time: formatSlot(minutes),
    partySize: row.partySize,
    zone: fromPrismaZone(row.zone),
    table: row.table?.name ?? null,
    status: row.status,
    channel: row.channel,
    notes: row.notes,
    startsAt: row.startsAt,
  };
}

/** Minutes depuis minuit du jour de service, en tenant compte du passage de minuit. */
function minutesOf(serviceDate: string, startsAt: Date): number {
  const base = slotInstant(serviceDate, 0);
  if (!base) return 0;
  return Math.round((startsAt.getTime() - base.getTime()) / 60_000);
}

/**
 * Prisma remonte les conflits de sérialisation en P2034 : deux réservations ont
 * visé le même créneau au même instant. Du point de vue du client, c'est
 * « complet ».
 */
function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2002")
  );
}
