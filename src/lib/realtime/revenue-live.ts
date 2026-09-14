import { db } from "@/lib/db";

export type LiveRevenueData = {
  currentHour: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  hourlyBreakdown: Array<{ hour: number; revenue: number }>;
};

export async function getLiveRevenue(restaurantId: string): Promise<LiveRevenueData> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordersToday = await db.order.findMany({
    where: { restaurantId, createdAt: { gte: startOfDay } },
    select: { total: true, createdAt: true },
  });

  const ordersWeek = await db.order.findMany({
    where: { restaurantId, createdAt: { gte: startOfWeek } },
    select: { total: true },
  });

  const ordersMonth = await db.order.findMany({
    where: { restaurantId, createdAt: { gte: startOfMonth } },
    select: { total: true },
  });

  const today = ordersToday.reduce((sum, o) => sum + o.total, 0);
  const thisWeek = ordersWeek.reduce((sum, o) => sum + o.total, 0);
  const thisMonth = ordersMonth.reduce((sum, o) => sum + o.total, 0);

  const hourlyMap = new Map<number, number>();
  for (const o of ordersToday) {
    const hour = o.createdAt.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + o.total);
  }

  const hourlyBreakdown = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    revenue: hourlyMap.get(i) ?? 0,
  }));

  return {
    currentHour: hourlyMap.get(now.getHours()) ?? 0,
    today,
    thisWeek,
    thisMonth,
    hourlyBreakdown,
  };
}

export async function getRevenueComparison(restaurantId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [todayOrders, yesterdayOrders] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, createdAt: { gte: today } },
      select: { total: true },
    }),
    db.order.findMany({
      where: { restaurantId, createdAt: { gte: yesterday, lt: today } },
      select: { total: true },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

  return {
    today: todayRevenue,
    yesterday: yesterdayRevenue,
    change: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0,
  };
}
