import { db } from "@/lib/db";

export type ZoneOccupancy = {
  zone: string;
  currentCovers: number;
  capacity: number;
  utilization: number;
};

const DEFAULT_ZONES: Record<string, number> = {
  TERRASSE: 40,
  SALLE: 60,
  SALON: 20,
};

export async function getFloorHeatmap(restaurantId: string) {
  const now = new Date();

  const activeReservations = await db.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ["CONFIRMED", "SEATED"] },
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    select: { zone: true, partySize: true },
  });

  const zonesConfig = DEFAULT_ZONES;

  const byZone = new Map<string, number>();
  for (const r of activeReservations) {
    const zone = r.zone ?? "SALLE";
    byZone.set(zone, (byZone.get(zone) ?? 0) + r.partySize);
  }

  const heatmap: ZoneOccupancy[] = Object.entries(zonesConfig).map(([zone, capacity]) => ({
    zone,
    currentCovers: byZone.get(zone) ?? 0,
    capacity,
    utilization: Math.round(((byZone.get(zone) ?? 0) / capacity) * 100),
  }));

  const totalCovers = heatmap.reduce((s, z) => s + z.currentCovers, 0);
  const totalCapacity = heatmap.reduce((s, z) => s + z.capacity, 0);

  return {
    zones: heatmap,
    totalCovers,
    totalCapacity,
    overallUtilization: totalCapacity > 0 ? Math.round((totalCovers / totalCapacity) * 100) : 0,
  };
}

export async function getZoneHistory(restaurantId: string, from: Date, to: Date) {
  const metrics = await db.liveMetric.findMany({
    where: {
      restaurantId,
      metricType: "covers",
      recordedAt: { gte: from, lte: to },
    },
    orderBy: { recordedAt: "asc" },
  });

  return metrics.map((m) => ({
    time: m.recordedAt,
    value: m.value,
    metadata: m.metadata as Record<string, string>,
  }));
}
