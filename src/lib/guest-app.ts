import { Prisma, ReservationStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { TIERS, type TierName } from "@/lib/loyalty";
import { toHM } from "@/lib/time";
import { site } from "@/content/site";

const TZ = site.timezone;

const ACTIVE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.SEATED,
];

// ─── Types ─────────────────────────────────────────────────────────────

export type GuestProfile = {
  id: string;
  guestId: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, unknown>;
  birthday: Date | null;
  favoriteZone: string | null;
  defaultPartySize: number;
  language: string;
  pushEnabled: boolean;
  emailOptIn: boolean;
};

export type GuestDashboard = {
  guest: {
    id: string;
    name: string | null;
    phone: string;
  };
  profile: GuestProfile | null;
  upcomingReservations: ReservationCard[];
  loyalty: {
    points: number;
    tier: TierName;
    discount: number;
    nextTier: TierName | null;
    pointsToNext: number | null;
  };
  recentOrders: OrderCard[];
};

export type ReservationCard = {
  id: string;
  reference: string;
  serviceDate: string;
  time: string;
  partySize: number;
  zone: string | null;
  table: string | null;
  status: ReservationStatus;
  startsAt: Date;
  hasReview: boolean;
};

export type OrderCard = {
  id: string;
  reference: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export type GuestHistoryEntry = ReservationCard & {
  rating: number | null;
};

export type GuestFavorites = {
  favoriteZone: string | null;
  defaultPartySize: number;
  frequentTimes: { time: string; count: number }[];
  frequentPartySizes: { size: number; count: number }[];
};

export type GuestProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  birthday?: Date | null;
  favoriteZone?: string | null;
  defaultPartySize?: number;
  language?: string;
  pushEnabled?: boolean;
  emailOptIn?: boolean;
  preferences?: Record<string, unknown>;
};

// ─── Profile ───────────────────────────────────────────────────────────

export async function getGuestProfile(
  guestId: string,
): Promise<GuestProfile | null> {
  const profile = await db.guestProfile.findUnique({
    where: { guestId },
  });
  if (!profile) return null;
  return toProfile(profile);
}

export async function getOrCreateGuestProfile(
  guestId: string,
): Promise<GuestProfile> {
  const guest = await db.guest.findUnique({ where: { id: guestId } });
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const existing = await db.guestProfile.findUnique({ where: { guestId } });
  if (existing) return toProfile(existing);

  const created = await db.guestProfile.create({
    data: {
      guestId,
      displayName: guest.name,
      language: guest.locale,
    },
  });
  return toProfile(created);
}

export async function updateGuestProfile(
  guestId: string,
  data: GuestProfileInput,
): Promise<GuestProfile> {
  const existing = await db.guestProfile.findUnique({ where: { guestId } });

  if (!existing) {
    const created = await db.guestProfile.create({
      data: {
        guestId,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        birthday: data.birthday ?? null,
        favoriteZone: data.favoriteZone ?? null,
        defaultPartySize: data.defaultPartySize ?? 2,
        language: data.language ?? "fr",
        pushEnabled: data.pushEnabled ?? true,
        emailOptIn: data.emailOptIn ?? false,
        preferences: (data.preferences ?? {}) as Prisma.InputJsonValue,
      },
    });
    return toProfile(created);
  }

  const updated = await db.guestProfile.update({
    where: { guestId },
    data: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.birthday !== undefined && { birthday: data.birthday }),
      ...(data.favoriteZone !== undefined && { favoriteZone: data.favoriteZone }),
      ...(data.defaultPartySize !== undefined && { defaultPartySize: data.defaultPartySize }),
      ...(data.language !== undefined && { language: data.language }),
      ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
      ...(data.emailOptIn !== undefined && { emailOptIn: data.emailOptIn }),
      ...(data.preferences !== undefined && { preferences: data.preferences as Prisma.InputJsonValue }),
    },
  });
  return toProfile(updated);
}

// ─── Dashboard ─────────────────────────────────────────────────────────

