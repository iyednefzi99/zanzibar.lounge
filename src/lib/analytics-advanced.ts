import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { toISODate, addDays, weekdayOf } from "@/lib/time";

// --- Types ---

export type RealtimeStats = {
  activeReservations: number;
  seatedNow: number;
  arrivingNextHour: number;
  revenueToday: number;
  revenueYesterday: number;
  zoneOccupancy: Array<{
    zone: string;
    seated: number;
    capacity: number;
  }>;
};

export type CohortRow = {
  firstVisitMonth: string;
  totalGuests: number;
  retention: Array<{
    month: string;
    retained: number;
    rate: number;
  }>;
};

export type RevenueDay = {
  date: string;
  revenue: number;
  avgOrderValue: number;
};

export type RevenueByChannel = {
  channel: string;
  revenue: number;
  count: number;
};

export type RevenueByZone = {
  zone: string;
  revenue: number;
  count: number;
};

export type RevenueAnalytics = {
  daily: RevenueDay[];
  byChannel: RevenueByChannel[];
  byZone: RevenueByZone[];
  totalRevenue: number;
  avgOrderValue: number;
};

export type GuestLifetime = {
  guestId: string;
  name: string | null;
  phone: string;
  totalSpend: number;
  visitCount: number;
  avgVisitFrequency: number;
  lastVisit: string;
  daysSinceLastVisit: number;
};

export type HourlyHeatmapData = {
  dayOfWeek: number;
  hour: number;
  count: number;
};

const ZONE_CAPACITIES: Record<string, number> = {
  TERRASSE: 24,
  SALLE: 32,
  SALON: 16,
};

const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

// --- Functions ---

/**
 * Real-time stats for the dashboard.
 * Returns current active reservations, seated parties, expected arrivals,
 * and today's revenue.
 */
export async function getRealtimeStats(
  restaurantId?: string,
): Promise<RealtimeStats> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const yesterday = addDays(today, -1);

  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [seatedReservations, arrivingReservations, todayPayments, yesterdayPayments] =
    await Promise.all([
      db.reservation.findMany({
        where: {
          restaurantId: rid,
          status: "SEATED",
        },
        select: { zone: true, partySize: true },
      }),
      db.reservation.findMany({
        where: {
          restaurantId: rid,
          status: { in: ["CONFIRMED", "PENDING"] },
          startsAt: { gte: now, lte: nextHour },
        },
        select: { zone: true, partySize: true },
      }),
      db.payment.findMany({
        where: {
          restaurantId: rid,
          status: "SUCCEEDED",
          paidAt: {
            gte: new Date(today + "T00:00:00+01:00"),
            lt: new Date(today + "T23:59:59+01:00"),
          },
        },
        select: { amount: true },
      }),
      db.payment.findMany({
        where: {
          restaurantId: rid,
          status: "SUCCEEDED",
          paidAt: {
            gte: new Date(yesterday + "T00:00:00+01:00"),
            lt: new Date(yesterday + "T23:59:59+01:00"),
          },
        },
        select: { amount: true },
      }),
    ]);

  const zoneCounts = new Map<string, number>();
  for (const r of seatedReservations) {
    if (r.zone) {
      zoneCounts.set(r.zone, (zoneCounts.get(r.zone) ?? 0) + r.partySize);
    }
  }

  const zoneOccupancy = Object.entries(ZONE_CAPACITIES).map(
    ([zone, capacity]) => ({
      zone: zone.charAt(0) + zone.slice(1).toLowerCase(),
      seated: zoneCounts.get(zone) ?? 0,
      capacity,
    }),
  );

  return {
    activeReservations:
      seatedReservations.length + arrivingReservations.length,
    seatedNow: seatedReservations.length,
    arrivingNextHour: arrivingReservations.length,
    revenueToday: todayPayments.reduce((s, p) => s + p.amount, 0),
    revenueYesterday: yesterdayPayments.reduce((s, p) => s + p.amount, 0),
    zoneOccupancy,
  };
}

/**
 * Cohort analysis: group guests by first visit month, track retention
 * in subsequent months.
 */
