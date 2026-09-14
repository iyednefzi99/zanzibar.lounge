import { db } from "@/lib/db";

type ForecastInput = {
  date: Date;
  hour: number;
  dayOfWeek: number;
  predictedCovers: number;
  confidence: number;
  factors?: unknown[];
};

type HistoricalEntry = {
  date: Date;
  covers: number;
  dayOfWeek: number;
  hour: number;
};

export async function forecastDemand(
  restaurantId: string,
  input: ForecastInput,
) {
  return db.demandForecast.upsert({
    where: {
      restaurantId_date_hour: {
        restaurantId,
        date: input.date,
        hour: input.hour,
      },
    },
    create: {
      restaurantId,
      date: input.date,
      hour: input.hour,
      dayOfWeek: input.dayOfWeek,
      predictedCovers: input.predictedCovers,
      confidence: input.confidence,
      factors: (input.factors ?? []) as unknown as Record<string, string>,
    },
    update: {
      predictedCovers: input.predictedCovers,
      confidence: input.confidence,
      factors: (input.factors ?? []) as unknown as Record<string, string>,
    },
  });
}

export async function getForecasts(restaurantId: string, date: Date) {
  return db.demandForecast.findMany({
    where: { restaurantId, date },
    orderBy: { hour: "asc" },
  });
}

export async function generateDemandForecast(
  restaurantId: string,
  targetDate: Date,
): Promise<ForecastInput[]> {
  const targetDow = targetDate.getDay();

  // Fetch 4 weeks of historical data
  const fourWeeksAgo = new Date(targetDate);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const historical = await db.reservation.findMany({
    where: {
      restaurantId,
      status: "COMPLETED",
      startsAt: { gte: fourWeeksAgo, lte: targetDate },
    },
    select: {
      startsAt: true,
      partySize: true,
    },
  });

  // Group by day-of-week and hour
  const buckets: Record<string, { total: number; count: number }> = {};
  for (const res of historical) {
    const dow = res.startsAt.getDay();
    const hour = res.startsAt.getHours();
    const key = `${dow}_${hour}`;
    const bucket = buckets[key] ?? { total: 0, count: 0 };
    bucket.total += res.partySize;
    bucket.count += 1;
    buckets[key] = bucket;
  }

  // Generate forecasts for each service hour (11-22)
  const forecasts: ForecastInput[] = [];
  const factors: string[] = [];

  // Check if target date is a weekend
  if (targetDow === 0 || targetDow === 6) {
    factors.push("weekend");
  }

  // Seasonal factor
  const month = targetDate.getMonth();
  if (month >= 5 && month <= 8) {
    factors.push("summer_peak");
  } else if (month === 11 || month === 0) {
    factors.push("holiday_season");
  }

  for (let hour = 11; hour <= 22; hour++) {
    const key = `${targetDow}_${hour}`;
    const bucket = buckets[key];

    let predictedCovers: number;
    let confidence: number;

    if (bucket && bucket.count >= 3) {
      // We have enough historical data
      const avg = Math.round(bucket.total / bucket.count);
      const variance =
        bucket.count > 1
          ? Math.sqrt(
              bucket.total / bucket.count - (avg * avg),
            )
          : avg * 0.3;

      predictedCovers = avg;
      confidence = Math.min(0.95, 0.6 + bucket.count * 0.05);

      // Reduce confidence if variance is high
      if (variance > avg * 0.5) {
        confidence = Math.max(0.4, confidence - 0.15);
      }
    } else {
      // Default estimates based on time of day
      if (hour >= 12 && hour <= 14) {
        predictedCovers = targetDow === 0 || targetDow === 6 ? 25 : 35;
      } else if (hour >= 19 && hour <= 21) {
        predictedCovers = targetDow === 0 || targetDow === 6 ? 40 : 30;
      } else {
        predictedCovers = 15;
      }
      confidence = 0.4;
      factors.push(`limited_data_hour_${hour}`);
    }

    const hourFactors = [...factors];
    if (hour >= 12 && hour <= 14) hourFactors.push("lunch_service");
    if (hour >= 19 && hour <= 21) hourFactors.push("dinner_service");

    forecasts.push({
      date: targetDate,
      hour,
      dayOfWeek: targetDow,
      predictedCovers,
      confidence,
      factors: hourFactors,
    });
  }

  // Save forecasts
  for (const forecast of forecasts) {
    await forecastDemand(restaurantId, forecast);
  }

  return forecasts;
}

export async function getForecastAccuracy(restaurantId: string) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const forecasts = await db.demandForecast.findMany({
    where: {
      restaurantId,
      date: { gte: twoWeeksAgo },
    },
  });

  const completed = await db.reservation.findMany({
    where: {
      restaurantId,
      status: "COMPLETED",
      startsAt: { gte: twoWeeksAgo },
    },
    select: { startsAt: true, partySize: true },
  });

  // Compare forecast vs actual by hour
  let totalError = 0;
  let count = 0;

  for (const f of forecasts) {
    const hourActuals = completed.filter(
      (c) =>
        c.startsAt.toDateString() === f.date.toDateString() &&
        c.startsAt.getHours() === f.hour,
    );
    const actualCovers = hourActuals.reduce((sum, c) => sum + c.partySize, 0);
    const error = Math.abs(f.predictedCovers - actualCovers);
    totalError += error;
    count += 1;
  }

  return {
    avgAbsoluteError: count > 0 ? Math.round(totalError / count) : 0,
    forecastCount: count,
  };
}
