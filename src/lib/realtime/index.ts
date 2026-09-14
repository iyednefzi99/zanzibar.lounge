import { db } from "@/lib/db";

export async function recordLiveMetric(
  restaurantId: string,
  metricType: string,
  value: number,
  unit?: string,
  metadata?: Record<string, string>,
) {
  return db.liveMetric.create({
    data: { restaurantId, metricType, value, unit, metadata },
  });
}

export async function getLatestMetrics(restaurantId: string, metricType?: string) {
  const where: Record<string, unknown> = { restaurantId };
  if (metricType) where.metricType = metricType;

  return db.liveMetric.findMany({
    where,
    orderBy: { recordedAt: "desc" },
    take: 100,
  });
}

export async function getMetricHistory(
  restaurantId: string,
  metricType: string,
  from: Date,
  to: Date,
) {
  return db.liveMetric.findMany({
    where: {
      restaurantId,
      metricType,
      recordedAt: { gte: from, lte: to },
    },
    orderBy: { recordedAt: "asc" },
  });
}

export async function getMetricAggregates(
  restaurantId: string,
  metricType: string,
  from: Date,
  to: Date,
) {
  const metrics = await getMetricHistory(restaurantId, metricType, from, to);

  if (metrics.length === 0) {
    return { min: 0, max: 0, avg: 0, latest: 0, count: 0 };
  }

  const values = metrics.map((m) => m.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    latest: values[values.length - 1],
    count: values.length,
  };
}

export async function cleanupOldMetrics(olderThanDays: number = 90) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  return db.liveMetric.deleteMany({
    where: { recordedAt: { lt: cutoff } },
  });
}
