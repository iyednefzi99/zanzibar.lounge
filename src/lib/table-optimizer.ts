/**
 * Smart Table Optimization.
 *
 * Améliore l'attribution des tables avec un scoring IA :
 * - Zone préférée du guest (historique)
 * - Rotation des tables (éviter de toujours assigner la même)
 * - Adjacence (groupes qui arrivent ensemble)
 * - Taille optimale (pas trop grande, pas trop juste)
 */

import { Zone } from "@/generated/prisma/client";

import type { ZoneId } from "@/content/site";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type TableCandidate = {
  id: string;
  name: string;
  capacity: number;
  zone: Zone | null;
};

export type TableScore = {
  table: TableCandidate;
  score: number;
  reasons: string[];
};

// --------------------------------------------------------------------------
// Scoring
// --------------------------------------------------------------------------

/**
 * Score une table candidate pour un guest et un créneau donnés.
 * Score plus élevé = meilleure attribution.
 */
export function scoreTable(params: {
  table: TableCandidate;
  partySize: number;
  preferredZone: ZoneId | null;
  guestZoneHistory: Zone[];
  recentTableIds: string[];
  adjacencyTableIds: string[];
  isPeakHour: boolean;
}): TableScore {
  const {
    table,
    partySize,
    preferredZone,
    guestZoneHistory,
    recentTableIds,
    adjacencyTableIds,
    isPeakHour,
  } = params;

  let score = 0;
  const reasons: string[] = [];

  // 1. Fit de taille : pénaliser les tables trop grandes ou trop justes
  const capacityDiff = table.capacity - partySize;
  if (capacityDiff === 0) {
    // Parfait : la table accueille exactement le groupe
    score += 30;
    reasons.push("Taille parfaite");
  } else if (capacityDiff === 1) {
    // Très bien : une place de marge
    score += 25;
    reasons.push("Bon fit (+1)");
  } else if (capacityDiff >= 2 && capacityDiff <= 3) {
    // Correct
    score += 15;
    reasons.push("Acceptable");
  } else if (capacityDiff > 3) {
    // Trop grande : gaspillage de capacité
    score += 5;
    reasons.push("Table trop grande");
  }

  // 2. Zone préférée
  if (preferredZone && table.zone === toPrismaZone(preferredZone)) {
    score += 25;
    reasons.push("Zone demandée");
  } else if (
    guestZoneHistory.length > 0 &&
    table.zone &&
    guestZoneHistory.includes(table.zone)
  ) {
    // Le client a une préférence historique pour cette zone
    score += 20;
    reasons.push("Zone historique");
  }

  // 3. Rotation : pénaliser les tables récemment utilisées
  if (recentTableIds.includes(table.id)) {
    score -= 15;
    reasons.push("Récemment utilisée");
  }

  // 4. Adjacência : bonus si le groupe arrive avec d'autres
  if (adjacencyTableIds.includes(table.id)) {
    score += 10;
    reasons.push("Proche des autres membres du groupe");
  }

  // 5. Peak hour : favoriser les tables centrales (salle) en haute demande
  if (isPeakHour && table.zone === Zone.SALLE) {
    score += 5;
    reasons.push("Préférée en haute demande");
  }

  return { table, score, reasons };
}

/**
 * Sélectionne la meilleure table parmi les candidates,
 * en utilisant le scoring intelligent.
 */
export function selectBestTable(
  candidates: TableCandidate[],
  params: {
    partySize: number;
    preferredZone: ZoneId | null;
    guestZoneHistory: Zone[];
    recentTableIds: string[];
    adjacencyTableIds: string[];
    isPeakHour: boolean;
  },
): TableCandidate | null {
  if (candidates.length === 0) return null;

  const scored = candidates.map((table) =>
    scoreTable({ table, ...params }),
  );

  // Trier par score décroissant
  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.table ?? null;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function toPrismaZone(zone: ZoneId | null): Zone | null {
  if (!zone) return null;
  return { terrasse: Zone.TERRASSE, salle: Zone.SALLE, salon: Zone.SALON }[zone];
}
