import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

/**
 * Programme de fidélité gamifié.
 *
 * Règles :
 * - 1 point par couvert pour une réservation COMPLETED
 * - 5 points pour un avis laissé
 * - 10 points pour un parrainage (réferral)
 * - Paliers : bronze (0-49), silver (50-149), gold (150+)
 * - Badges : récompenses pour des achievements spécifiques
 * - Streaks : bonus pour les visites consécutives
 *
 * Les points sont cumulés automatiquement après chaque action.
 */

export const POINTS = {
  RESERVATION: 1, // par couvert
  REVIEW: 5,
  REFERRAL: 10,
  STREAK_BONUS: 5, // bonus par semaine consécutive
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
  badges: Badge[];
  streak: StreakInfo;
};

export type LoyaltyTransactionInfo = {
  id: string;
  points: number;
  reason: string;
  metadata: string | null;
  createdAt: Date;
};

// --- Badges ---

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date | null;
  progress?: number; // 0-100 pour les badges en cours
  target?: number;
};

export const BADGES = {
  FIRST_VISIT: {
    id: "first_visit",
    name: "Premier pas",
    description: "Votre première réservation",
    icon: "🎉",
    condition: (stats: GuestStats) => stats.totalReservations >= 1,
  },
  REGULAR: {
    id: "regular",
    name: "Habitué",
    description: "5 réservations complétées",
    icon: "⭐",
    condition: (stats: GuestStats) => stats.completedReservations >= 5,
    target: 5,
  },
  VIP: {
    id: "vip",
    name: "VIP",
    description: "20 réservations complétées",
    icon: "👑",
    condition: (stats: GuestStats) => stats.completedReservations >= 20,
    target: 20,
  },
  REVIEWER: {
    id: "reviewer",
    name: "Critique",
    description: "3 avis laissés",
    icon: "📝",
    condition: (stats: GuestStats) => stats.reviews >= 3,
    target: 3,
  },
  SOCIAL: {
    id: "social",
    name: "Bouche-à-oreille",
    description: "2 parrainages réussis",
    icon: "🤝",
    condition: (stats: GuestStats) => stats.referrals >= 2,
    target: 2,
  },
  STREAK_4: {
    id: "streak_4",
    name: "Série en feu",
    description: "4 semaines consécutives",
    icon: "🔥",
    condition: (stats: GuestStats) => stats.currentStreak >= 4,
    target: 4,
  },
  STREAK_12: {
    id: "streak_12",
    name: "Légende",
    description: "12 semaines consécutives",
    icon: "💎",
    condition: (stats: GuestStats) => stats.currentStreak >= 12,
    target: 12,
  },
  BIG_GROUP: {
    id: "big_group",
    name: "Animateur",
    description: "Réservation pour 8+ personnes",
    icon: "🎊",
    condition: (stats: GuestStats) => stats.largestGroup >= 8,
  },
  EARLY_BIRD: {
    id: "early_bird",
    name: "Lève-tôt",
    description: "Réservation avant 10h",
    icon: "🌅",
    condition: (stats: GuestStats) => stats.earlyBirdBookings >= 1,
  },
  NIGHT_OWL: {
    id: "night_owl",
    name: "Oiseau de nuit",
    description: "Réservation après 22h",
    icon: "🌙",
    condition: (stats: GuestStats) => stats.lateNightBookings >= 1,
  },
} as const;

export type BadgeId = keyof typeof BADGES;

// --- Streak ---

export type StreakInfo = {
  current: number; // semaines consécutives
  longest: number;
  lastVisitAt: Date | null;
};

// --- Stats guest ---

