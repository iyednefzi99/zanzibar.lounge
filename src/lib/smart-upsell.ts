/**
 * Smart Upsell Engine
 *
 * Recommandations intelligentes d'upsell basées sur :
 * - Historique client (préférences, dépenses)
 * - Contexte (heure, jour, saison, zone)
 * - Règles configurables par restaurant
 * - Scoring IA (pertinence, marge, popularité)
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────

export type UpsellContext = "reservation" | "pre_arrival" | "in_dining";

export type UpsellReason =
  | "complementary"
  | "seasonal"
  | "popular"
  | "high_margin"
  | "historical_preference";

export type UpsellSuggestionData = {
  id: string;
  suggestion: string;
  reason: UpsellReason;
  score: number;
  context: UpsellContext;
};

export type UpsellRuleData = {
  id: string;
  name: string;
  description: string | null;
  triggerEvent: string;
  conditions: Record<string, unknown>;
  suggestionType: string;
  menuItemId: string | null;
  customTitle: string | null;
  customMessage: string | null;
  maxSendsPerDay: number;
  sendsToday: number;
  active: boolean;
  priority: number;
};

// ─── Règles de scoring ──────────────────────────────────────────────

const REASON_WEIGHTS: Record<UpsellReason, number> = {
  historical_preference: 0.9,
  high_margin: 0.7,
  popular: 0.6,
  complementary: 0.5,
  seasonal: 0.4,
};

// ─── Fonctions principales ───────────────────────────────────────────

/**
 * Génère des recommandations d'upsell pour une réservation donnée.
 */
