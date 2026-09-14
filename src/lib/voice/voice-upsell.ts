import { db } from "@/lib/db";

type UpsellContext = {
  restaurantId: string;
  reservationId?: string;
  guestId?: string;
  context: string;
  language?: string;
};

const UPSELL_SUGGESTIONS: Record<string, string[]> = {
  ordering: [
    "Ajoutez un dessert pour accompagner votre repas.",
    "Notre cocktail signature se marie parfaitement avec ce plat.",
    "Voici notre spécialité du jour.",
    "Un verre de vin pour accompagner votre plat ?",
  ],
  seated: [
    "Pendant que vous attendez, essayez nos apéritifs.",
    "Nos entrées sont parfaites à partager.",
    "Souhaitez-vous un verre en attendant ?",
  ],
  post_meal: [
    "Un café ou un digestif pour terminer ?",
    "Notre carte de desserts a de belles surprises.",
    "Essayez notre pâtisserie maison.",
  ],
  evening: [
    "Nos cocktails du soir sont en promotion.",
    "Un verre de champagne pour célébrer ?",
    "Découvrez notre sélection de vins du soir.",
  ],
  lunch: [
    "Le menu du jour est disponible à prix fixe.",
    "Une salade pour commencer ?",
    "Un jus frais avec votre repas ?",
  ],
};

const TIME_CONTEXTS: Record<string, string[]> = {
  morning: ["café", "petit-déjeuner", "viennoiserie"],
  lunch: ["menu_du_jour", "salade", "boisson_fraiche"],
  afternoon: ["dessert", "goûter", "café"],
  evening: ["cocktail", "apéritif", "vin"],
  late: ["digestif", "café", "dessert"],
};

function getTimeContext(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "late";
}

function getDayContext(): string {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return "weekend";
  return "weekday";
}

export async function generateUpsellSuggestion(input: UpsellContext) {
  const timeCtx = getTimeContext();
  const dayCtx = getDayContext();
  const contextKey =
    input.context in UPSELL_SUGGESTIONS ? input.context : "ordering";

  let pool = [...UPSELL_SUGGESTIONS[contextKey]];

  const timePool = TIME_CONTEXTS[timeCtx];
  if (timePool) {
    pool = pool.concat(
      timePool.map((t) => `Suggestion contextuelle: ${t}`),
    );
  }

  if (dayCtx === "weekend") {
    pool.push("Profitez de notre offre spéciale weekend.");
  }

  if (input.guestId) {
    const profile = await db.guestAiProfile.findUnique({
      where: { guestId: input.guestId },
    });

    if (profile) {
      const prefs = (profile.preferences as Record<string, string>) ?? {};
      if (prefs.favoriteCategory) {
        pool.push(
          `Découvrez nos nouveaux ${prefs.favoriteCategory} de la saison.`,
        );
      }
      if (prefs.dietary === "vegetarian" || prefs.dietary === "vegan") {
        pool.push("Nos plats végétariens sont fraîchement préparés.");
      }
    }
  }

  const suggestion = pool[Math.floor(Math.random() * pool.length)];

  return db.upsellSuggestion.create({
    data: {
      restaurantId: input.restaurantId,
      reservationId: input.reservationId,
      context: `${input.context}_${timeCtx}_${dayCtx}`,
      suggestion,
      reason: input.guestId ? "personalized" : "contextual",
    },
  });
}

export async function trackUpsellAcceptance(
  suggestionId: string,
  accepted: boolean,
) {
  return db.upsellSuggestion.update({
    where: { id: suggestionId },
    data: { accepted },
  });
}

export async function getUpsellStats(restaurantId: string) {
  const suggestions = await db.upsellSuggestion.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const total = suggestions.length;
  const accepted = suggestions.filter((s) => s.accepted).length;
  const acceptanceRate =
    total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";

  const byContext = new Map<string, { total: number; accepted: number }>();
  for (const s of suggestions) {
    const ctx = s.context.split("_")[0];
    const current = byContext.get(ctx) ?? { total: 0, accepted: 0 };
    current.total += 1;
    if (s.accepted) current.accepted += 1;
    byContext.set(ctx, current);
  }

  const contextBreakdown = Array.from(byContext.entries()).map(
    ([ctx, v]) => ({
      context: ctx,
      total: v.total,
      accepted: v.accepted,
      rate: v.total > 0 ? ((v.accepted / v.total) * 100).toFixed(1) : "0.0",
    }),
  );

  return { total, accepted, acceptanceRate, contextBreakdown };
}
