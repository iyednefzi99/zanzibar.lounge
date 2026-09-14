import { db } from "@/lib/db";

type UpsellContext = {
  restaurantId: string;
  reservationId?: string;
  context: string;
  language?: string;
};

const UPSELL_SUGGESTIONS: Record<string, string[]> = {
  ordering: [
    "Would you like to add a dessert to your order?",
    "Our signature cocktail pairs perfectly with that dish.",
    "May I suggest our daily special?",
  ],
  seated: [
    "Can I interest you in a drink while you wait?",
    "Our appetizers are perfect for sharing.",
  ],
  post_meal: [
    "How about a coffee or digestif?",
    "Our dessert menu has some lovely options.",
  ],
};

export async function generateUpsellSuggestion(input: UpsellContext) {
  const suggestions = UPSELL_SUGGESTIONS[input.context] ?? UPSELL_SUGGESTIONS.ordering;
  const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

  return db.upsellSuggestion.create({
    data: {
      restaurantId: input.restaurantId,
      reservationId: input.reservationId,
      context: input.context,
      suggestion,
      reason: "contextual",
    },
  });
}
