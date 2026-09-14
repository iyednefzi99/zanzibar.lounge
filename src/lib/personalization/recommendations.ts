import { db } from "@/lib/db";

export type RecommendationType = "dish" | "drink" | "upsell" | "return_visit";

export async function getRecommendations(
  guestId: string,
  restaurantId: string,
  type?: RecommendationType,
) {
  return db.recommendation.findMany({
    where: {
      guestId,
      restaurantId,
      ...(type ? { type } : {}),
    },
    orderBy: { score: "desc" },
    take: 20,
  });
}

export async function createRecommendation(
  guestId: string,
  restaurantId: string,
  type: RecommendationType,
  title: string,
  description: string | null,
  score: number = 0.5,
) {
  return db.recommendation.create({
    data: { guestId, restaurantId, type, title, description, score },
  });
}

export async function acceptRecommendation(id: string) {
  return db.recommendation.update({
    where: { id },
    data: { accepted: true },
  });
}

export async function dismissRecommendation(id: string) {
  return db.recommendation.update({
    where: { id },
    data: { accepted: false },
  });
}

export async function generateRecommendations(guestId: string, restaurantId: string) {
  const profile = await db.guestAiProfile.findUnique({ where: { guestId } });
  const menuItems = await db.menuItem.findMany({
    where: { restaurantId, available: true },
  });

  const existing = await db.recommendation.findMany({
    where: { guestId, restaurantId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });
  const existingTitles = new Set(existing.map((r) => r.title));

  const recommendations: Array<{
    type: RecommendationType;
    title: string;
    description: string;
    score: number;
  }> = [];

  const preferences = (profile?.preferences as Record<string, unknown>) ?? {};
  const dietary = (preferences.dietary as string[]) ?? [];
  const favCuisines = (preferences.cuisine as string[]) ?? [];

  for (const item of menuItems) {
    if (existingTitles.has(item.name)) continue;

    let score = 0.5;
    const allergens = item.allergens;

    if (dietary.length > 0 && dietary.some((d) => allergens.includes(d))) {
      score += 0.2;
    }
    if (favCuisines.length > 0 && favCuisines.includes(item.category)) {
      score += 0.15;
    }
    if (item.seasonal) score += 0.1;

    if (score > 0.55) {
      recommendations.push({
        type: "dish",
        title: item.name,
        description: item.description ?? `Recommandé pour vous — ${item.category}`,
        score: Math.min(score, 1),
      });
    }
  }

  const results = await Promise.all(
    recommendations.slice(0, 5).map((r) =>
      db.recommendation.create({
        data: { guestId, restaurantId, ...r },
      }),
    ),
  );

  return results;
}
