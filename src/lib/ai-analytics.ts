import { db } from "@/lib/db";
import { toISODate, addDays, weekdayOf } from "@/lib/time";
import { logger } from "@/lib/logger";

// --- Types ---

export type RevenuePrediction = {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: "low" | "medium" | "high";
};

export type NoShowRisk = {
  reservationId: string;
  guestName: string | null;
  guestPhone: string;
  serviceDate: string;
  startsAt: string;
  partySize: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  factors: string[];
};

export type PricingSuggestion = {
  type: "happy_hour" | "peak_surcharge" | "off_peak_discount" | "weekend_premium";
  label: string;
  description: string;
  suggestedDiscount: number;
  targetHours: string[];
  expectedImpact: string;
  confidence: number;
};

export type SentimentResult = {
  reviewId: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  keywords: string[];
};

export type AIInsight = {
  category: "opportunity" | "risk" | "action";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  metric?: number;
};

export type DemandForecast = {
  hour: number;
  label: string;
  predictedCovers: number;
  confidence: "low" | "medium" | "high";
  typicalForDay: number;
};

export type MarketingSegment = {
  segment: string;
  guestCount: number;
  avgSpend: number;
  visitFrequency: number;
  recommendedOffer: string;
  channel: string;
};

// --- Constants ---

const DAY_LABELS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

const DAY_MULTIPLIERS: Record<number, number> = {
  0: 0.7, 1: 0.6, 2: 0.7, 3: 0.8, 4: 0.9, 5: 1.2, 6: 1.3,
};

const POSITIVE_KEYWORDS = [
  "excellent", "parfait", "magnifique", "superbe", "formidable", "génial",
  "délicieux", "savoureux", "fantastique", "incroyable", "adore", "aimé",
  "recommande", "bravo", "merveilleux", "sublime", "top", "impeccable",
  "accueil chaleureux", "service rapide", "ambiance", "cadre",
];

const NEGATIVE_KEYWORDS = [
  "mauvais", "horrible", "décevant", "nul", "désastre", "lent",
  "froid", "sale", "bruyant", "attente", "problème", "erreur",
  "arnaque", "surévalué", "pas cher", "dégoûtant", "immonde",
  " SERVICE", " clientele", "impoli",
];

// --- predictRevenue ---

/**
 * Predict revenue for the next N days using weighted moving average
 * with seasonal decomposition (day-of-week effects).
 */
