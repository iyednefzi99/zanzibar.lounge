import { db } from "@/lib/db";

export type Allergen = "gluten" | "dairy" | "nuts" | "eggs" | "soy" | "fish" | "shellfish" | "sesame";

export const ALLERGEN_LIST: Allergen[] = [
  "gluten", "dairy", "nuts", "eggs", "soy", "fish", "shellfish", "sesame",
];

export async function detectAllergens(restaurantId: string, guestAllergens: Allergen[]) {
  const menuItems = await db.menuItem.findMany({
    where: { restaurantId, available: true },
  });

  const flagged = menuItems
    .map((item) => {
      const itemAllergens = item.allergens.filter((a) =>
        ALLERGEN_LIST.includes(a as Allergen),
      ) as Allergen[];
      const conflicts = itemAllergens.filter((a) => guestAllergens.includes(a));

      return {
        itemId: item.id,
        name: item.name,
        containsAllergens: itemAllergens,
        conflicts,
        safe: conflicts.length === 0,
      };
    })
    .filter((item) => !item.safe);

  return {
    guestAllergens,
    flaggedItems: flagged,
    safeCount: menuItems.length - flagged.length,
    totalCount: menuItems.length,
  };
}

export async function getAllergenMenuReport(restaurantId: string) {
  const menuItems = await db.menuItem.findMany({
    where: { restaurantId, available: true },
  });

  const allergenCounts: Record<string, number> = {};
  for (const item of menuItems) {
    for (const allergen of item.allergens) {
      allergenCounts[allergen] = (allergenCounts[allergen] ?? 0) + 1;
    }
  }

  return {
    totalItems: menuItems.length,
    allergenCounts,
    itemsByAllergen: ALLERGEN_LIST.map((a) => ({
      allergen: a,
      count: allergenCounts[a] ?? 0,
    })),
  };
}
