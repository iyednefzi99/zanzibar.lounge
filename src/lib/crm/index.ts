import { db } from "@/lib/db";

export type GuestSegment = {
  id: string;
  name: string;
  count: number;
  description: string;
  color: string;
};

export type Guest360 = {
  id: string;
  phone: string;
  name: string | null;
  locale: string;
  profile: {
    displayName: string | null;
    birthday: Date | null;
    favoriteZone: string | null;
    defaultPartySize: number;
    emailOptIn: boolean;
  } | null;
  tags: Array<{ id: string; name: string; color: string }>;
  notes: Array<{ id: string; content: string; staffName: string; createdAt: Date }>;
  totalVisits: number;
  totalSpent: number;
  lastVisit: Date | null;
  avgRating: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  segment: string;
};

export async function getGuestSegments(restaurantId: string): Promise<GuestSegment[]> {
  const guests = await db.guest.findMany({
    where: {
      reservations: { some: { restaurantId, status: "COMPLETED" } },
    },
    include: {
      reservations: {
        where: { restaurantId, status: "COMPLETED" },
        select: { startsAt: true, partySize: true },
      },
      loyaltyAccounts: {
        where: { restaurantId },
        select: { points: true, tier: true },
      },
    },
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const segments: GuestSegment[] = [
    { id: "vip", name: "VIP", count: 0, description: "> 10 visites ou > 500 DT", color: "#C9A96E" },
    { id: "highSpender", name: "GrosClient", count: 0, description: "> 300 DT/mois", color: "#E8734A" },
    { id: "regular", name: "Fidèle", count: 0, description: "> 2 visites/mois", color: "#2EC4B6" },
    { id: "atRisk", name: "À risque", count: 0, description: "> 30 jours sans visite", color: "#EF476F" },
    { id: "new", name: "Nouveau", count: 0, description: "1 seule visite", color: "#118AB2" },
    { id: "occasional", name: "Occasionnel", count: 0, description: "1-2 visites/mois", color: "#8B5CF6" },
  ];

  for (const guest of guests) {
    const visitCount = guest.reservations.length;
    const recentVisits = guest.reservations.filter(
      (r) => r.startsAt >= thirtyDaysAgo,
    );
    const lastVisit = guest.reservations[0]?.startsAt ?? null;

    const isAtRisk = lastVisit && lastVisit < thirtyDaysAgo;
    const isVIP = visitCount > 10;
    const isNew = visitCount === 1;
    const isRegular = recentVisits.length > 2;

    if (isVIP) segments.find((s) => s.id === "vip")!.count++;
    else if (isNew) segments.find((s) => s.id === "new")!.count++;
    else if (isRegular) segments.find((s) => s.id === "regular")!.count++;
    else if (isAtRisk) segments.find((s) => s.id === "atRisk")!.count++;
    else segments.find((s) => s.id === "occasional")!.count++;
  }

  return segments;
}

export async function getGuest360(restaurantId: string, guestId: string): Promise<Guest360 | null> {
  const guest = await db.guest.findUnique({
    where: { id: guestId },
    include: {
      profile: true,
      tags: { include: { tag: true } },
      notes: {
        include: { staff: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      reservations: {
        where: { restaurantId, status: "COMPLETED" },
        orderBy: { startsAt: "desc" },
        select: { startsAt: true, partySize: true },
      },
      loyaltyAccounts: {
        where: { restaurantId },
        select: { points: true, tier: true },
      },
      reviews: {
        where: { approved: true },
        select: { rating: true },
      },
    },
  });

  if (!guest) return null;

  const totalVisits = guest.reservations.length;
  const lastVisit = guest.reservations[0]?.startsAt ?? null;
  const avgRating =
    guest.reviews.length > 0
      ? guest.reviews.reduce((s, r) => s + r.rating, 0) / guest.reviews.length
      : 0;

  const loyalty = guest.loyaltyAccounts[0];

  let segment = "occasional";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentVisits = guest.reservations.filter((r) => r.startsAt >= thirtyDaysAgo);

  if (totalVisits > 10) segment = "vip";
  else if (totalVisits === 1) segment = "new";
  else if (recentVisits.length > 2) segment = "regular";
  else if (lastVisit && lastVisit < thirtyDaysAgo) segment = "atRisk";

  return {
    id: guest.id,
    phone: guest.phone,
    name: guest.name,
    locale: guest.locale,
    profile: guest.profile,
    tags: guest.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
    notes: guest.notes.map((n) => ({
      id: n.id,
      content: n.content,
      staffName: n.staff.name,
      createdAt: n.createdAt,
    })),
    totalVisits,
    totalSpent: 0,
    lastVisit,
    avgRating,
    loyaltyPoints: loyalty?.points ?? 0,
    loyaltyTier: loyalty?.tier ?? "bronze",
    segment,
  };
}

export async function getGuestTimeline(restaurantId: string, guestId: string) {
  const [reservations, orders, reviews, loyaltyTx] = await Promise.all([
    db.reservation.findMany({
      where: { guestId, restaurantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { reference: true, startsAt: true, partySize: true, status: true, zone: true, createdAt: true },
    }),
    db.order.findMany({
      where: { guestId, restaurantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { reference: true, total: true, status: true, createdAt: true },
    }),
    db.review.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { rating: true, body: true, createdAt: true },
    }),
    db.loyaltyTransaction.findMany({
      where: { account: { guestId, restaurantId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { points: true, reason: true, createdAt: true },
    }),
  ]);

  const events = [
    ...reservations.map((r) => ({
      type: "reservation" as const,
      date: r.createdAt,
      data: { reference: r.reference, date: r.startsAt, partySize: r.partySize, status: r.status, zone: r.zone },
    })),
    ...orders.map((o) => ({
      type: "order" as const,
      date: o.createdAt,
      data: { reference: o.reference, total: o.total, status: o.status },
    })),
    ...reviews.map((r) => ({
      type: "review" as const,
      date: r.createdAt,
      data: { rating: r.rating, body: r.body },
    })),
    ...loyaltyTx.map((t) => ({
      type: "loyalty" as const,
      date: t.createdAt,
      data: { points: t.points, reason: t.reason },
    })),
  ];

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