export async function getCohortAnalysis(
  restaurantId?: string,
  months = 6,
): Promise<CohortRow[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const startDate = addDays(today, -months * 31);

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: startDate },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: {
      guestId: true,
      serviceDate: true,
    },
    orderBy: { serviceDate: "asc" },
  });

  if (reservations.length === 0) return [];

  // Build guest → first visit month map
  const guestFirstVisit = new Map<string, string>();
  for (const r of reservations) {
    const month = r.serviceDate.slice(0, 7);
    const existing = guestFirstVisit.get(r.guestId);
    if (!existing || month < existing) {
      guestFirstVisit.set(r.guestId, month);
    }
  }

  // Build guest → set of months visited
  const guestMonths = new Map<string, Set<string>>();
  for (const r of reservations) {
    const month = r.serviceDate.slice(0, 7);
    const set = guestMonths.get(r.guestId) ?? new Set();
    set.add(month);
    guestMonths.set(r.guestId, set);
  }

  // Get all months in range
  const allMonths = new Set<string>();
  for (const r of reservations) {
    allMonths.add(r.serviceDate.slice(0, 7));
  }
  const sortedMonths = [...allMonths].sort();

  // Group guests by first visit month
  const cohorts = new Map<string, string[]>();
  for (const [guestId, firstMonth] of guestFirstVisit) {
    const list = cohorts.get(firstMonth) ?? [];
    list.push(guestId);
    cohorts.set(firstMonth, list);
  }

  // Build retention table
  const result: CohortRow[] = [];
  for (const [firstMonth, guestIds] of cohorts) {
    const retention = sortedMonths
      .filter((m) => m >= firstMonth)
      .slice(0, months + 1)
      .map((month) => {
        const retained = guestIds.filter((gid) => {
          const visited = guestMonths.get(gid);
          return visited?.has(month) ?? false;
        }).length;
        return {
          month,
          retained,
          rate: guestIds.length > 0 ? retained / guestIds.length : 0,
        };
      });

    result.push({
      firstVisitMonth: firstMonth,
      totalGuests: guestIds.length,
      retention,
    });
  }

  return result.sort((a, b) => a.firstVisitMonth.localeCompare(b.firstVisitMonth));
}

/**
 * Revenue analytics over N days.
 */