export async function predictRevenue(
  restaurantId: string,
  days: number,
): Promise<RevenuePrediction[]> {
  const rid = restaurantId;
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const lookbackDays = 90;
  const fromDate = addDays(today, -lookbackDays);

  const payments = await db.payment.findMany({
    where: {
      restaurantId: rid,
      status: "SUCCEEDED",
      paidAt: { not: null },
    },
    select: { amount: true, paidAt: true },
  });

  const inRange = payments.filter((p) => {
    const dateStr = toISODate(p.paidAt!, "Africa/Tunis");
    return dateStr >= fromDate && dateStr <= today;
  });

  const revenueByDate = new Map<string, number>();
  for (const p of inRange) {
    const dateStr = toISODate(p.paidAt!, "Africa/Tunis");
    revenueByDate.set(dateStr, (revenueByDate.get(dateStr) ?? 0) + p.amount);
  }

  // Build daily revenue array (fill gaps with 0)
  const dailyRevenue: { date: string; revenue: number; weekday: number }[] = [];
  const cursor = new Date(fromDate + "T00:00:00Z");
  const endCursor = new Date(today + "T00:00:00Z");
  while (cursor <= endCursor) {
    const dateStr = cursor.toISOString().slice(0, 10);
    dailyRevenue.push({
      date: dateStr,
      revenue: revenueByDate.get(dateStr) ?? 0,
      weekday: weekdayOf(dateStr),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Compute weighted moving average (recent days weighted more)
  const windowSize = 14;
  const recentSlice = dailyRevenue.slice(-windowSize);
  const weightedSum = recentSlice.reduce(
    (s, d, i) => s + d.revenue * (i + 1),
    0,
  );
  const weightTotal = (windowSize * (windowSize + 1)) / 2;
  const baseAverage = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // Compute day-of-week seasonal factors
  const weekdayAverages = new Map<number, { sum: number; count: number }>();
  for (const d of dailyRevenue) {
    const entry = weekdayAverages.get(d.weekday) ?? { sum: 0, count: 0 };
    entry.sum += d.revenue;
    entry.count += 1;
    weekdayAverages.set(d.weekday, entry);
  }

  const overallAvg = dailyRevenue.length > 0
    ? dailyRevenue.reduce((s, d) => s + d.revenue, 0) / dailyRevenue.length
    : 1;

  const seasonalFactors = new Map<number, number>();
  for (let wd = 0; wd < 7; wd++) {
    const entry = weekdayAverages.get(wd);
    if (entry && entry.count > 0 && overallAvg > 0) {
      seasonalFactors.set(wd, entry.sum / entry.count / overallAvg);
    } else {
      seasonalFactors.set(wd, DAY_MULTIPLIERS[wd] ?? 1);
    }
  }

  // Compute standard deviation for confidence intervals
  const variance = dailyRevenue.length > 0
    ? dailyRevenue.reduce((s, d) => s + Math.pow(d.revenue - overallAvg, 2), 0) / dailyRevenue.length
    : 0;
  const stdDev = Math.sqrt(variance);

  // Compute trend
  const recentAvg = dailyRevenue.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7;
  const olderAvg = dailyRevenue.slice(-14, -7).reduce((s, d) => s + d.revenue, 0) / 7;
  const trendFactor = olderAvg > 0 ? recentAvg / olderAvg : 1;

  const predictions: RevenuePrediction[] = [];
  for (let i = 1; i <= days; i++) {
    const dateStr = addDays(today, i);
    const wd = weekdayOf(dateStr);
    const seasonal = seasonalFactors.get(wd) ?? 1;
    const predicted = Math.max(0, baseAverage * seasonal * trendFactor);
    const margin = stdDev * 1.96 * Math.sqrt(1 + i / windowSize);

    let confidence: "low" | "medium" | "high" = "low";
    if (dailyRevenue.length >= 30) {
      const cv = overallAvg > 0 ? stdDev / overallAvg : 1;
      if (cv < 0.3) confidence = "high";
      else if (cv < 0.5) confidence = "medium";
    } else if (dailyRevenue.length >= 14) {
      confidence = "medium";
    }

    predictions.push({
      date: dateStr,
      predicted: Math.round(predicted),
      lowerBound: Math.round(Math.max(0, predicted - margin)),
      upperBound: Math.round(predicted + margin),
      confidence,
    });
  }

  logger.info("Revenue predictions computed", {
    restaurantId: rid,
    days,
    baseAverage: Math.round(baseAverage),
  });

  return predictions;
}

// --- predictNoShows ---

/**
 * Predict no-show probability for each reservation on a given date,
 * based on historical patterns, party size, day of week, and lead time.
 */
export async function predictNoShows(
  restaurantId: string,
  date: string,
): Promise<NoShowRisk[]> {
  const rid = restaurantId;
  const targetWeekday = weekdayOf(date);

  // Fetch reservations for the target date
  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: date,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: { guest: { select: { name: true, phone: true } } },
    orderBy: { startsAt: "asc" },
  });

  if (reservations.length === 0) return [];

  // Historical no-show rates
  const historicalRes = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      status: { in: ["COMPLETED", "SEATED", "CANCELLED", "NO_SHOW"] },
    },
    select: {
      status: true,
      partySize: true,
      serviceDate: true,
      startsAt: true,
      createdAt: true,
      guestId: true,
    },
  });

  const totalHistorical = historicalRes.length;
  const noShowHistorical = historicalRes.filter((r) => r.status === "NO_SHOW").length;
  const baseNoShowRate = totalHistorical > 0 ? noShowHistorical / totalHistorical : 0.08;

  // No-show rate by party size
  const partySizeRates = new Map<number, { noShows: number; total: number }>();
  for (const r of historicalRes) {
    const entry = partySizeRates.get(r.partySize) ?? { noShows: 0, total: 0 };
    entry.total += 1;
    if (r.status === "NO_SHOW") entry.noShows += 1;
    partySizeRates.set(r.partySize, entry);
  }

  // No-show rate by day of week
  const weekdayRates = new Map<number, { noShows: number; total: number }>();
  for (const r of historicalRes) {
    const wd = weekdayOf(r.serviceDate);
    const entry = weekdayRates.get(wd) ?? { noShows: 0, total: 0 };
    entry.total += 1;
    if (r.status === "NO_SHOW") entry.noShows += 1;
    weekdayRates.set(wd, entry);
  }

  // Per-guest no-show history
  const guestNoShows = new Map<string, { noShows: number; total: number }>();
  for (const r of historicalRes) {
    const entry = guestNoShows.get(r.guestId) ?? { noShows: 0, total: 0 };
    entry.total += 1;
    if (r.status === "NO_SHOW") entry.noShows += 1;
    guestNoShows.set(r.guestId, entry);
  }

  const results: NoShowRisk[] = [];

  for (const res of reservations) {
    const factors: string[] = [];
    let riskScore = baseNoShowRate;

    // Factor 1: party size
    const psEntry = partySizeRates.get(res.partySize);
    if (psEntry && psEntry.total >= 5) {
      const psRate = psEntry.noShows / psEntry.total;
      if (psRate > baseNoShowRate * 1.3) {
        riskScore = (riskScore + psRate) / 2;
        factors.push(`Taille de groupe ${res.partySize} (taux ${(psRate * 100).toFixed(0)}%)`);
      }
    }

    // Factor 2: day of week
    const wdEntry = weekdayRates.get(targetWeekday);
    if (wdEntry && wdEntry.total >= 5) {
      const wdRate = wdEntry.noShows / wdEntry.total;
      if (wdRate > baseNoShowRate * 1.3) {
        riskScore = (riskScore + wdRate) / 2;
        factors.push(`${DAY_LABELS[targetWeekday]} (taux ${(wdRate * 100).toFixed(0)}%)`);
      }
    }

    // Factor 3: lead time
    const now = new Date();
    const resTime = new Date(res.createdAt);
    const leadTimeHours = (resTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (Math.abs(leadTimeHours) > 168) {
      riskScore *= 1.2;
      factors.push("Réservation anticipée (> 7 jours)");
    } else if (Math.abs(leadTimeHours) < 2) {
      riskScore *= 0.8;
      factors.push("Réservation de dernière minute (< 2h)");
    }

    // Factor 4: guest history
    const guestHistory = guestNoShows.get(res.guestId);
    if (guestHistory && guestHistory.total >= 2) {
      const guestRate = guestHistory.noShows / guestHistory.total;
      if (guestRate > 0.2) {
        riskScore = Math.min(0.95, riskScore + guestRate * 0.3);
        factors.push(`Historique client: ${(guestRate * 100).toFixed(0)}% de no-shows`);
      }
    }

    // Factor 5: large party
    if (res.partySize >= 6) {
      riskScore *= 1.15;
      factors.push("Groupe de 6+ personnes");
    }

    riskScore = Math.min(0.95, Math.max(0.01, riskScore));

    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore > 0.3) riskLevel = "high";
    else if (riskScore > 0.15) riskLevel = "medium";

    if (factors.length === 0) {
      factors.push("Aucun facteur de risque particulier");
    }

    results.push({
      reservationId: res.id,
      guestName: res.guest.name,
      guestPhone: res.guest.phone,
      serviceDate: res.serviceDate,
      startsAt: res.startsAt.toISOString(),
      partySize: res.partySize,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      factors,
    });
  }

  results.sort((a, b) => b.riskScore - a.riskScore);

  logger.info("No-show predictions computed", {
    restaurantId: rid,
    date,
    count: results.length,
    highRisk: results.filter((r) => r.riskLevel === "high").length,
  });

  return results;
}

