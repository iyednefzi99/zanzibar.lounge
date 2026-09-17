/**
 * File d'attente intelligente avec Gamification.
 *
 * Quand un créneau est complet, le client peut s'inscrire à la waitlist.
 * Quand une annulation libère le créneau, le premier de la file est notifié
 * et dispose de 15 minutes pour confirmer. À expiration, le suivant est notifié.
 *
 * Gamification :
 * - Temps d'attente estimé en temps réel
 * - Récompenses automatiques selon le temps d'attente
 * - Notifications de progression
 */

import { WaitlistStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { sendOnBestChannel } from "@/lib/channels";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { formatSlot } from "@/lib/hours";

const NOTIFICATION_WINDOW_MS = 15 * 60_000; // 15 minutes

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type WaitlistEntry = {
  id: string;
  guestId: string;
  name: string | null;
  phone: string;
  date: string;
  minutes: number;
  partySize: number;
  status: WaitlistStatus;
  position: number;
  notifiedAt: Date | null;
  expiresAt: Date | null;
  // ─── Gamification fields ───────────────────────────────────────────
  estimatedWaitMinutes: number | null;
  actualWaitMinutes: number | null;
  checkedInAt: Date | null;
  seatedAt: Date | null;
  rewardEarned: string | null;
  rewardPoints: number;
  rewardRedeemedAt: Date | null;
  createdAt: Date;
};

export type WaitlistReward = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  minWaitMinutes: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  active: boolean;
};

export type WaitlistStats = {
  totalWaiting: number;
  averageWaitMinutes: number;
  seatedToday: number;
  rewardsGivenToday: number;
};

export type JoinResult =
  | { ok: true; entry: WaitlistEntry; position: number }
  | { ok: false; error: "ALREADY_JOINED" | "INVALID_SLOT" | "FULL" };

export type NotifyResult =
  | { ok: true; notified: string; entry: WaitlistEntry }
  | { ok: false; error: "NO_ONE_WAITING" | "DELIVERY_FAILED" };

// --------------------------------------------------------------------------
// Rejoindre la waitlist
// --------------------------------------------------------------------------

export async function joinWaitlist(params: {
  guestId: string;
  restaurantId?: string;
  date: string;
  minutes: number;
  partySize: number;
}): Promise<JoinResult> {
  const { guestId, date, minutes, partySize } = params;
  const restaurantId = params.restaurantId ?? await getDefaultRestaurantId();

  // Vérifier doublon
  const existing = await db.waitlist.findUnique({
    where: {
      guestId_restaurantId_date_minutes: {
        guestId,
        restaurantId,
        date,
        minutes,
      },
    },
  });

  if (existing && existing.status === WaitlistStatus.WAITING) {
    return { ok: false, error: "ALREADY_JOINED" };
  }

  // Compter la position dans la file
  const count = await db.waitlist.count({
    where: {
      restaurantId,
      date,
      minutes,
      status: WaitlistStatus.WAITING,
    },
  });

  const entry = await db.waitlist.create({
    data: {
      guestId,
      restaurantId,
      date,
      minutes,
      partySize,
      position: count + 1,
    },
    include: { guest: true },
  });

  return {
    ok: true,
    entry: toEntry(entry),
    position: entry.position,
  };
}

// --------------------------------------------------------------------------
// Notification quand un créneau se libère
// --------------------------------------------------------------------------

