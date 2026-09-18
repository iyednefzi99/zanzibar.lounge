/**
 * No-show prediction + Pre-auth Stripe.
 *
 * Calcule un score de risque de no-show pour chaque réservation.
 * Si le risque est élevé, demande une pré-autorisation Stripe.
 */

import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type NoShowRisk = {
  score: number; // 0.0 - 1.0
  level: "low" | "medium" | "high" | "very_high";
  factors: string[];
  preAuthRequired: boolean;
  suggestedDepositAmount: number; // en millimes (centimes * 10)
};

export type GuestHistory = {
  totalReservations: number;
  noShows: number;
  cancellations: number;
  completed: number;
  averagePartySize: number;
  lastReservationAt: Date | null;
};

// --------------------------------------------------------------------------
// Analyse d'historique guest
// --------------------------------------------------------------------------

export async function getGuestHistory(
  guestId: string,
  restaurantId?: string,
): Promise<GuestHistory> {
  const rid = restaurantId ?? await getDefaultRestaurantId();

  const reservations = await db.reservation.findMany({
    where: { guestId, restaurantId: rid },
    select: {
      status: true,
      partySize: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const history: GuestHistory = {
    totalReservations: reservations.length,
    noShows: 0,
    cancellations: 0,
    completed: 0,
    averagePartySize: 0,
    lastReservationAt: null,
  };

  if (reservations.length === 0) return history;

  let totalParty = 0;
  for (const r of reservations) {
    if (r.status === "NO_SHOW") history.noShows++;
    else if (r.status === "CANCELLED") history.cancellations++;
    else if (r.status === "COMPLETED") history.completed++;
    totalParty += r.partySize;
  }

  history.averagePartySize = totalParty / reservations.length;
  history.lastReservationAt = reservations[0]?.createdAt ?? null;

  return history;
}

// --------------------------------------------------------------------------
// Calcul du score de risque
// --------------------------------------------------------------------------

export function computeNoShowRisk(params: {
  guestHistory: GuestHistory;
  partySize: number;
  isLastMinute: boolean; // réservation < 2h avant
  isWeekend: boolean; // vendredi/samedi
  isPeakHour: boolean; // 19h-22h
  hasConfirmed: boolean; // a confirmé sa venue
}): NoShowRisk {
  const {
    guestHistory,
    partySize,
    isLastMinute,
    isWeekend,
    isPeakHour,
    hasConfirmed,
  } = params;

  let score = 0.1; // base
  const factors: string[] = [];

  // --- Facteurs augmentant le risque ---

  // Réservation last-minute (< 2h)
  if (isLastMinute) {
    score += 0.15;
    factors.push("Réservation last-minute");
  }

  // Grand groupe (> 6 personnes)
  if (partySize > 6) {
    score += 0.1;
    factors.push(`Grand groupe (${partySize} personnes)`);
  }

  // Historique de no-show
  if (guestHistory.totalReservations > 0) {
    const noShowRate = guestHistory.noShows / guestHistory.totalReservations;
    if (noShowRate > 0.3) {
      score += 0.25;
      factors.push(`Taux de no-show élevé (${Math.round(noShowRate * 100)}%)`);
    } else if (noShowRate > 0.1) {
      score += 0.15;
      factors.push(`No-shows passés (${guestHistory.noShows})`);
    }
  }

  // Premier guest (pas d'historique)
  if (guestHistory.totalReservations === 0) {
    score += 0.1;
    factors.push("Nouveau client");
  }

  // Annulations fréquentes
  if (guestHistory.totalReservations > 0) {
    const cancelRate =
      guestHistory.cancellations / guestHistory.totalReservations;
    if (cancelRate > 0.3) {
      score += 0.1;
      factors.push(`Taux d'annulation élevé (${Math.round(cancelRate * 100)}%)`);
    }
  }

  // Weekend soir = forte demande = plus de no-shows potentiels
  if (isWeekend && isPeakHour) {
    score += 0.05;
    factors.push("Créneau demandé (weekend soir)");
  }

  // --- Facteurs réduisant le risque ---

  // Client régulier avec bon historique
  if (guestHistory.completed > 3) {
    score -= 0.15;
    factors.push("Client régulier fiable");
  }

  // A confirmé sa venue
  if (hasConfirmed) {
    score -= 0.1;
    factors.push("Venue confirmée");
  }

  // Nombreuses réservations sans no-show
  if (
    guestHistory.totalReservations > 5 &&
    guestHistory.noShows === 0
  ) {
    score -= 0.1;
    factors.push("Aucun no-show passé");
  }

  // Clamp entre 0 et 1
  score = Math.max(0, Math.min(1, score));

  // Déterminer le niveau
  let level: NoShowRisk["level"];
  if (score >= 0.7) level = "very_high";
  else if (score >= 0.5) level = "high";
  else if (score >= 0.3) level = "medium";
  else level = "low";

  // Pre-auth requis si risque élevé
  const preAuthRequired = level === "high" || level === "very_high";

  // Montant suggéré : 20-50 TND par personne selon le risque
  const perPerson = level === "very_high" ? 50 : level === "high" ? 30 : 20;
  const suggestedDepositAmount = perPerson * partySize * 1000; // en millimes

  return {
    score,
    level,
    factors,
    preAuthRequired,
    suggestedDepositAmount,
  };
}

// --------------------------------------------------------------------------
// Prédiction pour une réservation existante
// --------------------------------------------------------------------------

export async function predictNoShowRisk(
  reservationId: string,
): Promise<NoShowRisk> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true },
  });

  if (!reservation) {
    return {
      score: 0,
      level: "low",
      factors: ["Réservation introuvable"],
      preAuthRequired: false,
      suggestedDepositAmount: 0,
    };
  }

  const history = await getGuestHistory(reservation.guestId, reservation.restaurantId);

  const now = new Date();
  const isLastMinute =
    reservation.startsAt.getTime() - now.getTime() < 2 * 60 * 60_000;

  const dayOfWeek = reservation.startsAt.getUTCDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const hour = reservation.startsAt.getUTCHours();
  const isPeakHour = hour >= 19 && hour <= 22;

  return computeNoShowRisk({
    guestHistory: history,
    partySize: reservation.partySize,
    isLastMinute,
    isWeekend,
    isPeakHour,
    hasConfirmed: reservation.confirmedByGuestAt !== null,
  });
}

// --------------------------------------------------------------------------
// Intégration avec la création de réservation
// --------------------------------------------------------------------------

export async function evaluateReservationRisk(
  guestId: string,
  partySize: number,
  startsAt: Date,
  restaurantId?: string,
): Promise<NoShowRisk> {
  const history = await getGuestHistory(guestId, restaurantId);

  const now = new Date();
  const isLastMinute = startsAt.getTime() - now.getTime() < 2 * 60 * 60_000;

  const dayOfWeek = startsAt.getUTCDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const hour = startsAt.getUTCHours();
  const isPeakHour = hour >= 19 && hour <= 22;

  return computeNoShowRisk({
    guestHistory: history,
    partySize,
    isLastMinute,
    isWeekend,
    isPeakHour,
    hasConfirmed: false,
  });
}
