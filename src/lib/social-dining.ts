/**
 * Social Dining
 *
 * Système de tables communes permettant à des clients de partager une table.
 * Utile pour les événements, les soirées à thème, ou les restaurants avec
 * des tables communes (ex: "Chef's Table").
 */

import { SocialTableStatus, SocialTableReservationStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────

export type SocialTableData = {
  id: string;
  name: string;
  totalSeats: number;
  minGroupSize: number;
  maxGroupSize: number;
  pricePerSeat: number;
  eventId: string | null;
  status: SocialTableStatus;
  active: boolean;
  availableSeats: number;
  reservations: SocialTableReservationData[];
};

export type SocialTableReservationData = {
  id: string;
  guestId: string;
  guestName: string | null;
  partySize: number;
  serviceDate: string;
  status: SocialTableReservationStatus;
  reservationId: string | null;
};

export type SocialTableAvailability = {
  available: boolean;
  seatsLeft: number;
  existingGuests: number;
  suggestedGroupSize?: number;
};

// ─── Fonctions principales ───────────────────────────────────────────

/**
 * Récupère les tables sociales d'un restaurant.
 */
export async function getSocialTables(
  restaurantId: string,
  date?: string,
): Promise<SocialTableData[]> {
  const where: Record<string, unknown> = {
    restaurantId,
    active: true,
    status: SocialTableStatus.ACTIVE,
  };

  const tables = await db.socialTable.findMany({
    where,
    include: {
      reservations: date
        ? {
            where: {
              serviceDate: date,
              status: { not: SocialTableReservationStatus.CANCELLED },
            },
          }
        : true,
    },
    orderBy: { name: "asc" },
  });

  return tables.map((table) => ({
    id: table.id,
    name: table.name,
    totalSeats: table.totalSeats,
    minGroupSize: table.minGroupSize,
    maxGroupSize: table.maxGroupSize,
    pricePerSeat: table.pricePerSeat,
    eventId: table.eventId,
    status: table.status,
    active: table.active,
    availableSeats:
      table.totalSeats -
      table.reservations.reduce((sum, r) => sum + r.partySize, 0),
    reservations: table.reservations.map((r) => ({
      id: r.id,
      guestId: r.guestId,
      guestName: null,
      partySize: r.partySize,
      serviceDate: r.serviceDate,
      status: r.status,
      reservationId: r.reservationId,
    })),
  }));
}

/**
 * Vérifie la disponibilité d'une table sociale.
 */
export async function checkSocialTableAvailability(
  socialTableId: string,
  date: string,
  partySize: number,
): Promise<SocialTableAvailability> {
  const table = await db.socialTable.findUnique({
    where: { id: socialTableId },
    include: {
      reservations: {
        where: {
          serviceDate: date,
          status: { not: SocialTableReservationStatus.CANCELLED },
        },
      },
    },
  });

  if (!table) {
    return { available: false, seatsLeft: 0, existingGuests: 0 };
  }

  const existingGuests = table.reservations.reduce(
    (sum, r) => sum + r.partySize,
    0,
  );
  const seatsLeft = table.totalSeats - existingGuests;

  const available =
    table.active &&
    table.status === SocialTableStatus.ACTIVE &&
    partySize >= table.minGroupSize &&
    partySize <= table.maxGroupSize &&
    partySize <= seatsLeft;

  return {
    available,
    seatsLeft,
    existingGuests,
    suggestedGroupSize: available ? partySize : undefined,
  };
}

/**
 * Réserve une place sur une table sociale.
 */
export async function reserveSocialTable(params: {
  socialTableId: string;
  guestId: string;
  restaurantId: string;
  serviceDate: string;
  partySize: number;
  reservationId?: string;
}): Promise<
  | { ok: true; reservation: SocialTableReservationData }
  | { ok: false; error: string }
> {
  const { socialTableId, guestId, restaurantId, serviceDate, partySize, reservationId } =
    params;

  // Vérifier disponibilité
  const availability = await checkSocialTableAvailability(
    socialTableId,
    serviceDate,
    partySize,
  );

  if (!availability.available) {
    return { ok: false, error: "NOT_ENOUGH_SEATS" };
  }

  // Vérifier doublon
  const existing = await db.socialTableReservation.findFirst({
    where: {
      socialTableId,
      guestId,
      serviceDate,
      status: { not: SocialTableReservationStatus.CANCELLED },
    },
  });

  if (existing) {
    return { ok: false, error: "ALREADY_RESERVED" };
  }

  // Créer la réservation
  const reservation = await db.socialTableReservation.create({
    data: {
      socialTableId,
      guestId,
      restaurantId,
      serviceDate,
      partySize,
      reservationId,
      status: SocialTableReservationStatus.CONFIRMED,
    },
  });

  return {
    ok: true,
    reservation: {
      id: reservation.id,
      guestId: reservation.guestId,
      guestName: null,
      partySize: reservation.partySize,
      serviceDate: reservation.serviceDate,
      status: reservation.status,
      reservationId: reservation.reservationId,
    },
  };
}

/**
 * Annule une réservation sur table sociale.
 */
export async function cancelSocialTableReservation(
  reservationId: string,
  guestId: string,
): Promise<{ ok: boolean; error?: string }> {
  const reservation = await db.socialTableReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (reservation.guestId !== guestId) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  if (reservation.status === SocialTableReservationStatus.CANCELLED) {
    return { ok: false, error: "ALREADY_CANCELLED" };
  }

  await db.socialTableReservation.update({
    where: { id: reservationId },
    data: { status: SocialTableReservationStatus.CANCELLED },
  });

  return { ok: true };
}

/**
 * Crée une table sociale.
 */
export async function createSocialTable(
  restaurantId: string,
  data: {
    name: string;
    totalSeats: number;
    minGroupSize?: number;
    maxGroupSize?: number;
    pricePerSeat?: number;
    eventId?: string;
  },
): Promise<SocialTableData> {
  const table = await db.socialTable.create({
    data: {
      restaurantId,
      name: data.name,
      totalSeats: data.totalSeats,
      minGroupSize: data.minGroupSize ?? 1,
      maxGroupSize: data.maxGroupSize ?? Math.min(data.totalSeats, 4),
      pricePerSeat: data.pricePerSeat ?? 0,
      eventId: data.eventId,
      status: SocialTableStatus.ACTIVE,
      active: true,
    },
  });

  return {
    id: table.id,
    name: table.name,
    totalSeats: table.totalSeats,
    minGroupSize: table.minGroupSize,
    maxGroupSize: table.maxGroupSize,
    pricePerSeat: table.pricePerSeat,
    eventId: table.eventId,
    status: table.status,
    active: table.active,
    availableSeats: table.totalSeats,
    reservations: [],
  };
}

/**
 * Met à jour le statut d'une table sociale.
 */
export async function updateSocialTableStatus(
  socialTableId: string,
  status: SocialTableStatus,
): Promise<{ ok: boolean }> {
  try {
    await db.socialTable.update({
      where: { id: socialTableId },
      data: { status },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Récupère les réservations d'un guest sur tables sociales.
 */
export async function getGuestSocialReservations(
  guestId: string,
): Promise<SocialTableReservationData[]> {
  const reservations = await db.socialTableReservation.findMany({
    where: {
      guestId,
      status: { not: SocialTableReservationStatus.CANCELLED },
    },
    orderBy: { createdAt: "desc" },
  });

  return reservations.map((r) => ({
    id: r.id,
    guestId: r.guestId,
    guestName: null,
    partySize: r.partySize,
    serviceDate: r.serviceDate,
    status: r.status,
    reservationId: r.reservationId,
  }));
}