export async function getUpsellRecommendations(params: {
  restaurantId: string;
  reservationId?: string;
  guestId?: string;
  context: UpsellContext;
  partySize?: number;
  zone?: string;
  hour?: number;
}): Promise<UpsellSuggestionData[]> {
  const { restaurantId, guestId, context, partySize, zone, hour } = params;

  // 1. Récupérer les règles actives pour ce contexte
  const rules = await db.upsellRule.findMany({
    where: {
      restaurantId,
      active: true,
      sendsToday: { lt: db.upsellRule.fields.maxSendsPerDay },
    },
    orderBy: { priority: "desc" },
  });

  // 2. Filtrer par conditions
  const applicableRules = rules.filter((rule) => {
    const conditions = rule.conditions as Record<string, unknown>;
    if (partySize && conditions.partySize) {
      const ps = conditions.partySize as { min?: number; max?: number };
      if (ps.min && partySize < ps.min) return false;
      if (ps.max && partySize > ps.max) return false;
    }
    if (zone && conditions.zone && conditions.zone !== zone) return false;
    if (hour !== undefined && conditions.time) {
      const time = conditions.time as { after?: string; before?: string };
      if (time.after && hour < parseInt(time.after.split(":")[0], 10)) return false;
      if (time.before && hour > parseInt(time.before.split(":")[0], 10)) return false;
    }
    return true;
  });

  // 3. Récupérer l'historique client si disponible
  let guestPreferences: string[] = [];
  if (guestId) {
    const history = await db.upsellSuggestion.findMany({
      where: {
        guestId,
        accepted: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    guestPreferences = history.map((h) => h.suggestion);
  }

  // 4. Générer les suggestions
  const suggestions: UpsellSuggestionData[] = [];

  for (const rule of applicableRules) {
    const suggestion = generateSuggestion(rule, {
      guestPreferences,
      context,
      partySize,
      zone,
      hour,
    });

    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // 5. Trier par score et limiter
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Enregistre l'acceptation d'une suggestion d'upsell.
 */
export async function recordUpsellAcceptance(
  suggestionId: string,
): Promise<{ ok: boolean }> {
  try {
    await db.upsellSuggestion.update({
      where: { id: suggestionId },
      data: {
        accepted: true,
        acceptedAt: new Date(),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Crée une suggestion d'upsell personnalisée.
 */
export async function createUpsellSuggestion(params: {
  restaurantId: string;
  reservationId?: string;
  guestId?: string;
  context: UpsellContext;
  suggestion: string;
  reason: UpsellReason;
  score?: number;
}): Promise<UpsellSuggestionData> {
  const {
    restaurantId,
    reservationId,
    guestId,
    context,
    suggestion,
    reason,
    score = 0.5,
  } = params;

  const record = await db.upsellSuggestion.create({
    data: {
      restaurantId,
      reservationId,
      guestId,
      context,
      suggestion,
      reason,
      score,
    },
  });

  return {
    id: record.id,
    suggestion: record.suggestion,
    reason: record.reason as UpsellReason,
    score: record.score,
    context: record.context as UpsellContext,
  };
}

/**
 * Récupère les suggestions pour une réservation.
 */
export async function getSuggestionsForReservation(
  reservationId: string,
): Promise<UpsellSuggestionData[]> {
  const suggestions = await db.upsellSuggestion.findMany({
    where: { reservationId },
    orderBy: { score: "desc" },
  });

  return suggestions.map((s) => ({
    id: s.id,
    suggestion: s.suggestion,
    reason: s.reason as UpsellReason,
    score: s.score,
    context: s.context as UpsellContext,
  }));
}

/**
 * Récupère les règles d'upsell pour un restaurant.
 */
export async function getUpsellRules(
  restaurantId: string,
): Promise<UpsellRuleData[]> {
  const rules = await db.upsellRule.findMany({
    where: { restaurantId },
    orderBy: { priority: "desc" },
  });

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    triggerEvent: r.triggerEvent,
    conditions: r.conditions as Record<string, unknown>,
    suggestionType: r.suggestionType,
    menuItemId: r.menuItemId,
    customTitle: r.customTitle,
    customMessage: r.customMessage,
    maxSendsPerDay: r.maxSendsPerDay,
    sendsToday: r.sendsToday,
    active: r.active,
    priority: r.priority,
  }));
}

/**
 * Crée ou met à jour une règle d'upsell.
 */
export async function upsertUpsellRule(
  restaurantId: string,
  data: {
    id?: string;
    name: string;
    description?: string;
    triggerEvent: string;
    conditions?: Record<string, unknown>;
    suggestionType: string;
    menuItemId?: string;
    customTitle?: string;
    customMessage?: string;
    maxSendsPerDay?: number;
    active?: boolean;
    priority?: number;
  },
): Promise<UpsellRuleData> {
  const result = await db.upsellRule.upsert({
    where: { id: data.id ?? "" },
    create: {
      restaurantId,
      name: data.name,
      description: data.description,
      triggerEvent: data.triggerEvent,
      conditions: (data.conditions ?? {}) as Record<string, string>,
      suggestionType: data.suggestionType,
      menuItemId: data.menuItemId,
      customTitle: data.customTitle,
      customMessage: data.customMessage,
      maxSendsPerDay: data.maxSendsPerDay ?? 100,
      active: data.active ?? true,
      priority: data.priority ?? 0,
    },
    update: {
      name: data.name,
      description: data.description,
      triggerEvent: data.triggerEvent,
      conditions: (data.conditions ?? {}) as Record<string, string>,
      suggestionType: data.suggestionType,
      menuItemId: data.menuItemId,
      customTitle: data.customTitle,
      customMessage: data.customMessage,
      maxSendsPerDay: data.maxSendsPerDay ?? 100,
      active: data.active ?? true,
      priority: data.priority ?? 0,
    },
  });

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    triggerEvent: result.triggerEvent,
    conditions: result.conditions as Record<string, unknown>,
    suggestionType: result.suggestionType,
    menuItemId: result.menuItemId,
    customTitle: result.customTitle,
    customMessage: result.customMessage,
    maxSendsPerDay: result.maxSendsPerDay,
    sendsToday: result.sendsToday,
    active: result.active,
    priority: result.priority,
  };
}

// ─── Fonctions internes ──────────────────────────────────────────────

function generateSuggestion(
  rule: {
    suggestionType: string;
    customTitle: string | null;
    customMessage: string | null;
    menuItemId: string | null;
  },
  context: {
    guestPreferences: string[];
    context: UpsellContext;
    partySize?: number;
    zone?: string;
    hour?: number;
  },
): UpsellSuggestionData | null {
  // Pour simplifier, on génère des suggestions basées sur le type de règle
  const suggestionText = rule.customMessage ?? getSuggestionText(rule.suggestionType, context);
  const reason = determineReason(rule.suggestionType, context.guestPreferences);
  const score = calculateScore(reason, context);

  return {
    id: `temp-${Date.now()}`,
    suggestion: suggestionText,
    reason,
    score,
    context: context.context,
  };
}

function getSuggestionText(
  suggestionType: string,
  context: { partySize?: number; hour?: number },
): string {
  const suggestions: Record<string, string[]> = {
    menu_item: [
      "Découvrez notre plat du jour, préparé avec des produits frais du marché.",
      "Notre chef recommande ce soir : un plat unique en son genre.",
      "Vous avez peut-être envie de goûter à notre spécialité de la maison ?",
    ],
    addon: [
      "Un verre de vin serait parfait avec votre repas.",
      "Complétez votre commande avec une entrée ou une dégustation.",
      "Nos boissons artisanales se marient à merveille avec ce plat.",
    ],
    event: [
      "Un événement spécial a lieu ce soir dans notre restaurant.",
      "Réservez une table pour notre soirée à thème de vendredi.",
      "Découvrez notre menu dégustation pour une expérience unique.",
    ],
  };

  const options = suggestions[suggestionType] ?? suggestions.menu_item;
  return options[Math.floor(Math.random() * options.length)];
}

function determineReason(
  suggestionType: string,
  guestPreferences: string[],
): UpsellReason {
  if (guestPreferences.length > 3) return "historical_preference";
  if (suggestionType === "menu_item") return "popular";
  if (suggestionType === "addon") return "complementary";
  return "seasonal";
}

function calculateScore(
  reason: UpsellReason,
  context: { partySize?: number; hour?: number },
): number {
  let base = REASON_WEIGHTS[reason] ?? 0.5;

  // Bonus pour les grands groupes
  if (context.partySize && context.partySize >= 4) {
    base += 0.1;
  }

  // Bonus pour les heures de pointe
  if (context.hour && (context.hour >= 19 && context.hour <= 21)) {
    base += 0.05;
  }

  return Math.min(base, 1);
}
