import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

/**
 * Programme de fidélité.
 *
 * Règles :
 * - 1 point par couvert pour une réservation COMPLETED
 * - 5 points pour un avis laissé
 * - 10 points pour un parrainage (réferral)
 * - Paliers : bronze (0-49), silver (50-149), gold (150+)
 *
 * Les points sont cumulés automatiquement après chaque action.
 */

export const POINTS = {
  RESERVATION: 1, // par couvert
  REVIEW: 5,
  REFERRAL: 10,
} as const;

export const TIERS = {
  bronze: { min: 0, discount: 0, next: "silver", pointsToNext: 50 },
  silver: { min: 50, discount: 5, next: "gold", pointsToNext: 100 },
  gold: { min: 150, discount: 10, next: null, pointsToNext: null },
} as const;

export type TierName = keyof typeof TIERS;

export type LoyaltyAccountInfo = {
  points: number;
  tier: TierName;
  discount: number;
  nextTier: TierName | null;
  pointsToNext: number | null;
};

export type LoyaltyTransactionInfo = {
  id: string;
  points: number;
  reason: string;
  metadata: string | null;
  createdAt: Date;
};

// --- Compte ---

export async function getOrCreateAccount(
  guestId: string,
  restaurantId?: string,
): Promise<LoyaltyAccountInfo> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const account = await db.loyaltyAccount.upsert({
    where: { guestId_restaurantId: { guestId, restaurantId: rid } },
    create: { guestId, restaurantId: rid },
    update: {},
  });

  return toAccountInfo(account);
}

export async function getBalance(guestId: string, restaurantId?: string): Promise<number> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const account = await db.loyaltyAccount.findUnique({
    where: { guestId_restaurantId: { guestId, restaurantId: rid } },
    select: { points: true },
  });
  return account?.points ?? 0;
}

// --- Accumulation ---

export async function addPoints(
  guestId: string,
  points: number,
  reason: string,
  metadata?: string,
  restaurantId?: string,
): Promise<{ account: LoyaltyAccountInfo; transaction: LoyaltyTransactionInfo }> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const account = await db.loyaltyAccount.upsert({
    where: { guestId_restaurantId: { guestId, restaurantId: rid } },
    create: { guestId, restaurantId: rid, points },
    update: { points: { increment: points } },
  });

  // Recalculer le tier
  const tier = computeTier(account.points);
  if (tier !== account.tier) {
    await db.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier },
    });
  }

  const transaction = await db.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      points,
      reason,
      metadata: metadata ?? null,
    },
  });

  return {
    account: toAccountInfo({ ...account, points: account.points, tier }),
    transaction: toTransactionInfo(transaction),
  };
}

export async function redeemPoints(
  guestId: string,
  points: number,
  reason: string,
  restaurantId?: string,
): Promise<{ ok: boolean; error?: string; account?: LoyaltyAccountInfo }> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const account = await db.loyaltyAccount.findUnique({
    where: { guestId_restaurantId: { guestId, restaurantId: rid } },
  });

  if (!account) {
    return { ok: false, error: "ACCOUNT_NOT_FOUND" };
  }

  if (account.points < points) {
    return { ok: false, error: "INSUFFICIENT_POINTS" };
  }

  const updated = await db.loyaltyAccount.update({
    where: { id: account.id },
    data: { points: { decrement: points } },
  });

  const tier = computeTier(updated.points);
  if (tier !== updated.tier) {
    await db.loyaltyAccount.update({
      where: { id: updated.id },
      data: { tier },
    });
  }

  await db.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      points: -points,
      reason,
    },
  });

  return {
    ok: true,
    account: toAccountInfo({ ...updated, tier }),
  };
}

// --- Historique ---

export async function getTransactionHistory(
  guestId: string,
  limit = 20,
  restaurantId?: string,
): Promise<LoyaltyTransactionInfo[]> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const account = await db.loyaltyAccount.findUnique({
    where: { guestId_restaurantId: { guestId, restaurantId: rid } },
    select: { id: true },
  });

  if (!account) return [];

  const transactions = await db.loyaltyTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map(toTransactionInfo);
}

// --- Intégration réservation ---

export async function accrueForReservation(
  guestId: string,
  partySize: number,
  reservationRef: string,
): Promise<void> {
  const points = partySize * POINTS.RESERVATION;
  if (points <= 0) return;
  await addPoints(
    guestId,
    points,
    "reservation_completed",
    reservationRef,
  );
}

// --- Intégration avis ---

export async function accrueForReview(
  guestId: string,
): Promise<void> {
  await addPoints(guestId, POINTS.REVIEW, "review");
}

// --- Helpers ---

function computeTier(points: number): TierName {
  if (points >= 150) return "gold";
  if (points >= 50) return "silver";
  return "bronze";
}

function toAccountInfo(account: {
  points: number;
  tier: string;
}): LoyaltyAccountInfo {
  const tier = (account.tier as TierName) || "bronze";
  const config = TIERS[tier];
  return {
    points: account.points,
    tier,
    discount: config.discount,
    nextTier: config.next as TierName | null,
    pointsToNext: config.pointsToNext,
  };
}

function toTransactionInfo(tx: {
  id: string;
  points: number;
  reason: string;
  metadata: string | null;
  createdAt: Date;
}): LoyaltyTransactionInfo {
  return {
    id: tx.id,
    points: tx.points,
    reason: tx.reason,
    metadata: tx.metadata,
    createdAt: tx.createdAt,
  };
}
