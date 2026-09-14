import { db } from "@/lib/db";

const DEFAULT_ZONES: Record<string, number> = {
  TERRASSE: 40,
  SALLE: 60,
  SALON: 20,
};

export async function getEstimatedWaitTime(restaurantId: string, partySize: number) {
  const now = new Date();

  const activeReservations = await db.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ["CONFIRMED", "SEATED"] },
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    select: { zone: true, partySize: true, endsAt: true },
  });

  const pendingReservations = await db.reservation.findMany({
    where: {
      restaurantId,
      status: "PENDING",
      startsAt: { gte: now, lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
    },
    select: { startsAt: true, partySize: true },
  });

  const totalActiveCovers = activeReservations.reduce((sum, r) => sum + r.partySize, 0);

  const zonesConfig = DEFAULT_ZONES;
  const totalCapacity = Object.values(zonesConfig).reduce((s, c) => s + c, 0);
  const utilization = totalCapacity > 0 ? totalActiveCovers / totalCapacity : 1;

  let baseWaitMinutes = 10;
  if (utilization > 0.9) baseWaitMinutes = 45;
  else if (utilization > 0.7) baseWaitMinutes = 30;
  else if (utilization > 0.5) baseWaitMinutes = 20;
  else if (utilization > 0.3) baseWaitMinutes = 10;
  else baseWaitMinutes = 5;

  if (partySize > 4) baseWaitMinutes += 10;
  if (partySize > 6) baseWaitMinutes += 15;

  const upcomingDepartures = activeReservations
    .filter((r) => r.endsAt)
    .sort((a, b) => (a.endsAt?.getTime() ?? 0) - (b.endsAt?.getTime() ?? 0));

  const nextAvailableSlot = upcomingDepartures.find((r) => r.partySize >= partySize);

  const estimatedWait = nextAvailableSlot
    ? Math.max(0, Math.round((nextAvailableSlot.endsAt!.getTime() - now.getTime()) / 60000))
    : baseWaitMinutes;

  return {
    estimatedWaitMinutes: estimatedWait,
    utilization: Math.round(utilization * 100),
    activeCovers: totalActiveCovers,
    capacity: totalCapacity,
    pendingCount: pendingReservations.length,
  };
}

export async function recordWaitTime(restaurantId: string) {
  const waitData = await getEstimatedWaitTime(restaurantId, 2);

  return db.liveMetric.create({
    data: {
      restaurantId,
      metricType: "wait_time",
      value: waitData.estimatedWaitMinutes,
      unit: "minutes",
      metadata: {
        utilization: String(waitData.utilization),
        activeCovers: String(waitData.activeCovers),
        capacity: String(waitData.capacity),
      },
    },
  });
}
