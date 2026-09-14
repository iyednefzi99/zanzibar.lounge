import { db } from "@/lib/db";

type ForecastInput = {
  date: Date;
  hour: number;
  dayOfWeek: number;
  predictedCovers: number;
  confidence: number;
  factors?: unknown[];
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

export async function getForecasts(
  restaurantId: string,
  date: Date,
) {
  return db.demandForecast.findMany({
    where: { restaurantId, date },
    orderBy: { hour: "asc" },
  });
}