// --- optimizePricing ---

/**
 * Suggest dynamic pricing strategies based on occupancy patterns.
 */
export async function optimizePricing(
  restaurantId: string,
): Promise<PricingSuggestion[]> {
  const rid = restaurantId;
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const fromDate = addDays(today, -60);

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      serviceDate: { gte: fromDate, lte: today },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true, partySize: true, serviceDate: true },
  });

  if (reservations.length < 20) {
    return [];
  }

  // Group by hour
  const hourData = new Map<number, { covers: number; days: Set<string> }>();
  for (const r of reservations) {
    const hour = extractLocalHour(r.startsAt);
    const entry = hourData.get(hour) ?? { covers: 0, days: new Set() };
    entry.covers += r.partySize;
    entry.days.add(r.serviceDate);
    hourData.set(hour, entry);
  }

  const totalCovers = reservations.reduce((s, r) => s + r.partySize, 0);
  const avgCoversPerDay = totalCovers / new Set(reservations.map((r) => r.serviceDate)).size;

  const suggestions: PricingSuggestion[] = [];

  // Happy hour: low occupancy hours (before 19:00 or after 22:00)
  const lowHours: number[] = [];
  const peakHours: number[] = [];
  for (let h = 12; h <= 23; h++) {
    const entry = hourData.get(h);
    const avgForHour = entry ? entry.covers / entry.days.size : 0;
    if (avgForHour < avgCoversPerDay * 0.6) {
      lowHours.push(h);
    } else if (avgForHour > avgCoversPerDay * 1.3) {
      peakHours.push(h);
    }
  }

  if (lowHours.length > 0) {
    const hourRanges = formatHourRanges(lowHours);
    suggestions.push({
      type: "happy_hour",
      label: "Happy Hour",
      description: `Réductions sur les boissons et entrées de ${hourRanges}. Faible affluence historique.`,
      suggestedDiscount: 15,
      targetHours: lowHours.map((h) => `${String(h).padStart(2, "0")}:00`),
      expectedImpact: `+${Math.round(lowHours.length * 3)}% de couverts sur ces créneaux`,
      confidence: 0.7,
    });
  }

  if (peakHours.length > 0) {
    const hourRanges = formatHourRanges(peakHours);
    suggestions.push({
      type: "peak_surcharge",
      label: "Supplément heure de pointe",
      description: `Majoration de 10% sur les réservations de ${hourRanges}. Demande élevée constante.`,
      suggestedDiscount: -10,
      targetHours: peakHours.map((h) => `${String(h).padStart(2, "0")}:00`),
      expectedImpact: `+${Math.round(peakHours.length * 5)}% de revenus sur ces créneaux`,
      confidence: 0.65,
    });
  }

  // Off-peak discount for specific weekdays
  const weekdayCovers = new Map<number, number[]>();
  for (const r of reservations) {
    const wd = weekdayOf(r.serviceDate);
    const arr = weekdayCovers.get(wd) ?? [];
    arr.push(r.partySize);
    weekdayCovers.set(wd, arr);
  }

  const offPeakDays: number[] = [];
  for (let wd = 0; wd < 7; wd++) {
    const covers = weekdayCovers.get(wd) ?? [];
    if (covers.length > 0) {
      const avg = covers.reduce((s, c) => s + c, 0) / covers.length;
      if (avg < avgCoversPerDay * 0.5) {
        offPeakDays.push(wd);
      }
    }
  }

  if (offPeakDays.length > 0) {
    const dayNames = offPeakDays.map((wd) => DAY_LABELS[wd]).join(", ");
    suggestions.push({
      type: "off_peak_discount",
      label: "Offres jours creux",
      description: `Promotions ciblées le ${dayNames}. Affluence historiquement faible.`,
      suggestedDiscount: 20,
      targetHours: offPeakDays.map((wd) => DAY_LABELS[wd]),
      expectedImpact: `+${Math.round(offPeakDays.length * 8)}% de réservations ces jours`,
      confidence: 0.75,
    });
  }

  // Weekend premium
  const weekendCovers = [5, 6]
    .map((wd) => weekdayCovers.get(wd) ?? [])
    .flat();
  const weekdayCoversFlat = [0, 1, 2, 3, 4]
    .map((wd) => weekdayCovers.get(wd) ?? [])
    .flat();

  if (weekendCovers.length > 0 && weekdayCoversFlat.length > 0) {
    const weekendAvg = weekendCovers.reduce((s, c) => s + c, 0) / weekendCovers.length;
    const weekdayAvg = weekdayCoversFlat.reduce((s, c) => s + c, 0) / weekdayCoversFlat.length;
    if (weekendAvg > weekdayAvg * 1.4) {
      suggestions.push({
        type: "weekend_premium",
        label: "Premium weekend",
        description: `Affluence ${Math.round(((weekendAvg / weekdayAvg) - 1) * 100)}% plus élevée le weekend.`,
        suggestedDiscount: -15,
        targetHours: ["Vendredi", "Samedi", "Dimanche"],
        expectedImpact: `+${Math.round(10)}% de revenus le weekend`,
        confidence: 0.6,
      });
    }
  }

  logger.info("Pricing suggestions generated", {
    restaurantId: rid,
    count: suggestions.length,
  });

  return suggestions;
}

