import { db } from "@/lib/db";

type WasteInput = {
  menuItemId?: string;
  category: string;
  quantity: number;
  unit?: string;
  reason: string;
  costCents?: number;
  loggedBy?: string;
  notes?: string;
};

export async function logWaste(restaurantId: string, input: WasteInput) {
  return db.wasteLog.create({
    data: { restaurantId, ...input },
  });
}

export async function getWasteStats(restaurantId: string, days?: number) {
  const since = new Date();
  since.setDate(since.getDate() - (days ?? 30));

  const logs = await db.wasteLog.findMany({
    where: { restaurantId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const totalCost = logs.reduce((sum, l) => sum + l.costCents, 0);
  const byCategory = logs.reduce(
    (acc, l) => {
      acc[l.category] = (acc[l.category] ?? 0) + l.quantity;
      return acc;
    },
    {} as Record<string, number>,
  );
  const byReason = logs.reduce(
    (acc, l) => {
      acc[l.reason] = (acc[l.reason] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return { totalCost, count: logs.length, byCategory, byReason, logs };
}