export type GuestStats = {
  totalReservations: number;
  completedReservations: number;
  reviews: number;
  referrals: number;
  currentStreak: number;
  longestStreak: number;
  largestGroup: number;
  earlyBirdBookings: number;
  lateNightBookings: number;
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

  const stats = await getGuestStats(guestId, rid);
  const badges = await getEarnedBadges(stats);
  const streak = await getStreakInfo(guestId, rid);

  return {
    ...toAccountInfo(account),
    badges,
    streak,
  };
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

// --- Intégration commande ---

/**
 * 1 point par 1000 millimes (1 DT) dépensés pour une commande terminée.
 */
export async function accrueForOrder(
  guestId: string,
  totalMillimes: number,
  orderRef: string,
): Promise<void> {
  const points = Math.floor(totalMillimes / 1000);
  if (points <= 0) return;
  await addPoints(
    guestId,
    points,
    "order_completed",
    orderRef,
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
    badges: [],
    streak: { current: 0, longest: 0, lastVisitAt: null },
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

// --- Stats guest ---

async function getGuestStats(
  guestId: string,
  restaurantId: string,
): Promise<GuestStats> {
  const reservations = await db.reservation.findMany({
    where: { guestId, restaurantId },
    select: {
      status: true,
      partySize: true,
      startsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const reviews = await db.review.count({
    where: {
      guestId,
      reservation: { restaurantId },
    },
  });

  const referrals = await db.referral.count({
    where: { referrerGuestId: guestId, restaurantId },
  });

  const completed = reservations.filter((r) => r.status === "COMPLETED");
  const largestGroup = Math.max(0, ...reservations.map((r) => r.partySize));

  // Early bird (< 10h) et night owl (> 22h)
  const earlyBirdBookings = reservations.filter((r) => {
    const hour = r.startsAt.getUTCHours();
    return hour < 10;
  }).length;

  const lateNightBookings = reservations.filter((r) => {
    const hour = r.startsAt.getUTCHours();
    return hour >= 22;
  }).length;

  // Calculer le streak
  const streak = await calculateStreak(completed);

  return {
    totalReservations: reservations.length,
    completedReservations: completed.length,
    reviews,
    referrals,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    largestGroup,
    earlyBirdBookings,
    lateNightBookings,
  };
}

// --- Streak ---

async function calculateStreak(
  completedReservations: Array<{ startsAt: Date }>,
): Promise<{ current: number; longest: number }> {
  if (completedReservations.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Grouper par semaine
  const weeks = new Set<string>();
  for (const r of completedReservations) {
    const date = new Date(r.startsAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weeks.add(weekStart.toISOString().split("T")[0]);
  }

  const sortedWeeks = [...weeks].sort().reverse();

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevWeek: string | null = null;

  for (const week of sortedWeeks.reverse()) {
    if (prevWeek) {
      const prevDate = new Date(prevWeek);
      const currDate = new Date(week);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);

      if (diffDays <= 7) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    longest = Math.max(longest, streak);
    prevWeek = week;
  }

  // Vérifier si la semaine en cours est active
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  const thisWeekStr = thisWeekStart.toISOString().split("T")[0];

  if (sortedWeeks.includes(thisWeekStr)) {
    current = streak;
  }

  return { current, longest };
}

async function getStreakInfo(
  guestId: string,
  restaurantId: string,
): Promise<StreakInfo> {
  const completed = await db.reservation.findMany({
    where: {
      guestId,
      restaurantId,
      status: "COMPLETED",
    },
    select: { startsAt: true },
    orderBy: { startsAt: "desc" },
  });

  const streak = await calculateStreak(completed);
  const lastVisitAt = completed[0]?.startsAt ?? null;

  return {
    current: streak.current,
    longest: streak.longest,
    lastVisitAt,
  };
}

// --- Badges ---

async function getEarnedBadges(stats: GuestStats): Promise<Badge[]> {
  const badges: Badge[] = [];

  for (const [, badgeDef] of Object.entries(BADGES)) {
    const earned = badgeDef.condition(stats);

    if (earned) {
      badges.push({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        earnedAt: new Date(), // Approximation
      });
    } else if ("target" in badgeDef && badgeDef.target) {
      // Badge en cours de progression
      let progress = 0;
      if ("completedReservations" in stats) {
        progress = Math.min(
          100,
          Math.round(
            (stats.completedReservations / (badgeDef.target as number)) * 100,
          ),
        );
      }
      badges.push({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        earnedAt: null,
        progress,
        target: badgeDef.target,
      });
    }
  }

  return badges;
}
