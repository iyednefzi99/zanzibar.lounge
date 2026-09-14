import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { weekdayOf, addDays } from "@/lib/time";
import { logger } from "@/lib/logger";

// --- Types ---

export type OccupancyPrediction = {
  predicted: number;
  confidence: "low" | "medium" | "high";
  trend: "up" | "down" | "stable";
  historicalAvg: number;
};

export type Recommendation = {
  type: "staff" | "promotion" | "menu" | "pricing";
  message: string;
  priority: "high" | "medium" | "low";
};

export type TrendAnalysis = {
  covers: { current: number; previous: number; change: number };
  avgPartySize: number;
  channels: Record<string, number>;
  cancellationRate: number;
};

export type PeakHour = {
  hour: number;
  label: string;
  covers: number;
};

export type CustomerSegment = {
  segment: string;
  count: number;
  percentage: number;
};

// --- Capacités ---

const MAX_COVERS_PER_SLOT = 40;

// --- predictOccupancy ---

/**
 * Predict expected occupancy for a given date based on historical patterns.
 * Uses same day of week from previous 4 weeks and trend analysis.
 */
export async function predictOccupancy(
  date: string,
  restaurantId?: string,
): Promise<OccupancyPrediction> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const targetWeekday = weekdayOf(date);

  const historicalDates: string[] = [];
  for (let i = 1; i <= 4; i++) {
    historicalDates.push(addDays(date, -7 * i));
  }

  const rows = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { in: historicalDates },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { serviceDate: true, partySize: true },
  });

  const coversByDate = new Map<string, number>();
  for (const row of rows) {
    coversByDate.set(
      row.serviceDate,
      (coversByDate.get(row.serviceDate) ?? 0) + row.partySize,
    );
  }

  const weeklyCovers = historicalDates.map(
    (d) => coversByDate.get(d) ?? 0,
  );

  const totalHistorical = weeklyCovers.reduce((s, c) => s + c, 0);
  const historicalAvg = weeklyCovers.length > 0
    ? totalHistorical / weeklyCovers.length
    : 0;

  const trend = computeTrend(weeklyCovers);

  let predicted = historicalAvg;
  if (trend === "up" && historicalAvg > 0) {
    predicted = historicalAvg * 1.1;
  } else if (trend === "down" && historicalAvg > 0) {
    predicted = historicalAvg * 0.9;
  }

  const dayOfWeekMultiplier = getDayOfWeekMultiplier(targetWeekday);
  predicted = predicted * dayOfWeekMultiplier;
  predicted = Math.min(predicted, MAX_COVERS_PER_SLOT);

  const confidence = computeConfidence(weeklyCovers, historicalAvg);

  const result: OccupancyPrediction = {
    predicted: Math.round(predicted),
    confidence,
    trend,
    historicalAvg: Math.round(historicalAvg),
  };

  logger.info("Occupancy prediction computed", {
    date,
    targetWeekday,
    ...result,
  });

  return result;
}

// --- getRecommendations ---

/**
 * Generate actionable recommendations based on historical data.
 */
