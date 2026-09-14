import { db } from "@/lib/db";

export async function awardBadge(guestId: string, badgeType: string, name: string, description?: string, icon?: string) {
  const existing = await db.gamificationBadge.findFirst({
    where: { guestId, badgeType },
  });
  if (existing) return existing;

  return db.gamificationBadge.create({
    data: { guestId, badgeType, name, description, icon },
  });
}

export async function getGuestBadges(guestId: string) {
  return db.gamificationBadge.findMany({
    where: { guestId },
    orderBy: { earnedAt: "desc" },
  });
}

export async function getBadgeStats(restaurantId: string) {
  return db.gamificationBadge.groupBy({
    by: ["badgeType"],
    _count: true,
  });
}

export async function checkAndAwardBadges(guestId: string, restaurantId: string) {
  const reservationCount = await db.reservation.count({
    where: { guestId, restaurantId, status: "COMPLETED" },
  });

  if (reservationCount === 1) await awardBadge(guestId, "first_visit", "Première Visite", "Votre première visite chez nous");
  if (reservationCount === 10) await awardBadge(guestId, "regular", "Régulier", "10 visites et plus");
  if (reservationCount === 50) await awardBadge(guestId, "loyal", "Fidèle", "50 visites — vous faites partie de la famille");

  const reviewCount = await db.review.count({
    where: { reservation: { guestId, restaurantId }, approved: true },
  });
  if (reviewCount >= 3) await awardBadge(guestId, "reviewer", "Critique", "3 avis publiés");
}
