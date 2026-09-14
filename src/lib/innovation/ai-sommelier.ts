import { db } from "@/lib/db";

export type WinePairing = {
  wineName: string;
  wineType: string;
  reason: string;
  confidence: number;
};

const WINE_PAIRINGS: Record<string, WinePairing[]> = {
  meat: [
    { wineName: "Cabernet Sauvignon", wineType: "red", reason: "Tannins puissants pour les viandes rouges", confidence: 0.9 },
    { wineName: "Merlot", wineType: "red", reason: "Souplesse et fruité pour les viandes tendres", confidence: 0.85 },
  ],
  fish: [
    { wineName: "Sauvignon Blanc", wineType: "white", reason: "Fraîcheur et minéralité pour les poissons", confidence: 0.9 },
    { wineName: "Chardonnay", wineType: "white", reason: "Beurré pour les poissons en sauce", confidence: 0.85 },
  ],
  pasta: [
    { wineName: "Pinot Noir", wineType: "red", reason: "Légèreté et acidité pour les pâtes", confidence: 0.85 },
    { wineName: "Prosecco", wineType: "sparkling", reason: "Bulles pour les pâtes crémeuses", confidence: 0.8 },
  ],
  dessert: [
    { wineName: "Sauternes", wineType: "dessert", reason: "Douceur pour les desserts sucrés", confidence: 0.9 },
    { wineName: "Moscato d'Asti", wineType: "sparkling", reason: "Fruité et léger pour les desserts fruités", confidence: 0.85 },
  ],
  seafood: [
    { wineName: "Chablis", wineType: "white", reason: "Minéral pour les fruits de mer", confidence: 0.9 },
    { wineName: "Rosé de Provence", wineType: "rosé", reason: "Polyvalent pour les plateaux de fruits de mer", confidence: 0.85 },
  ],
  cheese: [
    { wineName: "Bordeaux", wineType: "red", reason: "Complexité pour les fromages affinés", confidence: 0.85 },
    { wineName: "Sauternes", wineType: "dessert", reason: "Douceur pour les fromages bleus", confidence: 0.9 },
  ],
};

export async function suggestWinePairing(dishAllergens: string[], restaurantId: string) {
  const wineList = await db.menuItem.findMany({
    where: {
      restaurantId,
      available: true,
      category: { contains: "vin", mode: "insensitive" },
    },
    select: { name: true, allergens: true, category: true },
  });

  const suggestions: WinePairing[] = [];

  for (const allergen of dishAllergens) {
    const pairings = WINE_PAIRINGS[allergen.toLowerCase()];
    if (pairings) {
      for (const pairing of pairings) {
        const matchOnList = wineList.find(
          (w) =>
            w.name.toLowerCase().includes(pairing.wineName.toLowerCase()) ||
            w.category.toLowerCase() === pairing.wineType,
        );

        suggestions.push({
          ...pairing,
          wineName: matchOnList?.name ?? pairing.wineName,
        });
      }
    }
  }

  const unique = suggestions
    .filter((s, i, arr) => arr.findIndex((a) => a.wineName === s.wineName) === i)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return unique;
}

export async function getSommelierRecommendation(restaurantId: string) {
  const popularDishes = await db.menuItem.findMany({
    where: { restaurantId, available: true, seasonal: true },
    take: 5,
    select: { name: true, allergens: true },
  });

  const allSuggestions: WinePairing[] = [];

  for (const dish of popularDishes) {
    const suggestions = await suggestWinePairing(dish.allergens, restaurantId);
    allSuggestions.push(...suggestions);
  }

  const unique = allSuggestions
    .filter((s, i, arr) => arr.findIndex((a) => a.wineName === s.wineName) === i)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return {
    recommendations: unique,
    basedOn: popularDishes.map((d) => d.name),
  };
}