export async function getRecommendations(
  restaurantId?: string,
): Promise<Recommendation[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const recommendations: Recommendation[] = [];

  const now = new Date();
  const eightWeeksAgo = addDays(
    now.toISOString().slice(0, 10),
    -56,
  );
  const today = now.toISOString().slice(0, 10);

  const rows = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: eightWeeksAgo, lte: today },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { serviceDate: true, partySize: true, startsAt: true },
    orderBy: { startsAt: "asc" },
  });

  const coversByDate = new Map<string, number>();
  const coversByWeekday = new Map<number, number[]>();
  const countByWeekday = new Map<number, number>();

  for (const row of rows) {
    coversByDate.set(
      row.serviceDate,
      (coversByDate.get(row.serviceDate) ?? 0) + row.partySize,
    );

    const wd = weekdayOf(row.serviceDate);
    const current = coversByWeekday.get(wd) ?? [];
    current.push(row.partySize);
    coversByWeekday.set(wd, current);
    countByWeekday.set(wd, (countByWeekday.get(wd) ?? 0) + 1);
  }

  const daysWithCovers = [...coversByDate.values()];
  const avgDailyCovers =
    daysWithCovers.length > 0
      ? daysWithCovers.reduce((s, c) => s + c, 0) / daysWithCovers.length
      : 0;

  const dayLabels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  for (let wd = 0; wd < 7; wd++) {
    const weekdayCovers = coversByWeekday.get(wd) ?? [];
    if (weekdayCovers.length === 0) continue;

    const avgForDay =
      weekdayCovers.reduce((s, c) => s + c, 0) / weekdayCovers.length;
    const fillRate = avgForDay / MAX_COVERS_PER_SLOT;

    if (fillRate > 0.8) {
      const counts = countByWeekday.get(wd) ?? 0;
      const weeksObserved = Math.max(counts / (avgForDay || 1), 1);
      if (weeksObserved >= 3) {
        recommendations.push({
          type: "staff",
          message: `Ajouter du personnel le ${dayLabels[wd]} soir — remplissage moyen supérieur à ${Math.round(fillRate * 100)}%.`,
          priority: "high",
        });
      }
    }

    if (fillRate < 0.4 && weekdayCovers.length > 0) {
      recommendations.push({
        type: "promotion",
        message: `Promouvoir les ${dayLabels[wd]} — remplissage moyen de ${Math.round(fillRate * 100)}%.`,
        priority: fillRate < 0.2 ? "high" : "medium",
      });
    }
  }

  const allStartsAt = rows.map((r) => r.startsAt);
  if (allStartsAt.length > 0) {
    const hourCounts = new Map<number, number>();
    for (const startsAt of allStartsAt) {
      const hour = extractLocalHour(startsAt);
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }

    const sorted = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [peakHour, peakCount] = sorted[0];
      const peakPct = Math.round((peakCount / allStartsAt.length) * 100);
      recommendations.push({
        type: "menu",
        message: `Le créneau le plus demandé est ${String(peakHour).padStart(2, "0")}:00 (${peakPct}% des réservations).`,
        priority: "medium",
      });
    }
  }

  if (avgDailyCovers > 0 && avgDailyCovers < MAX_COVERS_PER_SLOT * 0.5) {
    recommendations.push({
      type: "pricing",
      message: `Occupation moyenne faible (${Math.round(avgDailyCovers)} couverts/jour). Envisager des offres happier hour ou menu du jour.`,
      priority: "medium",
    });
  }

  logger.info("Recommendations generated", {
    count: recommendations.length,
    restaurantId: rid,
  });

  return recommendations;
}

// --- getTrendAnalysis ---

/**
 * Analyze trends over N days comparing the last N days to the N days before.
 */
export async function getTrendAnalysis(
  days: number,
  restaurantId?: string,
): Promise<TrendAnalysis> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentStart = addDays(today, -days + 1);
  const previousStart = addDays(today, -days * 2 + 1);
  const previousEnd = addDays(today, -days);

  const currentRows = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: currentStart, lte: today },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { partySize: true, channel: true },
  });

  const previousRows = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: previousStart, lte: previousEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { partySize: true, channel: true },
  });

  const currentCovers = currentRows.reduce((s, r) => s + r.partySize, 0);
  const previousCovers = previousRows.reduce((s, r) => s + r.partySize, 0);
  const coversChange =
    previousCovers > 0
      ? Math.round(((currentCovers - previousCovers) / previousCovers) * 100)
      : 0;

  const currentAvgPartySize =
    currentRows.length > 0
      ? Math.round(
          (currentRows.reduce((s, r) => s + r.partySize, 0) /
            currentRows.length) *
            10,
        ) / 10
      : 0;

  const channels: Record<string, number> = {};
  for (const row of currentRows) {
    channels[row.channel] = (channels[row.channel] ?? 0) + 1;
  }

  const currentAll = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: currentStart, lte: today },
    },
    select: { status: true },
  });

  const totalCurrent = currentAll.length;
  const cancelledCurrent = currentAll.filter(
    (r) => r.status === "CANCELLED" || r.status === "NO_SHOW",
  ).length;
  const cancellationRate =
    totalCurrent > 0 ? Math.round((cancelledCurrent / totalCurrent) * 100) : 0;

  const result: TrendAnalysis = {
    covers: {
      current: currentCovers,
      previous: previousCovers,
      change: coversChange,
    },
    avgPartySize: currentAvgPartySize,
    channels,
    cancellationRate,
  };

  logger.info("Trend analysis computed", {
    days,
    restaurantId: rid,
    coversChange: coversChange,
    cancellationRate,
  });

  return result;
}

// --- getPeakHours ---

/**
 * Find the top 3 peak hours based on reservation start times.
 */