export async function getRevenueAnalytics(
  restaurantId?: string,
  days = 30,
): Promise<RevenueAnalytics> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const from = addDays(today, -days + 1);

  const payments = await db.payment.findMany({
    where: {
      restaurantId: rid,
      status: "SUCCEEDED",
      paidAt: { not: null },
    },
    select: {
      amount: true,
      paidAt: true,
      reservationId: true,
    },
  });

  // Filter to date range
  const inRange = payments.filter((p) => {
    const dateStr = toISODate(p.paidAt!, "Africa/Tunis");
    return dateStr >= from && dateStr <= today;
  });

  // Daily revenue
  const byDay = new Map<string, { revenue: number; count: number }>();
  for (const p of inRange) {
    const dateStr = toISODate(p.paidAt!, "Africa/Tunis");
    const entry = byDay.get(dateStr) ?? { revenue: 0, count: 0 };
    entry.revenue += p.amount;
    entry.count += 1;
    byDay.set(dateStr, entry);
  }

  // Fill missing days
  const daily: RevenueDay[] = [];
  const current = new Date(from + "T00:00:00Z");
  const endDate = new Date(today + "T00:00:00Z");
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const entry = byDay.get(dateStr);
    daily.push({
      date: dateStr,
      revenue: entry?.revenue ?? 0,
      avgOrderValue:
        entry && entry.count > 0
          ? Math.round(entry.revenue / entry.count)
          : 0,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Revenue by channel (via reservations)
  const reservationIds = inRange
    .map((p) => p.reservationId)
    .filter((id): id is string => id !== null);

  const reservations =
    reservationIds.length > 0
      ? await db.reservation.findMany({
          where: { id: { in: reservationIds } },
          select: { id: true, channel: true, zone: true },
        })
      : [];

  const resChannelMap = new Map(
    reservations.map((r) => [r.id, { channel: r.channel, zone: r.zone }]),
  );

  const channelRevenue = new Map<string, { revenue: number; count: number }>();
  const zoneRevenue = new Map<string, { revenue: number; count: number }>();

  const channelLabels: Record<string, string> = {
    WEB: "Web",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    PHONE: "Téléphone",
  };

  const zoneLabels: Record<string, string> = {
    TERRASSE: "Terrasse",
    SALLE: "Salle",
    SALON: "Salon",
  };

  for (const p of inRange) {
    if (p.reservationId) {
      const meta = resChannelMap.get(p.reservationId);
      if (meta) {
        const chLabel = channelLabels[meta.channel] ?? meta.channel;
        const chEntry = channelRevenue.get(chLabel) ?? { revenue: 0, count: 0 };
        chEntry.revenue += p.amount;
        chEntry.count += 1;
        channelRevenue.set(chLabel, chEntry);

        if (meta.zone) {
          const zLabel = zoneLabels[meta.zone] ?? meta.zone;
          const zEntry = zoneRevenue.get(zLabel) ?? { revenue: 0, count: 0 };
          zEntry.revenue += p.amount;
          zEntry.count += 1;
          zoneRevenue.set(zLabel, zEntry);
        }
      }
    }
  }

  const totalRevenue = inRange.reduce((s, p) => s + p.amount, 0);
  const totalCount = inRange.length;

  return {
    daily,
    byChannel: [...channelRevenue.entries()]
      .map(([channel, data]) => ({ channel, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byZone: [...zoneRevenue.entries()]
      .map(([zone, data]) => ({ zone, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    totalRevenue,
    avgOrderValue: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
  };
}

/**
 * Guest lifetime value: top guests by total spend, visit frequency, last visit.
 */
export async function getGuestLifetimeValue(
  restaurantId?: string,
  limit = 20,
): Promise<GuestLifetime[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");

  const payments = await db.payment.findMany({
    where: {
      restaurantId: rid,
      status: "SUCCEEDED",
    },
    select: {
      guestId: true,
      amount: true,
      paidAt: true,
    },
  });

  if (payments.length === 0) return [];

  // Aggregate by guest
  const guestData = new Map<
    string,
    { totalSpend: number; visits: string[] }
  >();

  for (const p of payments) {
    const entry = guestData.get(p.guestId) ?? { totalSpend: 0, visits: [] };
    entry.totalSpend += p.amount;
    if (p.paidAt) {
      const dateStr = toISODate(p.paidAt, "Africa/Tunis");
      if (!entry.visits.includes(dateStr)) {
        entry.visits.push(dateStr);
      }
    }
    guestData.set(p.guestId, entry);
  }

  // Fetch guest info
  const guestIds = [...guestData.keys()];
  const guests = await db.guest.findMany({
    where: { id: { in: guestIds } },
    select: { id: true, name: true, phone: true },
  });

  const guestInfo = new Map(guests.map((g) => [g.id, g]));

  // Compute metrics
  const result: GuestLifetime[] = [...guestData.entries()]
    .map(([guestId, data]) => {
      const info = guestInfo.get(guestId);
      const sortedVisits = data.visits.sort();
      const lastVisit = sortedVisits[sortedVisits.length - 1] ?? today;

      let avgVisitFrequency = 0;
      if (sortedVisits.length >= 2) {
        const first = new Date(sortedVisits[0] + "T00:00:00Z");
        const last = new Date(lastVisit + "T00:00:00Z");
        const daysSpan = Math.max(
          1,
          (last.getTime() - first.getTime()) / 86_400_000,
        );
        avgVisitFrequency = Math.round((sortedVisits.length / daysSpan) * 30 * 10) / 10;
      }

      const daysSinceLastVisit = Math.max(
        0,
        Math.round(
          (new Date(today + "T00:00:00Z").getTime() -
            new Date(lastVisit + "T00:00:00Z").getTime()) /
            86_400_000,
        ),
      );

      return {
        guestId,
        name: info?.name ?? null,
        phone: info?.phone ?? "",
        totalSpend: data.totalSpend,
        visitCount: data.visits.length,
        avgVisitFrequency,
        lastVisit,
        daysSinceLastVisit,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, limit);

  return result;
}

/**
 * Hourly heatmap: 7x24 grid (day of week × hour) of reservation density.
 */
export async function getHourlyHeatmap(
  restaurantId?: string,
  days = 90,
): Promise<HourlyHeatmapData[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const from = addDays(today, -days);

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: from, lte: today },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: {
      startsAt: true,
      serviceDate: true,
    },
  });

  const grid = new Map<string, number>();

  for (const r of reservations) {
    const weekday = weekdayOf(r.serviceDate);
    const hour = extractLocalHour(r.startsAt);
    const key = `${weekday}-${hour}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }

  const result: HourlyHeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        dayOfWeek: day,
        hour,
        count: grid.get(`${day}-${hour}`) ?? 0,
      });
    }
  }

  return result;
}

// --- Helpers ---

function extractLocalHour(date: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tunis",
    hour12: false,
    hour: "2-digit",
  }).format(date);
  return parseInt(formatted, 10);
}

export { DAY_NAMES };
