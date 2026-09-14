import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

/**
 * Système de parrainage et de file d'attente.
 *
 * - Parrainage : code court partageable, points attribués au parrain et au
 *   nouveau client une fois que ce dernier a effectué une réservation.
 * - File d'attente : quand le restaurant est complet, le client s'inscrit
 *   et reçoit une notification dès qu'une table se libère.
 */

// --- Parrainage ---

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export type ReferralInfo = {
  id: string;
  code: string;
  status: "pending" | "completed" | "expired";
  rewardPoints: number;
  referredGuestId: string | null;
  createdAt: Date;
};

/**
 * Crée un code de parrainage pour un client existant.
 * Vérifie qu'aucun code actif n'existe déjà pour ce client.
 */
export async function createReferral(
  referrerGuestId: string,
  restaurantId?: string,
): Promise<{ ok: boolean; referral?: ReferralInfo; error?: string }> {
  const rid = restaurantId ?? await getDefaultRestaurantId();

  const existing = await db.referral.findFirst({
    where: {
      referrerGuestId,
      restaurantId: rid,
      status: "PENDING",
    },
  });

  if (existing) {
    return {
      ok: true,
      referral: {
        id: existing.id,
        code: existing.code,
        status: existing.status.toLowerCase() as ReferralInfo["status"],
        rewardPoints: existing.rewardPoints,
        referredGuestId: existing.referredGuestId,
        createdAt: existing.createdAt,
      },
    };
  }

  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const duplicate = await db.referral.findUnique({ where: { code } });
    if (!duplicate) break;
    code = generateCode();
    attempts++;
  }

  const referral = await db.referral.create({
    data: {
      referrerGuestId,
      restaurantId: rid,
      code,
      rewardPoints: 10,
    },
  });

  return {
    ok: true,
    referral: {
      id: referral.id,
      code: referral.code,
      status: referral.status.toLowerCase() as ReferralInfo["status"],
      rewardPoints: referral.rewardPoints,
      referredGuestId: null,
      createdAt: referral.createdAt,
    },
  };
}

/**
 * Applique un code de parrainage pour un nouveau client.
 * Le parrain et le filleul reçoivent chacun les points de récompense.
 */
export async function applyReferral(
  code: string,
  newGuestId: string,
): Promise<{ ok: boolean; referral?: ReferralInfo; error?: string }> {
  const referral = await db.referral.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!referral) {
    return { ok: false, error: "CODE_NOT_FOUND" };
  }

  if (referral.status !== "PENDING") {
    return { ok: false, error: "CODE_ALREADY_USED" };
  }

  if (referral.referrerGuestId === newGuestId) {
    return { ok: false, error: "CANNOT_REFER_YOURSELF" };
  }

  const updated = await db.referral.update({
    where: { id: referral.id },
    data: {
      referredGuestId: newGuestId,
      status: "COMPLETED",
    },
  });

  const { addPoints } = await import("@/lib/loyalty");

  await addPoints(
    referral.referrerGuestId,
    referral.rewardPoints,
    "referral",
    code,
    referral.restaurantId,
  ).catch(() => {});

  await addPoints(
    newGuestId,
    referral.rewardPoints,
    "referral",
    code,
    referral.restaurantId,
  ).catch(() => {});

  return {
    ok: true,
    referral: {
      id: updated.id,
      code: updated.code,
      status: "completed",
      rewardPoints: updated.rewardPoints,
      referredGuestId: updated.referredGuestId,
      createdAt: updated.createdAt,
    },
  };
}

/**
 * Récupère les parrainages d'un client (ceux qu'il a créés).
 */
export async function getReferralsByGuest(
  guestId: string,
): Promise<ReferralInfo[]> {
  const rows = await db.referral.findMany({
    where: { referrerGuestId: guestId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status.toLowerCase() as ReferralInfo["status"],
    rewardPoints: r.rewardPoints,
    referredGuestId: r.referredGuestId,
    createdAt: r.createdAt,
  }));
}

// --- File d'attente ---

