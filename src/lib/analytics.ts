import { db } from "@/lib/db";

/**
 * Statistiques du back-office.
 *
 * Toutes les fonctions interrogent la base directement — pas de cache, pas de
 * lib externe. Les graphiques sont rendus en SVG côté serveur.
 */

// --- Types de retour ---

export type PeriodBucket = {
  label: string;
  covers: number;
  reservations: number;
};

export type ZoneFillRate = {
  zone: string;
  avgCovers: number;
  capacity: number;
  rate: number; // 0–1
};

export type ChannelDist = {
  channel: string;
  count: number;
  pct: number;
};

export type TimeSlot = {
  hour: number;
  label: string;
  count: number;
};

export type CancellationStats = {
  total: number;
  cancelled: number;
  noShow: number;
  cancelRate: number;
  noShowRate: number;
};

export type TrendPoint = {
  date: string;
  count: number;
};

// --- Capacités par zone (source de vérité dans site.ts) ---

const ZONE_CAPACITIES: Record<string, number> = {
  TERRASSE: 24,
  SALLE: 32,
  SALON: 16,
};

// --- Requêtes ---

/**
 * Couverts et réservations regroupés par jour, semaine ou mois.
 */
export async function coversByPeriod(
  from: string,
  to: string,
  groupBy: "day" | "week" | "month" = "day",
): Promise<PeriodBucket[]> {
  const rows = await db.reservation.findMany({
    where: {
      serviceDate: { gte: from, lte: to },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { serviceDate: true, partySize: true },
    orderBy: { serviceDate: "asc" },
  });

  const buckets = new Map<string, { covers: number; reservations: number }>();

  for (const row of rows) {
    const key = groupKey(row.serviceDate, groupBy);
    const bucket = buckets.get(key) ?? { covers: 0, reservations: 0 };
    bucket.covers += row.partySize;
    bucket.reservations += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, ...data }));
}

/**
 * Taux de remplissage moyen par zone.
 *
 * Le taux est calculé sur la base du nombre de couverts réels vs la capacité
 * maximale de la zone (une seule table par zone dans le schema actuel, mais
 * le calcul reste correct avec plusieurs tables).
 */
export async function fillRateByZone(
  from: string,
  to: string,
): Promise<ZoneFillRate[]> {
  const rows = await db.reservation.findMany({
    where: {
      serviceDate: { gte: from, lte: to },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      zone: { not: null },
    },
    select: { zone: true, partySize: true },
  });

  const byZone = new Map<string, number[]>();
  for (const row of rows) {
    const zone = row.zone!;
    const counts = byZone.get(zone) ?? [];
    counts.push(row.partySize);
    byZone.set(zone, counts);
  }

  return [...byZone.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, covers]) => {
      const total = covers.reduce((s, c) => s + c, 0);
      const capacity = ZONE_CAPACITIES[zone] ?? 30;
      // Le taux = couverts moyens par jour / capacité max de la zone
      const days = new Set(
        rows
          .filter((r) => r.zone === zone)
          .map((r) => JSON.stringify(r)),
      ).size || 1;
      return {
        zone: zone.charAt(0) + zone.slice(1).toLowerCase(),
        avgCovers: Math.round((total / days) * 10) / 10,
        capacity,
        rate: Math.min(1, total / (capacity * Math.max(days, 1))),
      };
    });
}

/**
 * Répartition des réservations par canal.
 */
export async function channelDistribution(
  from: string,
  to: string,
): Promise<ChannelDist[]> {
  const rows = await db.reservation.groupBy({
    by: ["channel"],
    where: {
      serviceDate: { gte: from, lte: to },
    },
    _count: { id: true },
  });

  const total = rows.reduce((s, r) => s + r._count.id, 0);

  const channelLabels: Record<string, string> = {
    WEB: "Web",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    PHONE: "Téléphone",
  };

  return rows
    .map((r) => ({
      channel: channelLabels[r.channel] ?? r.channel,
      count: r._count.id,
      pct: total > 0 ? r._count.id / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Les créneaux les plus demandés (par heure).
 */
export async function topTimeSlots(
  from: string,
  to: string,
  limit = 8,
): Promise<TimeSlot[]> {
  const rows = await db.reservation.findMany({
    where: {
      serviceDate: { gte: from, lte: to },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true },
  });

  const counts = new Map<number, number>();
  for (const row of rows) {
    // startsAt est UTC — on extrait l'heure en convertissant vers le fuseau
    // de l'établissement via Intl (même pattern que time.ts).
    const hour = extractLocalHour(row.startsAt);
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .slice(0, limit)
    .map(([hour, count]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));
}

/**
 * Taux d'annulation et de non-présentation.
 */
export async function cancellationStats(
  from: string,
  to: string,
): Promise<CancellationStats> {
  const rows = await db.reservation.groupBy({
    by: ["status"],
    where: {
      serviceDate: { gte: from, lte: to },
    },
    _count: { id: true },
  });

  const statusMap = new Map(rows.map((r) => [r.status, r._count.id]));
  const total = [...statusMap.values()].reduce((s, c) => s + c, 0);
  const cancelled = statusMap.get("CANCELLED") ?? 0;
  const noShow = statusMap.get("NO_SHOW") ?? 0;

  return {
    total,
    cancelled,
    noShow,
    cancelRate: total > 0 ? cancelled / total : 0,
    noShowRate: total > 0 ? noShow / total : 0,
  };
}

/**
 * Évolution quotidienne du nombre de réservations.
 */
export async function reservationTrend(
  from: string,
  to: string,
): Promise<TrendPoint[]> {
  const rows = await db.reservation.groupBy({
    by: ["serviceDate"],
    where: {
      serviceDate: { gte: from, lte: to },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    _count: { id: true },
    orderBy: { serviceDate: "asc" },
  });

  // Remplir les jours manquants avec 0
  const map = new Map(rows.map((r) => [r.serviceDate, r._count.id]));
  const points: TrendPoint[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    points.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return points;
}

// --- Helpers ---

function groupKey(
  serviceDate: string,
  groupBy: "day" | "week" | "month",
): string {
  if (groupBy === "day") return serviceDate;

  const [year, month, day] = serviceDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (groupBy === "month") {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  // week: "2026-W35"
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

function extractLocalHour(date: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tunis",
    hour12: false,
    hour: "2-digit",
  }).format(date);
  return parseInt(formatted, 10);
}
