import { db } from "@/lib/db";

export async function getLoyaltyStats(restaurantId: string) {
  const profiles = await db.guestAiProfile.findMany();

  const tiers = profiles.reduce((acc, p) => {
    acc[p.loyaltyTier] = (acc[p.loyaltyTier] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalLifetimeValue = profiles.reduce((sum, p) => sum + p.lifetimeValue, 0);
  const avgLifetimeValue = profiles.length > 0 ? totalLifetimeValue / profiles.length : 0;

  return { tiers, totalProfiles: profiles.length, totalLifetimeValue, avgLifetimeValue };
}

export async function updateTier(guestId: string) {
  const profile = await db.guestAiProfile.findUnique({ where: { guestId } });
  if (!profile) return;

  let tier = "standard";
  if (profile.lifetimeValue >= 100000) tier = "vip";
  else if (profile.lifetimeValue >= 50000) tier = "gold";
  else if (profile.lifetimeValue >= 20000) tier = "silver";

  if (tier !== profile.loyaltyTier) {
    await db.guestAiProfile.update({
      where: { guestId },
      data: { loyaltyTier: tier },
    });
  }
}