export async function notifyWaitlist(
  restaurantId: string,
  date: string,
  minutes: number,
): Promise<NotifyResult> {
  const rid = restaurantId ?? await getDefaultRestaurantId();

  // Premier de la file encore en attente
  const next = await db.waitlist.findFirst({
    where: {
      restaurantId: rid,
      date,
      minutes,
      status: WaitlistStatus.WAITING,
    },
    orderBy: { position: "asc" },
    include: { guest: true },
  });

  if (!next) {
    return { ok: false, error: "NO_ONE_WAITING" };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + NOTIFICATION_WINDOW_MS);

  // Marquer comme NOTIFIED
  await db.waitlist.update({
    where: { id: next.id },
    data: {
      status: WaitlistStatus.NOTIFIED,
      notifiedAt: now,
      expiresAt,
    },
  });

  // Envoyer la notification
  const timeLabel = formatSlot(minutes);
  const text = waitlistNotificationText(next.guest.locale, {
    date,
    time: timeLabel,
    partySize: next.partySize,
    expiresIn: 15,
  });

  await sendOnBestChannel(next.guest.phone, text).catch(() => {});

  return {
    ok: true,
    notified: next.guest.phone,
    entry: toEntry({ ...next, status: WaitlistStatus.NOTIFIED, notifiedAt: now, expiresAt }),
  };
}

// --------------------------------------------------------------------------
// Réponse du client à la notification
// --------------------------------------------------------------------------

export async function processWaitlistResponse(
  waitlistId: string,
  response: "accept" | "decline",
): Promise<
  | { ok: true; reservationRef?: string }
  | { ok: false; error: "NOT_FOUND" | "NOT_NOTIFIED" | "EXPIRED" | "ALREADY_RESPONDED" | "FULL" }
> {
  const entry = await db.waitlist.findUnique({
    where: { id: waitlistId },
    include: { guest: true, restaurant: true },
  });

  if (!entry) return { ok: false, error: "NOT_FOUND" };
  if (entry.status !== WaitlistStatus.NOTIFIED) {
    if (entry.status === WaitlistStatus.EXPIRED) return { ok: false, error: "EXPIRED" };
    return { ok: false, error: "ALREADY_RESPONDED" };
  }

  // Vérifier expiration
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    await db.waitlist.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.EXPIRED },
    });
    return { ok: false, error: "EXPIRED" };
  }

  if (response === "decline") {
    await db.waitlist.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.EXPIRED },
    });
    // Notifier le suivant
    await notifyWaitlist(entry.restaurantId, entry.date, entry.minutes).catch(() => {});
    return { ok: true };
  }

  // Accepter : créer la réservation
  const { createReservation } = await import("@/lib/reservations");
  const result = await createReservation({
    name: entry.guest.name ?? "—",
    phone: entry.guest.phone,
    serviceDate: entry.date,
    minutes: entry.minutes,
    partySize: entry.partySize,
    channel: "WEB" as never,
    locale: entry.guest.locale,
    restaurantId: entry.restaurantId,
  });

  if (result.ok) {
    await db.waitlist.update({
      where: { id: entry.id },
      data: {
        status: WaitlistStatus.BOOKED,
        reservationId: result.value.id,
      },
    });
    return { ok: true, reservationRef: result.value.reference };
  }

  return { ok: false, error: "FULL" };
}

// --------------------------------------------------------------------------
// Cron : expiration des notifications
// --------------------------------------------------------------------------

export async function cleanupExpiredWaitlist(): Promise<number> {
  const now = new Date();

  const expired = await db.waitlist.updateMany({
    where: {
      status: WaitlistStatus.NOTIFIED,
      expiresAt: { lt: now },
    },
    data: { status: WaitlistStatus.EXPIRED },
  });

  // Pour chaque expiré, notifier le suivant
  const expiredEntries = await db.waitlist.findMany({
    where: {
      status: WaitlistStatus.EXPIRED,
      notifiedAt: { lt: now },
    },
    select: { restaurantId: true, date: true, minutes: true },
    distinct: ["restaurantId", "date", "minutes"],
  });

  for (const slot of expiredEntries) {
    await notifyWaitlist(slot.restaurantId, slot.date, slot.minutes).catch(() => {});
  }

  return expired.count;
}

// --------------------------------------------------------------------------
// Hook : appelé après annulation d'une réservation
// --------------------------------------------------------------------------