// --- analyzeSentiment ---

/**
 * Analyze review sentiment using keyword matching and rating correlation.
 */
export async function analyzeSentiment(
  reviews: Array<{
    id: string;
    rating: number;
    title?: string | null;
    body?: string | null;
  }>,
): Promise<SentimentResult[]> {
  return reviews.map((review) => {
    const text = `${review.title ?? ""} ${review.body ?? ""}`.toLowerCase();
    let positiveHits = 0;
    let negativeHits = 0;
    const matchedKeywords: string[] = [];

    for (const kw of POSITIVE_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        positiveHits++;
        matchedKeywords.push(kw);
      }
    }

    for (const kw of NEGATIVE_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        negativeHits++;
        matchedKeywords.push(kw);
      }
    }

    // Combine keyword score with rating
    const keywordScore = positiveHits - negativeHits;
    const ratingScore = (review.rating - 3) * 2; // -4 to 4
    const combinedScore = keywordScore * 0.4 + ratingScore * 0.6;

    let sentiment: "positive" | "negative" | "neutral";
    if (combinedScore > 0.5) sentiment = "positive";
    else if (combinedScore < -0.5) sentiment = "negative";
    else sentiment = "neutral";

    const normalizedScore = Math.max(-1, Math.min(1, combinedScore / 5));

    return {
      reviewId: review.id,
      sentiment,
      score: Math.round(normalizedScore * 100) / 100,
      keywords: matchedKeywords,
    };
  });
}

