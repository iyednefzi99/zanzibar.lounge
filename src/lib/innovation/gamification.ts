import { db } from "@/lib/db";

export type BadgeType = "first_visit" | "power_user" | "reviewer" | "social_sharer" | "loyal";

const BADGE_DEFINITIONS: Record<BadgeType, { name: string; description: string; icon: string }> = {
  first_visit: { name: "Première Visite", description: "Bienvenue chez nous !", icon: "🌟" },
  power_user: { name: "Habitué", description: "Plus de 10 visites", icon: "🔥" },
  reviewer: { name: "Critique", description: "5 avis laissés", icon: "📝" },
  social_sharer: { name: "Ambassadeur", description: "Partage ses expériences", icon: "📣" },
  loyal: { name: "Fidèle", description: "Membre orde ou plus", icon: "👑" },
};

export async function getGuestBadges(guestId: string) {
  return db.gamificationBadge.findMany({
    where: { guestId },
    orderBy: { earnedAt: "desc" },
  });
}

export async function awardBadge(guestId: string, badgeType: BadgeType) {
  const existing = await db.gamificationBadge.findFirst({
    where: { guestId, badgeType },
  });
  if (existing) return existing;

  const def = BADGE_DEFINITIONS[badgeType];
  return db.gamificationBadge.create({
    data: {
      guestId,
      badgeType,
      name: def.name,
      description: def.description,
      icon: def.icon,
    },
  });
}

export async function checkAndAwardBadges(guestId: string) {
  const reservations = await db.reservation.findMany({
    where: { guestId, status: "COMPLETED" },
  });
  const reviews = await db.review.findMany({ where: { guestId } });

  const newBadges: Array<{ badgeType: BadgeType; name: string }> = [];

  if (reservations.length === 1) {
    const badge = await awardBadge(guestId, "first_visit");
    newBadges.push({ badgeType: "first_visit", name: badge.name });
  }

  if (reservations.length >= 10) {
    const badge = await awardBadge(guestId, "power_user");
    newBadges.push({ badgeType: "power_user", name: badge.name });
  }

  if (reviews.length >= 5) {
    const badge = await awardBadge(guestId, "reviewer");
    newBadges.push({ badgeType: "reviewer", name: badge.name });
  }

  return newBadges;
}

export async function getBadgeStats(restaurantId: string) {
  const badges = await db.gamificationBadge.findMany({
    where: {
      guestId: {
        in: (
          await db.reservation.findMany({
            where: { restaurantId, status: "COMPLETED" },
            select: { guestId: true },
            distinct: ["guestId"],
          })
        ).map((r) => r.guestId),
      },
    },
  });

  const byType = new Map<string, number>();
  for (const badge of badges) {
    byType.set(badge.badgeType, (byType.get(badge.badgeType) ?? 0) + 1);
  }

  return {
    total: badges.length,
    byType: Object.fromEntries(byType),
  };
}