export async function onReservationCancelled(
  restaurantId: string,
  serviceDate: string,
  minutes: number,
): Promise<void> {
  await notifyWaitlist(restaurantId, serviceDate, minutes).catch(() => {});
}

// --------------------------------------------------------------------------
// Consultation
// --------------------------------------------------------------------------

export async function getWaitlistForGuest(
  guestId: string,
): Promise<WaitlistEntry[]> {
  const entries = await db.waitlist.findMany({
    where: { guestId, status: { in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED] } },
    orderBy: { createdAt: "desc" },
    include: { guest: true },
  });
  return entries.map(toEntry);
}

export async function getWaitlistForSlot(
  restaurantId: string,
  date: string,
  minutes: number,
): Promise<WaitlistEntry[]> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const entries = await db.waitlist.findMany({
    where: {
      restaurantId: rid,
      date,
      minutes,
      status: { in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED] },
    },
    orderBy: { position: "asc" },
    include: { guest: true },
  });
  return entries.map(toEntry);
}

export async function cancelWaitlistEntry(
  waitlistId: string,
  guestId: string,
): Promise<{ ok: boolean; error?: string }> {
  const entry = await db.waitlist.findUnique({ where: { id: waitlistId } });
  if (!entry) return { ok: false, error: "NOT_FOUND" };
  if (entry.guestId !== guestId) return { ok: false, error: "FORBIDDEN" };
  if (entry.status !== WaitlistStatus.WAITING && entry.status !== WaitlistStatus.NOTIFIED) {
    return { ok: false, error: "ALREADY_RESPONDED" };
  }

  await db.waitlist.update({
    where: { id: waitlistId },
    data: { status: WaitlistStatus.CANCELLED },
  });

  // Si c'était le tour de ce client, notifier le suivant
  if (entry.status === WaitlistStatus.NOTIFIED) {
    await notifyWaitlist(entry.restaurantId, entry.date, entry.minutes).catch(() => {});
  }

  return { ok: true };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function toEntry(row: {
  id: string;
  guestId: string;
  guest: { name: string | null; phone: string };
  date: string;
  minutes: number;
  partySize: number;
  status: WaitlistStatus;
  position: number;
  notifiedAt: Date | null;
  expiresAt: Date | null;
  estimatedWaitMinutes?: number | null;
  actualWaitMinutes?: number | null;
  checkedInAt?: Date | null;
  seatedAt?: Date | null;
  rewardEarned?: string | null;
  rewardPoints?: number;
  rewardRedeemedAt?: Date | null;
  createdAt: Date;
}): WaitlistEntry {
  return {
    id: row.id,
    guestId: row.guestId,
    name: row.guest.name,
    phone: row.guest.phone,
    date: row.date,
    minutes: row.minutes,
    partySize: row.partySize,
    status: row.status,
    position: row.position,
    notifiedAt: row.notifiedAt,
    expiresAt: row.expiresAt,
    estimatedWaitMinutes: row.estimatedWaitMinutes ?? null,
    actualWaitMinutes: row.actualWaitMinutes ?? null,
    checkedInAt: row.checkedInAt ?? null,
    seatedAt: row.seatedAt ?? null,
    rewardEarned: row.rewardEarned ?? null,
    rewardPoints: row.rewardPoints ?? 0,
    rewardRedeemedAt: row.rewardRedeemedAt ?? null,
    createdAt: row.createdAt,
  };
}

function waitlistNotificationText(
  locale: string,
  data: { date: string; time: string; partySize: number; expiresIn: number },
): string {
  const { date, time, partySize, expiresIn } = data;

  if (locale === "ar") {
    return `تم تحرير طاولة! ${date} على ${time} لـ ${partySize} أشخاص. لديك ${expiresIn} دقيقة للحجز. رد "نعم" للتأكيد.`;
  }
  if (locale === "en") {
    return `A table is available! ${date} at ${time} for ${partySize}. You have ${expiresIn} minutes to book. Reply YES to confirm.`;
  }
  return `Une table s'est libérée ! ${date} à ${time} pour ${partySize} personne(s). Vous avez ${expiresIn} minutes pour réserver. Répondez OUI pour confirmer.`;
}

// --------------------------------------------------------------------------
// Gamification : temps d'attente estimé
// --------------------------------------------------------------------------

/**
 * Calcule le temps d'attente estimé basé sur :
 * - Le taux de rotation actuel des tables
 * - Le nombre de personnes en attente devant
 * - Le temps moyen de service
 */
export async function calculateEstimatedWait(
  restaurantId: string,
  date: string,
  partySize: number,
): Promise<number> {
  const activeReservations = await db.reservation.findMany({
    where: {
      restaurantId,
      serviceDate: date,
      status: { in: ["CONFIRMED", "SEATED"] },
    },
    select: {
      startsAt: true,
      endsAt: true,
    },
  });

  const avgServiceTime = activeReservations.length > 0
    ? activeReservations.reduce((acc, r) => {
        const duration = (r.endsAt.getTime() - r.startsAt.getTime()) / (1000 * 60);
        return acc + duration;
      }, 0) / activeReservations.length
    : 90;

  const waitingAhead = await db.waitlist.count({
    where: {
      restaurantId,
      date,
      status: WaitlistStatus.WAITING,
    },
  });

  const tableCount = await db.restaurantTable.count({
    where: {
      restaurantId,
      active: true,
      capacity: { gte: partySize },
    },
  });

  const effectiveTables = Math.max(tableCount, 1);
  const estimatedMinutes = Math.ceil(
    (waitingAhead * avgServiceTime) / effectiveTables,
  );

  return Math.max(estimatedMinutes, 5);
}

// --------------------------------------------------------------------------
// Gamification : check-in
// --------------------------------------------------------------------------

/**
 * Le client se présente (QR code ou lien).
 */
export async function checkInWaitlist(
  waitlistId: string,
): Promise<{ ok: boolean; error?: string }> {
  const entry = await db.waitlist.findUnique({
    where: { id: waitlistId },
  });

  if (!entry) return { ok: false, error: "NOT_FOUND" };
  if (entry.status !== WaitlistStatus.WAITING && entry.status !== WaitlistStatus.NOTIFIED) {
    return { ok: false, error: "INVALID_STATUS" };
  }

  await db.waitlist.update({
    where: { id: waitlistId },
    data: { checkedInAt: new Date() },
  });

  return { ok: true };
}

// --------------------------------------------------------------------------
// Gamification : asseoir le client
// --------------------------------------------------------------------------

/**
 * Marque le client comme assis en salle.
 */
export async function seatWaitlistGuest(
  waitlistId: string,
): Promise<{ ok: boolean; reward?: string; actualWaitMinutes?: number; error?: string }> {
  const entry = await db.waitlist.findUnique({
    where: { id: waitlistId },
  });

  if (!entry) return { ok: false, error: "NOT_FOUND" };
  if (entry.status === WaitlistStatus.SEATED) {
    return { ok: false, error: "ALREADY_SEATED" };
  }

  const actualWaitMinutes = Math.round(
    (Date.now() - entry.createdAt.getTime()) / (1000 * 60),
  );

  // Vérifier si une récompense est éligible
  const reward = await checkRewardEligibility(entry.restaurantId, actualWaitMinutes);
  let rewardEarned: string | null = null;
  let rewardPoints = 0;

  if (reward) {
    rewardEarned = reward.name;
    rewardPoints = reward.type === "loyalty_points" ? reward.value : 5;

    await db.waitlistReward.update({
      where: { id: reward.id },
      data: { currentRedemptions: { increment: 1 } },
    });
  }

  await db.waitlist.update({
    where: { id: waitlistId },
    data: {
      status: WaitlistStatus.SEATED,
      seatedAt: new Date(),
      actualWaitMinutes,
      rewardEarned,
      rewardPoints,
    },
  });

  // Recalculer les positions
  await recalculatePositions(entry.restaurantId, entry.date);

  return {
    ok: true,
    reward: rewardEarned ?? undefined,
    actualWaitMinutes,
  };
}

// --------------------------------------------------------------------------
// Gamification : récompenses
// --------------------------------------------------------------------------

async function checkRewardEligibility(
  restaurantId: string,
  waitMinutes: number,
): Promise<WaitlistReward | null> {
  const reward = await db.waitlistReward.findFirst({
    where: {
      restaurantId,
      active: true,
      minWaitMinutes: { lte: waitMinutes },
      OR: [
        { maxRedemptions: null },
        { currentRedemptions: { lt: db.waitlistReward.fields.maxRedemptions } },
      ],
    },
    orderBy: { minWaitMinutes: "desc" },
  });

  if (!reward) return null;

  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    value: reward.value,
    minWaitMinutes: reward.minWaitMinutes,
    maxRedemptions: reward.maxRedemptions,
    currentRedemptions: reward.currentRedemptions,
    active: reward.active,
  };
}

