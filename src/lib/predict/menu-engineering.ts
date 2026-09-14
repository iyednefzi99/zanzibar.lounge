import { db } from "@/lib/db";

export async function computeMenuEngineering(
  restaurantId: string,
  menuItemId: string,
  period: Date,
  data: {
    timesOrdered: number;
    revenueCents: number;
    costCents: number;
    popularityRank: number;
  },
) {
  const marginPercent =
    data.revenueCents > 0
      ? ((data.revenueCents - data.costCents) / data.revenueCents) * 100
      : 0;

  const highPopularity = data.popularityRank <= 10; // top 10
  const highMargin = marginPercent >= 60;

  let category: string;
  if (highPopularity && highMargin) category = "star";
  else if (!highPopularity && highMargin) category = "puzzle";
  else if (highPopularity && !highMargin) category = "plow_horse";
  else category = "dog";

  return db.menuEngineering.upsert({
    where: {
      restaurantId_menuItemId_period_periodType: {
        restaurantId,
        menuItemId,
        period,
        periodType: "month",
      },
    },
    create: {
      restaurantId,
      menuItemId,
      period,
      periodType: "month",
      ...data,
      marginPercent,
      category,
    },
    update: {
      ...data,
      marginPercent,
      category,
    },
  });
}

export async function getMenuScores(restaurantId: string, period?: Date) {
  const p = period ?? new Date();
  return db.menuEngineering.findMany({
    where: { restaurantId, period: p, periodType: "month" },
    orderBy: { popularityRank: "asc" },
  });
}
