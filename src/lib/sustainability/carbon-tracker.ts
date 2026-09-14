import { db } from "@/lib/db";

export type CarbonCategory = "energy" | "transport" | "waste" | "water";

export async function logCarbon(
  restaurantId: string,
  category: CarbonCategory,
  amount: number,
  unit: string,
  source: string | null,
  period: Date,
) {
  return db.carbonLog.create({
    data: { restaurantId, category, amount, unit, source, period },
  });
}

export async function getCarbonLogs(
  restaurantId: string,
  from: Date,
  to: Date,
  category?: CarbonCategory,
) {
  return db.carbonLog.findMany({
    where: {
      restaurantId,
      period: { gte: from, lte: to },
      ...(category ? { category } : {}),
    },
    orderBy: { period: "desc" },
  });
}

export async function getCarbonSummary(restaurantId: string, from: Date, to: Date) {
  const logs = await getCarbonLogs(restaurantId, from, to);

  const byCategory: Record<string, { total: number; unit: string; count: number }> = {};

  for (const log of logs) {
    if (!byCategory[log.category]) {
      byCategory[log.category] = { total: 0, unit: log.unit, count: 0 };
    }
    byCategory[log.category].total += log.amount;
    byCategory[log.category].count++;
  }

  const totalCarbon = Object.values(byCategory).reduce((sum, c) => sum + c.total, 0);

  return {
    totalCarbon,
    byCategory,
    logCount: logs.length,
    period: { from, to },
  };
}

export async function deleteCarbonLog(id: string) {
  return db.carbonLog.delete({ where: { id } });
}
