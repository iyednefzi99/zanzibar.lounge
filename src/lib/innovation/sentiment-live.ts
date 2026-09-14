import { db } from "@/lib/db";

export async function getSentimentTrend(restaurantId: string, days?: number) {
  const since = new Date();
  since.setDate(since.getDate() - (days ?? 30));

  const reviews = await db.review.findMany({
    where: {
      reservation: { restaurantId },
      approved: true,
      createdAt: { gte: since },
    },
    select: { rating: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return { reviews: reviews.length, avgRating: Math.round(avgRating * 10) / 10, data: reviews };
}
