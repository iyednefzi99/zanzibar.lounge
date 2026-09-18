/**
 * Dynamic Pricing temporel.
 *
 * Ajuste les prix/conditions selon la demande :
 * - Peak hours (vendredi/samedi soir) : prix normal ou majoration légère
 * - Off-peak (lundi-mardi, après-midi) : réduction ou avantages
 * - Last-minute : prix réduit pour remplir les dernières tables
 * - Grande demande : inscription prioritaire en waitlist
 */

import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { site } from "@/content/site";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type PricingPeriod = "peak" | "standard" | "off_peak" | "late_deal";

export type PricingRule = {
  id: string;
  name: string;
  period: PricingPeriod;
  /** Jours de la semaine applicables (0=dimanche, 6=samedi) */
  daysOfWeek: number[];
  /** Heure de début (minutes depuis minuit) */
  startMinutes: number;
  /** Heure de fin (minutes depuis minuit) */
  endMinutes: number;
  /** Multiplicateur de prix (1.0 = normal, 0.8 = -20%, 1.1 = +10%) */
  multiplier: number;
  /** Label affiché au client */
  label: string;
  /** Points bonus fidélité (0 = rien) */
  bonusPoints: number;
  /** Priorité dans la waitlist (true = passe devant) */
  waitlistPriority: boolean;
};

export type PricingContext = {
  serviceDate: string;
  minutes: number;
  partySize: number;
  dayOfWeek: number;
  isHoliday: boolean;
  demandLevel: "low" | "normal" | "high" | "full";
};

export type PricingDisplay = {
  period: PricingPeriod;
  label: string;
  multiplier: number;
  badge?: string;
  bonusPoints: number;
  waitlistPriority: boolean;
};

// --------------------------------------------------------------------------
// Règles par défaut
// --------------------------------------------------------------------------

const DEFAULT_RULES: Omit<PricingRule, "id">[] = [
  // Peak : vendredi et samedi soir
  {
    name: "Peak Weekend",
    period: "peak",
    daysOfWeek: [5, 6],
    startMinutes: 18 * 60, // 18h
    endMinutes: 23 * 60, // 23h
    multiplier: 1.0,
    label: "Heure de pointe",
    bonusPoints: 0,
    waitlistPriority: false,
  },
  // Off-peak : lundi et mardi
  {
    name: "Off-Peak Early Week",
    period: "off_peak",
    daysOfWeek: [1, 2],
    startMinutes: 8 * 60,
    endMinutes: 22 * 60,
    multiplier: 0.85,
    label: "-15% hors-pointe",
    bonusPoints: 2,
    waitlistPriority: false,
  },
  // Late deal : créneaux tardifs tous les soirs
  {
    name: "Late Deal",
    period: "late_deal",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startMinutes: 21 * 60,
    endMinutes: 23 * 60,
    multiplier: 0.9,
    label: "-10% en fin de soirée",
    bonusPoints: 1,
    waitlistPriority: false,
  },
  // Standard : tout le reste
  {
    name: "Standard",
    period: "standard",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startMinutes: 0,
    endMinutes: 24 * 60,
    multiplier: 1.0,
    label: "",
    bonusPoints: 0,
    waitlistPriority: false,
  },
];

// --------------------------------------------------------------------------
// Analyse de demande
// --------------------------------------------------------------------------

export async function analyzeDemand(
  serviceDate: string,
  minutes: number,
  restaurantId?: string,
): Promise<"low" | "normal" | "high" | "full"> {
  const rid = restaurantId ?? await getDefaultRestaurantId();

  // Compter les réservations existantes pour ce créneau
  const start = new Date(`${serviceDate}T00:00:00Z`);
  start.setMinutes(start.getMinutes() + minutes);
  const end = new Date(start.getTime() + site.booking.turnoverMinutes * 60_000);

  const taken = await db.reservation.aggregate({
    _sum: { partySize: true },
    where: {
      restaurantId: rid,
      status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
  });

  const covers = taken._sum.partySize ?? 0;
  const ratio = covers / site.booking.maxCoversPerSlot;

  if (ratio >= 1.0) return "full";
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.4) return "normal";
  return "low";
}

// --------------------------------------------------------------------------
// Calcul du pricing
// --------------------------------------------------------------------------

export function computePricing(context: PricingContext): PricingDisplay {
  const { dayOfWeek, minutes, demandLevel } = context;

  // Chercher la règle applicable (peak en premier, puis off-peak, etc.)
  for (const rule of DEFAULT_RULES) {
    if (rule.period === "standard") continue;
    if (
      rule.daysOfWeek.includes(dayOfWeek) &&
      minutes >= rule.startMinutes &&
      minutes < rule.endMinutes
    ) {
      return {
        period: rule.period,
        label: rule.label,
        multiplier: rule.multiplier,
        badge: rule.bonusPoints > 0 ? `+${rule.bonusPoints} pts` : undefined,
        bonusPoints: rule.bonusPoints,
        waitlistPriority: rule.waitlistPriority,
      };
    }
  }

  // Standard
  const display: PricingDisplay = {
    period: "standard",
    label: "",
    multiplier: 1.0,
    bonusPoints: 0,
    waitlistPriority: false,
  };

  // Ajuster selon la demande
  if (demandLevel === "low") {
    display.bonusPoints = 2;
    display.badge = "+2 pts";
  } else if (demandLevel === "high") {
    display.waitlistPriority = false; // Pas de priorité en haute demande
  }

  return display;
}

// --------------------------------------------------------------------------
// Prix affiché
// --------------------------------------------------------------------------

export function applyPricing(
  basePrice: number,
  pricing: PricingDisplay,
): { price: number; originalPrice?: number; discount?: string } {
  if (pricing.multiplier === 1.0) {
    return { price: basePrice };
  }

  const price = Math.round(basePrice * pricing.multiplier);
  const diff = basePrice - price;

  return {
    price,
    originalPrice: basePrice,
    discount: diff > 0 ? `-${Math.round((diff / basePrice) * 100)}%` : undefined,
  };
}

// --------------------------------------------------------------------------
// API helper : pricing pour un slot donné
// --------------------------------------------------------------------------

export async function getSlotPricing(
  serviceDate: string,
  minutes: number,
  partySize: number,
  restaurantId?: string,
): Promise<PricingDisplay> {
  const date = new Date(`${serviceDate}T12:00:00Z`);
  const dayOfWeek = date.getUTCDay();

  const demand = await analyzeDemand(serviceDate, minutes, restaurantId);

  return computePricing({
    serviceDate,
    minutes,
    partySize,
    dayOfWeek,
    isHoliday: false,
    demandLevel: demand,
  });
}