// --- generateInsights ---

/**
 * Generate AI-powered insights combining multiple data sources.
 */
export async function generateInsights(
  restaurantId: string,
): Promise<AIInsight[]> {
  const rid = restaurantId;
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const last30 = addDays(today, -30);
  const prev30 = addDays(today, -60);

  const [currentPayments, currentRes, previousRes, reviews] =
    await Promise.all([
      db.payment.findMany({
        where: {
          restaurantId: rid,
          status: "SUCCEEDED",
          paidAt: { not: null },
        },
        select: { amount: true, paidAt: true },
      }),
      db.reservation.findMany({
        where: {
          restaurantId: rid,
          serviceDate: { gte: last30, lte: today },
        },
        select: { status: true, partySize: true, channel: true },
      }),
      db.reservation.findMany({
        where: {
          restaurantId: rid,
          serviceDate: { gte: prev30, lte: last30 },
        },
        select: { status: true, partySize: true, channel: true },
      }),
      db.review.findMany({
        where: {
          reservation: { restaurantId: rid },
        },
        select: { id: true, rating: true, body: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  const currentRev = currentPayments
    .filter((p) => {
      const d = toISODate(p.paidAt!, "Africa/Tunis");
      return d >= last30 && d <= today;
    })
    .reduce((s, p) => s + p.amount, 0);

  const prevRev = currentPayments
    .filter((p) => {
      const d = toISODate(p.paidAt!, "Africa/Tunis");
      return d >= prev30 && d < last30;
    })
    .reduce((s, p) => s + p.amount, 0);

  const currentCovers = currentRes
    .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((s, r) => s + r.partySize, 0);

  const prevCovers = previousRes
    .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((s, r) => s + r.partySize, 0);

  const currentNoShows = currentRes.filter((r) => r.status === "NO_SHOW").length;
  const currentTotal = currentRes.length;
  const noShowRate = currentTotal > 0 ? currentNoShows / currentTotal : 0;

  const prevNoShows = previousRes.filter((r) => r.status === "NO_SHOW").length;
  const prevTotal = previousRes.length;
  const prevNoShowRate = prevTotal > 0 ? prevNoShows / prevTotal : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const insights: AIInsight[] = [];

  // Revenue trend insight
  if (prevRev > 0) {
    const revChange = ((currentRev - prevRev) / prevRev) * 100;
    if (revChange > 10) {
      insights.push({
        category: "opportunity",
        title: "Croissance des revenus",
        description: `Les revenus ont augmenté de ${Math.round(revChange)}% ce mois-ci (${currentRev.toLocaleString("fr-FR")} vs ${prevRev.toLocaleString("fr-FR")} millimes).`,
        priority: "high",
        metric: Math.round(revChange),
      });
    } else if (revChange < -10) {
      insights.push({
        category: "risk",
        title: "Baisse des revenus",
        description: `Les revenus ont diminué de ${Math.round(Math.abs(revChange))}% (${currentRev.toLocaleString("fr-FR")} vs ${prevRev.toLocaleString("fr-FR")} millimes).`,
        priority: "high",
        metric: Math.round(revChange),
      });
    }
  }

  // No-show rate insight
  if (noShowRate > 0.1) {
    insights.push({
      category: "risk",
      title: "Taux de no-show élevé",
      description: `Le taux de no-show est de ${Math.round(noShowRate * 100)}% ce mois-ci. Envisager des confirmations SMS ou des acomptes.`,
      priority: noShowRate > 0.2 ? "high" : "medium",
      metric: Math.round(noShowRate * 100),
    });
  }

  if (noShowRate < prevNoShowRate * 0.7 && prevNoShowRate > 0.05) {
    insights.push({
      category: "opportunity",
      title: "Amélioration des no-shows",
      description: `Le taux de no-show a diminué de ${Math.round(prevNoShowRate * 100)}% à ${Math.round(noShowRate * 100)}%.`,
      priority: "medium",
      metric: Math.round((prevNoShowRate - noShowRate) * 100),
    });
  }

  // Channel insight
  const channelCounts = new Map<string, number>();
  for (const r of currentRes) {
    channelCounts.set(r.channel, (channelCounts.get(r.channel) ?? 0) + 1);
  }
  const topChannel = [...channelCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topChannel) {
    const pct = Math.round((topChannel[1] / currentTotal) * 100);
    if (pct > 60) {
      insights.push({
        category: "action",
        title: `Canal dominant: ${topChannel[0]}`,
        description: `${pct}% des réservations viennent de ${topChannel[0]}. Diversifier les canaux pour réduire la dépendance.`,
        priority: "medium",
        metric: pct,
      });
    }
  }

  // Rating insight
  if (avgRating >= 4.5) {
    insights.push({
      category: "opportunity",
      title: "Excellente réputation",
      description: `Note moyenne de ${avgRating.toFixed(1)}/5 sur les ${reviews.length} derniers avis. Capitaliser pour attirer de nouveaux clients.`,
      priority: "medium",
      metric: Math.round(avgRating * 10) / 10,
    });
  } else if (avgRating > 0 && avgRating < 3.5) {
    insights.push({
      category: "risk",
      title: "Satisfaction en baisse",
      description: `Note moyenne de ${avgRating.toFixed(1)}/5. Analyser les avis négatifs pour identifier les problèmes.`,
      priority: "high",
      metric: Math.round(avgRating * 10) / 10,
    });
  }

  // Covers trend
  if (prevCovers > 0) {
    const coversChange = ((currentCovers - prevCovers) / prevCovers) * 100;
    if (coversChange > 15) {
      insights.push({
        category: "opportunity",
        title: "Forte demande",
        description: `Les couverts ont augmenté de ${Math.round(coversChange)}%. Envisager d'étendre les horaires ou d'ajouter du personnel.`,
        priority: "medium",
        metric: Math.round(coversChange),
      });
    }
  }

  // Negative review analysis
  const negativeReviews = reviews.filter((r) => r.rating <= 2);
  if (negativeReviews.length > 3) {
    const keywords = await analyzeSentiment(negativeReviews);
    const topNegative = keywords
      .flatMap((k) => k.keywords)
      .reduce(
        (acc: Record<string, number>, kw: string) => {
          acc[kw] = (acc[kw] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    const topKeyword = Object.entries(topNegative).sort((a, b) => b[1] - a[1])[0];
    if (topKeyword) {
      insights.push({
        category: "action",
        title: "Avis négatifs récurrents",
        description: `Le mot-clé "${topKeyword[0]}" apparaît ${topKeyword[1]} fois dans les avis négatifs. Prioriser l'amélioration.`,
        priority: "high",
        metric: topKeyword[1] as unknown as number,
      });
    }
  }

  insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  logger.info("AI insights generated", {
    restaurantId: rid,
    count: insights.length,
  });

  return insights;
}

// --- forecastDemand ---

/**
 * Predict demand by hour for a given date.
 */
export async function forecastDemand(
  restaurantId: string,
  date: string,
): Promise<DemandForecast[]> {
  const rid = restaurantId;
  const targetWeekday = weekdayOf(date);

  // Historical reservations for the same weekday
  const histRes = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true, partySize: true, serviceDate: true },
  });

  // Filter to same weekday
  const sameWeekday = histRes.filter((r) => weekdayOf(r.serviceDate) === targetWeekday);

  // Group by hour
  const hourBuckets = new Map<number, { covers: number; count: number }>();
  for (let h = 0; h < 24; h++) {
    hourBuckets.set(h, { covers: 0, count: 0 });
  }

  for (const r of sameWeekday) {
    const hour = extractLocalHour(r.startsAt);
    const entry = hourBuckets.get(hour)!;
    entry.covers += r.partySize;
    entry.count += 1;
  }

  const uniqueDays = new Set(sameWeekday.map((r) => r.serviceDate)).size || 1;
  const totalSameDayCovers = sameWeekday.reduce((s, r) => s + r.partySize, 0);
  const avgDailyCovers = totalSameDayCovers / uniqueDays;

  const result: DemandForecast[] = [];

  for (let h = 0; h < 24; h++) {
    const entry = hourBuckets.get(h)!;
    const avgCovers = entry.count > 0 ? entry.covers / uniqueDays : 0;
    const typicalForDay = avgDailyCovers * getHourShare(h, hourBuckets);

    let confidence: "low" | "medium" | "high" = "low";
    if (entry.count >= uniqueDays * 0.7) confidence = "high";
    else if (entry.count >= uniqueDays * 0.4) confidence = "medium";

    result.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      predictedCovers: Math.round(avgCovers),
      confidence,
      typicalForDay: Math.round(typicalForDay),
    });
  }

  result.sort((a, b) => b.predictedCovers - a.predictedCovers);

  logger.info("Demand forecast computed", {
    restaurantId: rid,
    date,
    weekday: DAY_LABELS[targetWeekday],
  });

  return result;
}

// --- segmentMarketing ---

/**
 * Segment guests for targeted marketing campaigns.
 */
export async function segmentMarketing(
  restaurantId: string,
): Promise<MarketingSegment[]> {
  const rid = restaurantId;
  const now = new Date();
  const today = toISODate(now, "Africa/Tunis");
  const thirtyDaysAgo = addDays(today, -30);

  const payments = await db.payment.findMany({
    where: {
      restaurantId: rid,
      status: "SUCCEEDED",
    },
    select: { guestId: true, amount: true, paidAt: true },
  });

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId: rid,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { guestId: true, serviceDate: true, channel: true },
  });

  // Build guest profiles
  const profiles = new Map<
    string,
    {
      totalSpend: number;
      visits: Set<string>;
      lastVisit: string;
      channels: Map<string, number>;
    }
  >();

  for (const p of payments) {
    const entry = profiles.get(p.guestId) ?? {
      totalSpend: 0,
      visits: new Set(),
      lastVisit: "2000-01-01",
      channels: new Map(),
    };
    entry.totalSpend += p.amount;
    if (p.paidAt) {
      const d = toISODate(p.paidAt, "Africa/Tunis");
      entry.visits.add(d);
      if (d > entry.lastVisit) entry.lastVisit = d;
    }
    profiles.set(p.guestId, entry);
  }

  for (const r of reservations) {
    const entry = profiles.get(r.guestId);
    if (entry) {
      entry.channels.set(r.channel, (entry.channels.get(r.channel) ?? 0) + 1);
    }
  }

  // Segment guests
  const segments = new Map<
    string,
    {
      guestCount: number;
      totalSpend: number;
      totalVisits: number;
      channels: Map<string, number>;
    }
  >();

  for (const [, profile] of profiles) {
    const visitCount = profile.visits.size;
    const isRecent = profile.lastVisit >= thirtyDaysAgo;
    const isHighValue = profile.totalSpend > 200000;
    const isFrequent = visitCount >= 4;
    const isAtRisk = !isRecent && visitCount >= 2;
    const isLoyal = isFrequent && isRecent;

    let segment: string;
    if (isLoyal && isHighValue) segment = "VIP fidèle";
    else if (isHighValue) segment = "Gros dépensiers";
    else if (isFrequent) segment = "Réguliers";
    else if (isAtRisk) segment = "À risque";
    else if (visitCount === 1 && isRecent) segment = "Nouveaux";
    else segment = "Occasionnels";

    const entry = segments.get(segment) ?? {
      guestCount: 0,
      totalSpend: 0,
      totalVisits: 0,
      channels: new Map(),
    };
    entry.guestCount += 1;
    entry.totalSpend += profile.totalSpend;
    entry.totalVisits += visitCount;
    for (const [ch, count] of profile.channels) {
      entry.channels.set(ch, (entry.channels.get(ch) ?? 0) + count);
    }
    segments.set(segment, entry);
  }

  // Build recommendations
  const channelLabels: Record<string, string> = {
    WEB: "Web",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    PHONE: "Téléphone",
  };

  const result: MarketingSegment[] = [...segments.entries()]
    .map(([segment, data]) => {
      const topChannel = [...data.channels.entries()].sort((a, b) => b[1] - a[1])[0];
      const avgSpend = data.guestCount > 0 ? data.totalSpend / data.guestCount : 0;
      const visitFrequency = data.guestCount > 0 ? data.totalVisits / data.guestCount : 0;

      let recommendedOffer: string;
      switch (segment) {
        case "VIP fidèle":
          recommendedOffer = "Programme de parrainage exclusif, événements privés";
          break;
        case "Gros dépensiers":
          recommendedOffer = "Carte cadeau, menu dégustation, offres saisonnières";
          break;
        case "Réguliers":
          recommendedOffer = "Programme de fidélité, 10ème visite offerte";
          break;
        case "À risque":
          recommendedOffer = "Email de réactivation, offre de bienvenue -20%";
          break;
        case "Nouveaux":
          recommendedOffer = "Message de bienvenue, offre 2ème visite -15%";
          break;
        default:
          recommendedOffer = "Newsletter mensuelle, offres spéciales occasionnelles";
      }

      return {
        segment,
        guestCount: data.guestCount,
        avgSpend: Math.round(avgSpend),
        visitFrequency: Math.round(visitFrequency * 10) / 10,
        recommendedOffer,
        channel: channelLabels[topChannel?.[0] ?? "WEB"] ?? "Web",
      };
    })
    .sort((a, b) => b.guestCount - a.guestCount);

  logger.info("Marketing segments computed", {
    restaurantId: rid,
    totalGuests: profiles.size,
    segments: result.map((r) => ({ segment: r.segment, count: r.guestCount })),
  });

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

function formatHourRanges(hours: number[]): string {
  if (hours.length === 0) return "";
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(
        start === end
          ? `${String(start).padStart(2, "0")}h`
          : `${String(start).padStart(2, "0")}h-${String(end + 1).padStart(2, "0")}h`,
      );
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(
    start === end
      ? `${String(start).padStart(2, "0")}h`
      : `${String(start).padStart(2, "0")}h-${String(end + 1).padStart(2, "0")}h`,
  );

  return ranges.join(", ");
}

function getHourShare(
  hour: number,
  buckets: Map<number, { covers: number; count: number }>,
): number {
  const totalCovers = [...buckets.values()].reduce((s, b) => s + b.covers, 0);
  const entry = buckets.get(hour);
  if (!entry || totalCovers === 0) return 0;
  return entry.covers / totalCovers;
}
