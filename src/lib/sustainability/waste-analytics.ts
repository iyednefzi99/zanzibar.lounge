import { db } from "@/lib/db";

export type WasteEntry = {
  id: string;
  restaurantId: string;
  category: string;
  amount: number;
  unit: string;
  source: string | null;
  period: Date;
  createdAt: Date;
};

export async function logWaste(
  restaurantId: string,
  category: string,
  amount: number,
  unit: string,
  source: string | null,
  period: Date,
) {
  return db.carbonLog.create({
    data: {
      restaurantId,
      category: "waste",
      amount,
      unit,
      source: `${category}:${source ?? "unknown"}`,
      period,
    },
  });
}

export async function getWasteAnalytics(restaurantId: string, from: Date, to: Date) {
  const wasteLogs = await db.carbonLog.findMany({
    where: {
      restaurantId,
      period: { gte: from, lte: to },
      category: "waste",
    },
    orderBy: { period: "desc" },
  });

  const byType = new Map<string, number>();
  for (const log of wasteLogs) {
    const subType = log.source?.split(":")[0] ?? "unknown";
    byType.set(subType, (byType.get(subType) ?? 0) + log.amount);
  }

  const totalWaste = wasteLogs.reduce((sum, l) => sum + l.amount, 0);

  return {
    totalWaste,
    byType: Object.fromEntries(byType),
    entryCount: wasteLogs.length,
    period: { from, to },
  };
}

export async function getWasteTrend(restaurantId: string, from: Date, to: Date) {
  const logs = await db.carbonLog.findMany({
    where: {
      restaurantId,
      period: { gte: from, lte: to },
      category: "waste",
    },
    orderBy: { period: "asc" },
  });

  const byDate = new Map<string, number>();
  for (const log of logs) {
    const key = log.period.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + log.amount);
  }

  return Array.from(byDate.entries()).map(([date, amount]) => ({ date, amount }));
}
