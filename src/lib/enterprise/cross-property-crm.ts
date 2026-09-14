import { db } from "@/lib/db";

export type UnifiedGuestView = {
  guestId: string;
  name: string | null;
  phone: string;
  properties: Array<{
    restaurantId: string;
    totalVisits: number;
    totalSpent: number;
    lastVisit: Date | null;
    loyaltyTier: string;
    loyaltyPoints: number;
  }>;
  totalVisits: number;
  totalSpent: number;
};

export async function getUnifiedGuestView(groupId: string, guestId: string) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const restaurantIds = group.restaurants as string[];
  const guest = await db.guest.findUnique({ where: { id: guestId } });
  if (!guest) return null;

  const reservations = await db.reservation.findMany({
    where: {
      guestId,
      restaurantId: { in: restaurantIds },
      status: "COMPLETED",
    },
    select: { restaurantId: true, partySize: true, startsAt: true },
  });

  const loyaltyAccounts = await db.loyaltyAccount.findMany({
    where: { guestId, restaurantId: { in: restaurantIds } },
  });

  const byProperty = new Map<string, { totalVisits: number; totalSpent: number; lastVisit: Date | null }>();

  for (const id of restaurantIds) {
    byProperty.set(id, { totalVisits: 0, totalSpent: 0, lastVisit: null });
  }

  for (const res of reservations) {
    const stats = byProperty.get(res.restaurantId)!;
    stats.totalVisits++;

    const orderTotal = await db.order.aggregate({
      where: { guestId, restaurantId: res.restaurantId },
      _sum: { total: true },
    });
    stats.totalSpent += orderTotal._sum.total ?? 0;

    if (!stats.lastVisit || res.startsAt > stats.lastVisit) {
      stats.lastVisit = res.startsAt;
    }
  }

  const properties = restaurantIds.map((id) => {
    const s = byProperty.get(id)!;
    const loyalty = loyaltyAccounts.find((l) => l.restaurantId === id);
    return {
      restaurantId: id,
      totalVisits: s.totalVisits,
      totalSpent: s.totalSpent,
      lastVisit: s.lastVisit,
      loyaltyTier: loyalty?.tier ?? "standard",
      loyaltyPoints: loyalty?.points ?? 0,
    };
  });

  return {
    guestId,
    name: guest.name,
    phone: guest.phone,
    properties,
    totalVisits: properties.reduce((s, p) => s + p.totalVisits, 0),
    totalSpent: properties.reduce((s, p) => s + p.totalSpent, 0),
  };
}

export async function getGroupGuestList(groupId: string) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const restaurantIds = group.restaurants as string[];

  const guests = await db.guest.findMany({
    where: {
      reservations: { some: { restaurantId: { in: restaurantIds }, status: "COMPLETED" } },
    },
    include: {
      reservations: {
        where: { restaurantId: { in: restaurantIds }, status: "COMPLETED" },
        select: { restaurantId: true, startsAt: true, partySize: true },
      },
    },
  });

  return guests.map((g) => {
    const totalVisits = g.reservations.length;
    const lastVisit = g.reservations[0]?.startsAt ?? null;

    return {
      guestId: g.id,
      name: g.name,
      phone: g.phone,
      totalVisits,
      lastVisit,
    };
  });
}