/**
 * Récupère les récompenses disponibles pour un restaurant.
 */
export async function getAvailableRewards(
  restaurantId: string,
): Promise<WaitlistReward[]> {
  const rewards = await db.waitlistReward.findMany({
    where: {
      restaurantId,
      active: true,
    },
    orderBy: { minWaitMinutes: "asc" },
  });

  return rewards.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    value: r.value,
    minWaitMinutes: r.minWaitMinutes,
    maxRedemptions: r.maxRedemptions,
    currentRedemptions: r.currentRedemptions,
    active: r.active,
  }));
}

/**
 * Crée une récompense d'attente.
 */
export async function createWaitlistReward(
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    type: string;
    value: number;
    minWaitMinutes?: number;
    maxRedemptions?: number;
  },
): Promise<WaitlistReward> {
  const reward = await db.waitlistReward.create({
    data: {
      restaurantId,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      minWaitMinutes: data.minWaitMinutes ?? 10,
      maxRedemptions: data.maxRedemptions,
    },
  });

  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    value: reward.value,
    minWaitMinutes: reward.minWaitMinutes,
    maxRedemptions: reward.maxRedemptions,
    currentRedemptions: reward.currentRedemptions,
    active: reward.active,
  };
}

// --------------------------------------------------------------------------
// Gamification : stats
// --------------------------------------------------------------------------