export async function getPeakHours(
  restaurantId?: string,
): Promise<PeakHour[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());

  const thirtyDaysAgo = addDays(
    new Date().toISOString().slice(0, 10),
    -30,
  );

  const rows = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: thirtyDaysAgo },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true, partySize: true },
  });

  const hourCovers = new Map<number, number>();
  for (const row of rows) {
    const hour = extractLocalHour(row.startsAt);
    hourCovers.set(hour, (hourCovers.get(hour) ?? 0) + row.partySize);
  }

  const sorted = [...hourCovers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const result: PeakHour[] = sorted.map(([hour, covers]) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    covers,
  }));

  logger.info("Peak hours computed", {
    restaurantId: rid,
    topHours: result.map((r) => r.label),
  });

  return result;
}

// --- getCustomerSegments ---

/**
 * Segment customers based on loyalty points and reservation history.
 */
export async function getCustomerSegments(
  restaurantId?: string,
): Promise<CustomerSegment[]> {
  const rid = restaurantId ?? (await getDefaultRestaurantId());
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = addDays(today, -30);

  const loyaltyAccounts = await db.loyaltyAccount.findMany({
    where: { restaurantId: rid },
    select: {
      guestId: true,
      points: true,
    },
  });

  const guestIds = loyaltyAccounts.map((a) => a.guestId);
  if (guestIds.length === 0) {
    return [];
  }

  const reservationsByGuest = await db.reservation.groupBy({
    by: ["guestId"],
    where: {
      restaurantId: rid,
      guestId: { in: guestIds },
      status: { in: ["COMPLETED", "SEATED", "CONFIRMED"] },
    },
    _count: { id: true },
  });

  const reservationCounts = new Map(
    reservationsByGuest.map((r) => [r.guestId, r._count.id]),
  );

  const lastReservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      guestId: { in: guestIds },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { guestId: true, serviceDate: true },
    orderBy: { serviceDate: "desc" },
  });

  const lastResByGuest = new Map<string, string>();
  for (const row of lastReservations) {
    if (!lastResByGuest.has(row.guestId)) {
      lastResByGuest.set(row.guestId, row.serviceDate);
    }
  }

  const segments = new Map<string, number>();

  for (const account of loyaltyAccounts) {
    const guestId = account.guestId;
    const points = account.points;
    const completedRes = reservationCounts.get(guestId) ?? 0;
    const lastResDate = lastResByGuest.get(guestId);

    let segment: string;

    if (points > 500) {
      segment = "VIP";
    } else if (completedRes >= 2) {
      segment = "Regular";
    } else if (completedRes === 1) {
      segment = "Occasional";
    } else if (
      !lastResDate ||
      lastResDate < thirtyDaysAgo
    ) {
      segment = "At risk";
    } else {
      segment = "Occasional";
    }

    segments.set(segment, (segments.get(segment) ?? 0) + 1);
  }

  const total = guestIds.length;
  const result: CustomerSegment[] = [...segments.entries()]
    .map(([segment, count]) => ({
      segment,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  logger.info("Customer segments computed", {
    restaurantId: rid,
    total,
    segments: result.map((r) => ({ segment: r.segment, count: r.count })),
  });

  return result;
}

// --- Helpers ---

function computeTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";

  const recent = values[0];
  const older = values[values.length - 1];

  if (older === 0 && recent === 0) return "stable";

  const changePercent =
    older === 0 ? (recent > 0 ? 100 : 0) : ((recent - older) / older) * 100;

  if (changePercent > 15) return "up";
  if (changePercent < -15) return "down";
  return "stable";
}

function getDayOfWeekMultiplier(weekday: number): number {
  const multipliers: Record<number, number> = {
    0: 0.7,  // Dimanche
    1: 0.6,  // Lundi
    2: 0.7,  // Mardi
    3: 0.8,  // Mercredi
    4: 0.9,  // Jeudi
    5: 1.2,  // Vendredi
    6: 1.3,  // Samedi
  };
  return multipliers[weekday] ?? 1.0;
}

function computeConfidence(
  weeklyCovers: number[],
  historicalAvg: number,
): "low" | "medium" | "high" {
  if (weeklyCovers.length < 3) return "low";

  const nonZeroWeeks = weeklyCovers.filter((c) => c > 0).length;
  if (nonZeroWeeks < 2) return "low";

  const variance =
    weeklyCovers.reduce((s, c) => s + Math.pow(c - historicalAvg, 2), 0) /
    weeklyCovers.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = historicalAvg > 0 ? stdDev / historicalAvg : 1;

  if (coefficientOfVariation < 0.2) return "high";
  if (coefficientOfVariation < 0.4) return "medium";
  return "low";
}

function extractLocalHour(date: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tunis",
    hour12: false,
    hour: "2-digit",
  }).format(date);
  return parseInt(formatted, 10);
}