export async function getGuestDashboard(
  guestId: string,
): Promise<GuestDashboard | null> {
  const guest = await db.guest.findUnique({ where: { id: guestId } });
  if (!guest) return null;

  const [profile, loyaltyAccount, upcomingReservations, recentOrders] =
    await Promise.all([
      db.guestProfile.findUnique({ where: { guestId } }),
      db.loyaltyAccount.findFirst({ where: { guestId } }),
      db.reservation.findMany({
        where: {
          guestId,
          startsAt: { gte: new Date(Date.now() - 30 * 60_000) },
          status: { in: ACTIVE_STATUSES },
        },
        include: { guest: true, table: true, reviews: true },
        orderBy: { startsAt: "asc" },
        take: 3,
      }),
      db.order.findMany({
        where: { guestId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const tierConfig = loyaltyAccount
    ? computeTierInfo(loyaltyAccount.points, loyaltyAccount.tier)
    : { points: 0, tier: "bronze" as TierName, discount: 0, nextTier: "silver" as TierName, pointsToNext: 50 };

  return {
    guest: { id: guest.id, name: guest.name, phone: guest.phone },
    profile: profile ? toProfile(profile) : null,
    upcomingReservations: upcomingReservations.map((r) => ({
      id: r.id,
      reference: r.reference,
      serviceDate: r.serviceDate,
      time: toHM(r.startsAt, TZ),
      partySize: r.partySize,
      zone: r.zone,
      table: r.table?.name ?? null,
      status: r.status,
      startsAt: r.startsAt,
      hasReview: r.reviews.length > 0,
    })),
    loyalty: tierConfig,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      reference: o.reference,
      status: o.status,
      total: o.total,
      itemCount: o.items.length,
      createdAt: o.createdAt,
    })),
  };
}

// ─── History ───────────────────────────────────────────────────────────

export async function getGuestHistory(
  guestId: string,
): Promise<GuestHistoryEntry[]> {
  const rows = await db.reservation.findMany({
    where: { guestId },
    include: { guest: true, table: true, reviews: true },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    serviceDate: r.serviceDate,
    time: toHM(r.startsAt, TZ),
    partySize: r.partySize,
    zone: r.zone,
    table: r.table?.name ?? null,
    status: r.status,
    startsAt: r.startsAt,
    hasReview: r.reviews.length > 0,
    rating: r.reviews[0]?.rating ?? null,
  }));
}

// ─── Favorites ─────────────────────────────────────────────────────────

export async function getGuestFavorites(
  guestId: string,
): Promise<GuestFavorites> {
  const profile = await db.guestProfile.findUnique({ where: { guestId } });
  const completedReservations = await db.reservation.findMany({
    where: { guestId, status: ReservationStatus.COMPLETED },
    orderBy: { startsAt: "desc" },
    take: 30,
  });

  const timeCounts = new Map<string, number>();
  const sizeCounts = new Map<number, number>();

  for (const r of completedReservations) {
    const time = toHM(r.startsAt, TZ);
    timeCounts.set(time, (timeCounts.get(time) ?? 0) + 1);
    sizeCounts.set(r.partySize, (sizeCounts.get(r.partySize) ?? 0) + 1);
  }

  const frequentTimes = [...timeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([time, count]) => ({ time, count }));

  const frequentPartySizes = [...sizeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([size, count]) => ({ size, count }));

  return {
    favoriteZone: profile?.favoriteZone ?? null,
    defaultPartySize: profile?.defaultPartySize ?? 2,
    frequentTimes,
    frequentPartySizes,
  };
}

// ─── Quick Rebook ──────────────────────────────────────────────────────

export async function quickRebook(
  guestId: string,
): Promise<{
  serviceDate: string;
  minutes: number;
  partySize: number;
  zone: string | null;
} | null> {
  const profile = await db.guestProfile.findUnique({ where: { guestId } });
  const lastReservation = await db.reservation.findFirst({
    where: { guestId },
    orderBy: { startsAt: "desc" },
  });

  if (!lastReservation) return null;

  return {
    serviceDate: lastReservation.serviceDate,
    minutes: Math.round(
      (lastReservation.startsAt.getTime() -
        new Date(lastReservation.serviceDate).getTime()) /
        60_000,
    ),
    partySize: profile?.defaultPartySize ?? lastReservation.partySize,
    zone: lastReservation.zone ?? profile?.favoriteZone ?? null,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function toProfile(row: {
  id: string;
  guestId: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: unknown;
  birthday: Date | null;
  favoriteZone: string | null;
  defaultPartySize: number;
  language: string;
  pushEnabled: boolean;
  emailOptIn: boolean;
}): GuestProfile {
  return {
    id: row.id,
    guestId: row.guestId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    preferences: (row.preferences as Record<string, unknown>) ?? {},
    birthday: row.birthday,
    favoriteZone: row.favoriteZone,
    defaultPartySize: row.defaultPartySize,
    language: row.language,
    pushEnabled: row.pushEnabled,
    emailOptIn: row.emailOptIn,
  };
}

function computeTierInfo(
  points: number,
  tier: string,
): {
  points: number;
  tier: TierName;
  discount: number;
  nextTier: TierName | null;
  pointsToNext: number | null;
} {
  const current = (tier as TierName) || "bronze";
  const config = TIERS[current];
  const nextTier = (config.next as TierName) ?? null;
  const pointsToNext = config.pointsToNext ?? null;

  return {
    points,
    tier: current,
    discount: config.discount,
    nextTier,
    pointsToNext,
  };
}
