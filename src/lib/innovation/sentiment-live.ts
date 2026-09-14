import { db } from "@/lib/db";

export async function getRecentSentiment(restaurantId: string, days: number = 7) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId,
      status: "COMPLETED",
    },
    select: { id: true, startsAt: true },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  const reservationIds = reservations.filter((r) => r.startsAt >= from).map((r) => r.id);

  const reviews = await db.review.findMany({
    where: {
      reservationId: { in: reservationIds },
      approved: true,
    },
    orderBy: { createdAt: "desc" },
    select: { rating: true, body: true, createdAt: true },
  });

  if (reviews.length === 0) {
    return { average: 0, count: 0, trend: 0, highlights: { positive: [], negative: [] } };
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const halfPoint = Math.floor(reviews.length / 2);
  const firstHalf = reviews.slice(halfPoint);
  const secondHalf = reviews.slice(0, halfPoint);

  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, r) => s + r.rating, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, r) => s + r.rating, 0) / secondHalf.length : 0;
  const trend = secondAvg - firstAvg;

  const positive = reviews.filter((r) => r.rating >= 4).map((r) => r.body ?? "").filter(Boolean).slice(0, 5);
  const negative = reviews.filter((r) => r.rating <= 2).map((r) => r.body ?? "").filter(Boolean).slice(0, 5);

  return {
    average: Math.round(avgRating * 10) / 10,
    count: reviews.length,
    trend: Math.round(trend * 10) / 10,
    highlights: { positive, negative },
  };
}

export async function getSentimentByCategory(restaurantId: string) {
  const reservations = await db.reservation.findMany({
    where: { restaurantId, status: "COMPLETED" },
    select: { id: true },
    take: 200,
  });

  const reservationIds = reservations.map((r) => r.id);

  const reviews = await db.review.findMany({
    where: {
      reservationId: { in: reservationIds },
      approved: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { rating: true, title: true },
  });

  const categories: Record<string, { total: number; count: number }> = {};

  for (const review of reviews) {
    const tag = review.title ?? "general";
    if (!categories[tag]) categories[tag] = { total: 0, count: 0 };
    categories[tag].total += review.rating;
    categories[tag].count++;
  }

  return Object.entries(categories).map(([category, data]) => ({
    category,
    average: Math.round((data.total / data.count) * 10) / 10,
    count: data.count,
  }));
}
