import { db } from "@/lib/db";

export type KitchenMetrics = {
  ordersPending: number;
  ordersPreparing: number;
  ordersReady: number;
  avgPrepTime: number;
  bottleneckStation: string | null;
};

export async function getKitchenMetrics(restaurantId: string): Promise<KitchenMetrics> {
  const [pending, preparing, ready] = await Promise.all([
    db.order.count({ where: { restaurantId, status: "PENDING" } }),
    db.order.count({ where: { restaurantId, status: "PREPARING" } }),
    db.order.count({ where: { restaurantId, status: "READY" } }),
  ]);

  const recentCompleted = await db.order.findMany({
    where: { restaurantId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { createdAt: true, updatedAt: true },
  });

  const avgPrepTime =
    recentCompleted.length > 0
      ? Math.round(
          recentCompleted.reduce((sum, o) => sum + (o.updatedAt.getTime() - o.createdAt.getTime()), 0) /
            recentCompleted.length /
            1000,
        )
      : 0;

  const recentPreparing = await db.order.findMany({
    where: { restaurantId, status: "PREPARING" },
    include: { items: { select: { menuItem: { select: { category: true } } } } },
    take: 20,
  });

  const categoryCount = new Map<string, number>();
  for (const order of recentPreparing) {
    for (const item of order.items) {
      const cat = item.menuItem.category;
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
    }
  }

  let bottleneckStation: string | null = null;
  let maxCount = 0;
  for (const [cat, count] of categoryCount) {
    if (count > maxCount) {
      maxCount = count;
      bottleneckStation = cat;
    }
  }

  return {
    ordersPending: pending,
    ordersPreparing: preparing,
    ordersReady: ready,
    avgPrepTime,
    bottleneckStation,
  };
}

export async function recordKitchenLoad(restaurantId: string) {
  const metrics = await getKitchenMetrics(restaurantId);
  const totalOrders = metrics.ordersPending + metrics.ordersPreparing + metrics.ordersReady;

  return db.liveMetric.create({
    data: {
      restaurantId,
      metricType: "kitchen_load",
      value: totalOrders,
      unit: "orders",
      metadata: {
        pending: String(metrics.ordersPending),
        preparing: String(metrics.ordersPreparing),
        ready: String(metrics.ordersReady),
        avgPrepTime: String(metrics.avgPrepTime),
      },
    },
  });
}
