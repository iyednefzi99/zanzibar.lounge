import { db } from "@/lib/db";

export type GuestAiProfileData = {
  preferences: Record<string, unknown>;
  visitPatterns: Record<string, unknown>;
  loyaltyTier: string;
  lifetimeValue: number;
  lastAnalyzed: Date | null;
};

export async function getGuestAiProfile(guestId: string): Promise<GuestAiProfileData | null> {
  const profile = await db.guestAiProfile.findUnique({ where: { guestId } });
  if (!profile) return null;
  return {
    preferences: profile.preferences as Record<string, unknown>,
    visitPatterns: profile.visitPatterns as Record<string, unknown>,
    loyaltyTier: profile.loyaltyTier,
    lifetimeValue: profile.lifetimeValue,
    lastAnalyzed: profile.lastAnalyzed,
  };
}

export async function upsertGuestAiProfile(
  guestId: string,
  data: Partial<Pick<GuestAiProfileData, "preferences" | "visitPatterns" | "loyaltyTier" | "lifetimeValue">>,
) {
  const existing = await db.guestAiProfile.findUnique({ where: { guestId } });

  if (existing) {
    return db.guestAiProfile.update({
      where: { guestId },
      data: {
        preferences: data.preferences as unknown as Record<string, string>,
        visitPatterns: data.visitPatterns as unknown as Record<string, string>,
        loyaltyTier: data.loyaltyTier,
        lifetimeValue: data.lifetimeValue,
        lastAnalyzed: new Date(),
      },
    });
  }

  return db.guestAiProfile.create({
    data: {
      guestId,
      preferences: (data.preferences ?? {}) as unknown as Record<string, string>,
      visitPatterns: (data.visitPatterns ?? {}) as unknown as Record<string, string>,
      loyaltyTier: data.loyaltyTier ?? "standard",
      lifetimeValue: data.lifetimeValue ?? 0,
      lastAnalyzed: new Date(),
    },
  });
}

export async function analyzeGuestFromReservations(guestId: string) {
  const reservations = await db.reservation.findMany({
    where: { guestId, status: "COMPLETED" },
    orderBy: { startsAt: "desc" },
  });

  if (reservations.length === 0) return null;

  const orderTotals = await db.order.findMany({
    where: { guestId },
    select: { total: true },
  });

  const totalSpent = orderTotals.reduce((sum, o) => sum + o.total, 0);
  const avgSpend = Math.round(totalSpent / reservations.length);

  const visitHours = reservations.map((r) => r.startsAt.getHours());
  const favoriteTime =
    visitHours.length > 0
      ? visitHours.sort((a, b) => {
          const countA = visitHours.filter((h) => h === a).length;
          const countB = visitHours.filter((h) => h === b).length;
          return countB - countA;
        })[0]
      : 19;

  const daysBetweenVisits =
    reservations.length > 1
      ? (reservations[0].startsAt.getTime() - reservations[reservations.length - 1].startsAt.getTime()) /
        (reservations.length - 1) /
        (1000 * 60 * 60 * 24)
      : null;

  const loyaltyTier =
    reservations.length > 20
      ? "platinum"
      : reservations.length > 10
        ? "gold"
        : reservations.length > 5
          ? "silver"
          : "standard";

  const visitPatterns = {
    frequency: daysBetweenVisits ? Math.round(30 / daysBetweenVisits) : 0,
    avgSpend,
    favoriteTimes: [favoriteTime],
    totalVisits: reservations.length,
  };

  return upsertGuestAiProfile(guestId, {
    visitPatterns,
    loyaltyTier,
    lifetimeValue: totalSpent,
  });
}
