import { db } from "@/lib/db";

export type CrossPropertyMetrics = {
  groupId: string;
  groupName: string;
  totalRevenue: number;
  totalCovers: number;
  avgSpend: number;
  properties: Array<{
    restaurantId: string;
    revenue: number;
    covers: number;
    avgSpend: number;
  }>;
  period: Date;
};

export async function getCrossPropertyMetrics(groupId: string, from: Date, to: Date) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const restaurantIds = group.restaurants as string[];

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: { in: restaurantIds },
      startsAt: { gte: from, lte: to },
      status: "COMPLETED",
    },
    select: { restaurantId: true, partySize: true, guestId: true },
  });

  const byRestaurant = new Map<string, { revenue: number; covers: number }>();

  for (const r of restaurantIds) {
    byRestaurant.set(r, { revenue: 0, covers: 0 });
  }

  for (const res of reservations) {
    const stats = byRestaurant.get(res.restaurantId)!;
    stats.covers += res.partySize;

    const orderTotal = await db.order.aggregate({
      where: { guestId: res.guestId, restaurantId: res.restaurantId },
      _sum: { total: true },
    });
    stats.revenue += orderTotal._sum.total ?? 0;
  }

  const properties = restaurantIds.map((id) => {
    const s = byRestaurant.get(id)!;
    return {
      restaurantId: id,
      revenue: s.revenue,
      covers: s.covers,
      avgSpend: s.covers > 0 ? Math.round(s.revenue / s.covers) : 0,
    };
  });

  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const totalCovers = properties.reduce((s, p) => s + p.covers, 0);

  return {
    groupId,
    groupName: group.name,
    totalRevenue,
    totalCovers,
    avgSpend: totalCovers > 0 ? Math.round(totalRevenue / totalCovers) : 0,
    properties,
    period: from,
  };
}

export async function getGroupAnalytics(groupId: string, period: Date) {
  return db.groupAnalytics.findUnique({
    where: { groupId_period: { groupId, period } },
  });
}

export async function upsertGroupAnalytics(
  groupId: string,
  period: Date,
  data: {
    totalRevenue: number;
    totalCovers: number;
    avgSpend: number;
    topPerformers: Array<{ restaurantId: string; revenue: number }>;
  },
) {
  return db.groupAnalytics.upsert({
    where: { groupId_period: { groupId, period } },
    create: { groupId, period, ...data, topPerformers: data.topPerformers },
    update: { ...data, topPerformers: data.topPerformers },
  });
}
