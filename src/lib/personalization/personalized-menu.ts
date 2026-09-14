import { db } from "@/lib/db";

export type PersonalizedMenuItem = {
  itemId: string;
  score: number;
  reason: string;
};

export async function getPersonalizedMenu(guestId: string, restaurantId: string) {
  const menu = await db.personalizedMenu.findFirst({
    where: {
      guestId,
      restaurantId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { generatedAt: "desc" },
  });
  return menu;
}

export async function generatePersonalizedMenu(guestId: string, restaurantId: string) {
  const profile = await db.guestAiProfile.findUnique({ where: { guestId } });
  const menuItems = await db.menuItem.findMany({
    where: { restaurantId, available: true },
  });

  const preferences = (profile?.preferences as Record<string, unknown>) ?? {};
  const dietary = (preferences.dietary as string[]) ?? [];
  const favCuisines = (preferences.cuisine as string[]) ?? [];
  const visitPatterns = (profile?.visitPatterns as Record<string, unknown>) ?? {};
  const avgSpend = (visitPatterns.avgSpend as number) ?? 0;

  const scored: PersonalizedMenuItem[] = menuItems.map((item) => {
    let score = 0.5;
    const reasons: string[] = [];

    if (dietary.length > 0 && dietary.some((d) => item.allergens.includes(d))) {
      score += 0.15;
      reasons.push("correspond à vos préférences alimentaires");
    }
    if (favCuisines.length > 0 && favCuisines.includes(item.category)) {
      score += 0.1;
      reasons.push("cuisine que vous appréciez");
    }
    if (item.seasonal) {
      score += 0.1;
      reasons.push("très populaire");
    }
    if (avgSpend > 0 && item.price <= avgSpend * 1.2) {
      score += 0.05;
      reasons.push("dans votre budget habituel");
    }

    return {
      itemId: item.id,
      score: Math.min(score, 1),
      reason: reasons.join(", ") || "suggestion standard",
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topItems = scored.slice(0, 10);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const existing = await db.personalizedMenu.findFirst({
    where: { guestId, restaurantId },
    orderBy: { generatedAt: "desc" },
  });

  if (existing) {
    return db.personalizedMenu.update({
      where: { id: existing.id },
      data: { menuItems: topItems as unknown as Record<string, string>[], expiresAt },
    });
  }

  return db.personalizedMenu.create({
    data: { guestId, restaurantId, menuItems: topItems as unknown as Record<string, string>[], expiresAt },
  });
}
