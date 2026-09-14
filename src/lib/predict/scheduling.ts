import { db } from "@/lib/db";

type Suggestion = {
  staffId: string;
  shift: string;
  reason: string;
  confidence: number;
};

export async function suggestSchedule(
  restaurantId: string,
  weekStart: Date,
  suggestions: Suggestion[],
) {
  return db.scheduleSuggestion.upsert({
    where: {
      restaurantId_weekStart: { restaurantId, weekStart },
    },
    create: { restaurantId, weekStart, suggestions: suggestions as unknown as Record<string, string> },
    update: { suggestions: suggestions as unknown as Record<string, string> },
  });
}
