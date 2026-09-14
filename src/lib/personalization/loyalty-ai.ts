import { db } from "@/lib/db";

export type LoyaltyTier = "standard" | "silver" | "gold" | "platinum";

const TIER_THRESHOLDS: Record<LoyaltyTier, { visits: number; spend: number }> = {
  standard: { visits: 0, spend: 0 },
  silver: { visits: 5, spend: 500_00 },
  gold: { visits: 15, spend: 1500_00 },
  platinum: { visits: 30, spend: 5000_00 },
};

export function calculateTier(totalVisits: number, lifetimeSpend: number): LoyaltyTier {
  const tiers: LoyaltyTier[] = ["platinum", "gold", "silver", "standard"];
  for (const tier of tiers) {
    const t = TIER_THRESHOLDS[tier];
    if (totalVisits >= t.visits || lifetimeSpend >= t.spend) return tier;
  }
  return "standard";
}

export async function getLoyaltyAccount(guestId: string, restaurantId: string) {
  return db.loyaltyAccount.findFirst({
    where: { guestId, restaurantId },
  });
}

export async function earnPoints(
  guestId: string,
  restaurantId: string,
  points: number,
  reason: string,
) {
  const account = await db.loyaltyAccount.upsert({
    where: {
      guestId_restaurantId: { guestId, restaurantId },
    },
    create: { guestId, restaurantId, points, tier: "standard" },
    update: { points: { increment: points } },
  });

  await db.loyaltyTransaction.create({
    data: { accountId: account.id, points, reason },
  });

  const profile = await db.guestAiProfile.findUnique({ where: { guestId } });
  const lifetimeValue = (profile?.lifetimeValue ?? 0) + points;
  const tier = calculateTier(
    (profile?.visitPatterns as Record<string, unknown>)?.totalVisits as number ?? 0,
    lifetimeValue,
  );

  await db.guestAiProfile.upsert({
    where: { guestId },
    create: { guestId, loyaltyTier: tier, lifetimeValue },
    update: { loyaltyTier: tier, lifetimeValue },
  });

  return db.loyaltyAccount.update({
    where: { id: account.id },
    data: { tier },
  });
}

export async function redeemPoints(
  guestId: string,
  restaurantId: string,
  points: number,
  reason: string,
) {
  const account = await db.loyaltyAccount.findFirst({
    where: { guestId, restaurantId },
  });

  if (!account || account.points < points) {
    throw new Error("Points insuffisants");
  }

  const updated = await db.loyaltyAccount.update({
    where: { id: account.id },
    data: { points: { decrement: points } },
  });

  await db.loyaltyTransaction.create({
    data: { accountId: account.id, points: -points, reason },
  });

  return updated;
}

export async function getPointsHistory(guestId: string, restaurantId: string, limit = 50) {
  const account = await db.loyaltyAccount.findFirst({
    where: { guestId, restaurantId },
  });
  if (!account) return [];

  return db.loyaltyTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