export type WaitlistEntry = {
  id: string;
  guestId: string;
  date: string;
  partySize: number;
  status: "waiting" | "notified" | "expired";
  position: number;
  createdAt: Date;
};

/**
 * Rejoint la file d'attente pour une date donnée.
 * La position est attribuée automatiquement (dernier dans la file).
 */
export async function joinWaitlist(
  guestId: string,
  restaurantId: string,
  date: string,
  partySize: number,
): Promise<{ ok: boolean; entry?: WaitlistEntry; error?: string }> {
  if (partySize < 1 || partySize > 12) {
    return { ok: false, error: "INVALID_PARTY_SIZE" };
  }

  const existing = await db.waitlist.findFirst({
    where: {
      guestId,
      restaurantId,
      date,
      status: "WAITING",
    },
  });

  if (existing) {
    return {
      ok: true,
      entry: {
        id: existing.id,
        guestId: existing.guestId,
        date: existing.date,
        partySize: existing.partySize,
        status: "waiting",
        position: existing.position,
        createdAt: existing.createdAt,
      },
    };
  }

  const lastPosition = await db.waitlist.aggregate({
    where: {
      restaurantId,
      date,
      status: "WAITING",
    },
    _max: { position: true },
  });

  const position = (lastPosition._max.position ?? 0) + 1;

  const entry = await db.waitlist.create({
    data: {
      guestId,
      restaurantId,
      date,
      partySize,
      position,
    },
  });

  return {
    ok: true,
    entry: {
      id: entry.id,
      guestId: entry.guestId,
      date: entry.date,
      partySize: entry.partySize,
      status: "waiting",
      position: entry.position,
      createdAt: entry.createdAt,
    },
  };
}

/**
 * Récupère la position actuelle d'un client dans la file.
 */
export async function getWaitlistPosition(
  waitlistId: string,
): Promise<{ position: number; ahead: number } | null> {
  const entry = await db.waitlist.findUnique({
    where: { id: waitlistId },
  });

  if (!entry || entry.status !== "WAITING") return null;

  const ahead = await db.waitlist.count({
    where: {
      restaurantId: entry.restaurantId,
      date: entry.date,
      status: "WAITING",
      position: { lt: entry.position },
    },
  });

  return { position: entry.position, ahead };
}

/**
 * Notifie les clients en attente pour une date donnée.
 * Met à jour leur statut et renvoie la liste des clients à notifier.
 * La notification est déclenchée quand une table se libère (cancellation / no-show).
 */
export async function notifyWaitlist(
  restaurantId: string,
  date: string,
): Promise<WaitlistEntry[]> {
  const waiting = await db.waitlist.findMany({
    where: {
      restaurantId,
      date,
      status: "WAITING",
    },
    orderBy: { position: "asc" },
    take: 5,
  });

  if (waiting.length === 0) return [];

  const ids = waiting.map((w) => w.id);
  await db.waitlist.updateMany({
    where: { id: { in: ids } },
    data: { status: "NOTIFIED" },
  });

  return waiting.map((w) => ({
    id: w.id,
    guestId: w.guestId,
    date: w.date,
    partySize: w.partySize,
    status: "notified" as const,
    position: w.position,
    createdAt: w.createdAt,
  }));
}

/**
 * Annule une entrée dans la file d'attente.
 */
export async function cancelWaitlist(waitlistId: string): Promise<boolean> {
  const entry = await db.waitlist.findUnique({ where: { id: waitlistId } });
  if (!entry || entry.status !== "WAITING") return false;

  await db.waitlist.update({
    where: { id: waitlistId },
    data: { status: "EXPIRED" },
  });

  return true;
}

/**
 * Liste des entrées actives d'un client.
 */
export async function getWaitlistByGuest(
  guestId: string,
): Promise<WaitlistEntry[]> {
  const rows = await db.waitlist.findMany({
    where: { guestId, status: { in: ["WAITING", "NOTIFIED"] } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((w) => ({
    id: w.id,
    guestId: w.guestId,
    date: w.date,
    partySize: w.partySize,
    status: w.status.toLowerCase() as WaitlistEntry["status"],
    position: w.position,
    createdAt: w.createdAt,
  }));
}
