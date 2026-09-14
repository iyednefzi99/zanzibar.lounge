import { db } from "@/lib/db";

export type OnboardingStep = "info" | "menu" | "tables" | "integrations" | "preview";

export type RestaurantInfo = {
  name: string;
  cuisineTypes: string[];
  address: string;
  phone: string;
  timezone: string;
  locale: string;
};

export async function getOnboardingProgress(setupTokenId: string) {
  const token = await db.setupToken.findUnique({
    where: { id: setupTokenId },
    include: { restaurant: true },
  });
  return token;
}

export async function completeRestaurantSetup(
  tokenId: string,
  info: RestaurantInfo,
) {
  const token = await db.setupToken.findUnique({ where: { id: tokenId } });
  if (!token || token.status !== "pending") {
    throw new Error("Invalid or expired setup token");
  }

  const result = await db.$transaction(async (tx) => {
    // Create restaurant
    const restaurant = await tx.restaurant.create({
      data: {
        name: info.name,
        slug: info.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        address: info.address,
        phone: info.phone,
        timezone: info.timezone,
        locale: info.locale,
        cuisineTypes: info.cuisineTypes,
      },
    });

    // Create owner staff
    const staff = await tx.staff.create({
      data: {
        restaurantId: restaurant.id,
        email: token.email,
        name: token.restaurantName ?? info.name + " Owner",
        role: "OWNER",
        passwordHash: "", // Will be set separately
      },
    });

    // Update token
    await tx.setupToken.update({
      where: { id: tokenId },
      data: { status: "used", usedAt: new Date(), restaurantId: restaurant.id },
    });

    return { restaurant, staff };
  });

  return result;
}

export async function createDefaultTables(restaurantId: string) {
  const zones = ["TERRASSE", "SALLE", "SALON"] as const;
  const tablesPerZone = [
    { zone: "TERRASSE", count: 5, capacity: 4 },
    { zone: "SALLE", count: 8, capacity: 4 },
    { zone: "SALON", count: 3, capacity: 6 },
  ];

  for (const config of tablesPerZone) {
    for (let i = 1; i <= config.count; i++) {
      await db.restaurantTable.create({
        data: {
          restaurantId,
          name: `${config.zone.charAt(0)}${i}`,
          capacity: config.capacity,
          zone: config.zone as "TERRASSE" | "SALLE" | "SALON",
        },
      });
    }
  }
}