/**
 * Récupère les stats de la waitlist pour un jour donné.
 */
export async function getWaitlistStats(
  restaurantId: string,
  date: string,
): Promise<WaitlistStats> {
  const [totalWaiting, seatedToday, rewardsGivenToday] = await Promise.all([
    db.waitlist.count({
      where: {
        restaurantId,
        date,
        status: { in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED] },
      },
    }),
    db.waitlist.count({
      where: {
        restaurantId,
        date,
        status: WaitlistStatus.SEATED,
      },
    }),
    db.waitlist.count({
      where: {
        restaurantId,
        date,
        status: WaitlistStatus.SEATED,
        rewardEarned: { not: null },
      },
    }),
  ]);

  const avgResult = await db.waitlist.aggregate({
    where: {
      restaurantId,
      date,
      status: WaitlistStatus.SEATED,
      actualWaitMinutes: { not: null },
    },
    _avg: { actualWaitMinutes: true },
  });

  return {
    totalWaiting,
    averageWaitMinutes: avgResult._avg.actualWaitMinutes ?? 0,
    seatedToday,
    rewardsGivenToday,
  };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

async function recalculatePositions(
  restaurantId: string,
  date: string,
): Promise<void> {
  const waiting = await db.waitlist.findMany({
    where: {
      restaurantId,
      date,
      status: { in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED] },
    },
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < waiting.length; i++) {
    await db.waitlist.update({
      where: { id: waiting[i].id },
      data: { position: i + 1 },
    });
  }
}
