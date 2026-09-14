import { db } from "@/lib/db";

export type CentralMenuSyncResult = {
  restaurantId: string;
  synced: boolean;
  itemsAdded: number;
  itemsUpdated: number;
};

export async function getGroupMenu(groupId: string) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const restaurantIds = group.restaurants as string[];

  const items = await db.menuItem.findMany({
    where: { restaurantId: { in: restaurantIds } },
    include: { categoryRel: true, restaurant: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return items;
}

export async function syncMenuToProperties(
  groupId: string,
  sourceRestaurantId: string,
  targetRestaurantIds?: string[],
) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const allIds = group.restaurants as string[];
  const targets = targetRestaurantIds?.filter((id) => allIds.includes(id)) ?? allIds.filter((id) => id !== sourceRestaurantId);

  const sourceItems = await db.menuItem.findMany({
    where: { restaurantId: sourceRestaurantId },
  });

  const results: CentralMenuSyncResult[] = [];

  for (const targetId of targets) {
    let itemsAdded = 0;
    let itemsUpdated = 0;

    for (const item of sourceItems) {
      const existing = await db.menuItem.findFirst({
        where: { restaurantId: targetId, name: item.name },
      });

      if (existing) {
        await db.menuItem.update({
          where: { id: existing.id },
          data: {
            price: item.price,
            description: item.description,
            allergens: item.allergens,
            available: item.available,
          },
        });
        itemsUpdated++;
      } else {
        await db.menuItem.create({
          data: {
            restaurantId: targetId,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            allergens: item.allergens,
            available: item.available,
          },
        });
        itemsAdded++;
      }
    }

    results.push({
      restaurantId: targetId,
      synced: true,
      itemsAdded,
      itemsUpdated,
    });
  }

  return results;
}
