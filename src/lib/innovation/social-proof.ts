import { db } from "@/lib/db";

export type SocialProofType = "recent_booking" | "popular_time" | "trending_dish" | "review_highlights";

export async function getActiveSocialProof(restaurantId: string, type?: SocialProofType) {
  return db.socialProofEvent.findMany({
    where: {
      restaurantId,
      active: true,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function createSocialProof(
  restaurantId: string,
  type: SocialProofType,
  payload: Record<string, string>,
) {
  return db.socialProofEvent.create({
    data: { restaurantId, type, payload },
  });
}

export async function deactivateSocialProof(id: string) {
  return db.socialProofEvent.update({
    where: { id },
    data: { active: false },
  });
}

export async function generateRecentBookings(restaurantId: string) {
  const recentReservations = await db.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { createdAt: true, partySize: true },
  });

  if (recentReservations.length === 0) return null;

  return createSocialProof(restaurantId, "recent_booking", {
    count: String(recentReservations.length),
    message: `${recentReservations.length} réservation(s) dans les dernières 24h`,
  });
}

export async function generatePopularTimes(restaurantId: string) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId,
      startsAt: { gte: oneWeekAgo },
      status: "COMPLETED",
    },
    select: { startsAt: true },
  });

  const byHour = new Map<number, number>();
  for (const r of reservations) {
    const hour = r.startsAt.getHours();
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
  }

  const sorted = Array.from(byHour.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return createSocialProof(restaurantId, "popular_time", {
    peakHours: JSON.stringify(sorted.map(([hour, count]) => ({ hour, count }))),
    message: `Heures les plus demandées : ${sorted.map(([h]) => `${h}h`).join(", ")}`,
  });
}

export async function generateTrendingDish(restaurantId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orderItems = await db.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        createdAt: { gte: thirtyDaysAgo },
      },
    },
    include: { menuItem: { select: { name: true } } },
  });

  const dishCount = new Map<string, number>();
  for (const item of orderItems) {
    const name = item.menuItem.name;
    dishCount.set(name, (dishCount.get(name) ?? 0) + item.quantity);
  }

  const top = Array.from(dishCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (top.length === 0) return null;

  return createSocialProof(restaurantId, "trending_dish", {
    dishes: JSON.stringify(top.map(([name, count]) => ({ name, count }))),
    message: `Plat le plus populaire : ${top[0][0]} (${top[0][1]} commandes)`,
  });
}
