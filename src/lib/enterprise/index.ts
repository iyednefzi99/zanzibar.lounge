import { db } from "@/lib/db";

export type PropertyGroupData = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  restaurants: string[];
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPropertyGroups(ownerEmail?: string) {
  return db.propertyGroup.findMany({
    where: ownerEmail ? { ownerEmail } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getPropertyGroup(slug: string) {
  return db.propertyGroup.findUnique({ where: { slug } });
}

export async function createPropertyGroup(
  name: string,
  slug: string,
  ownerEmail: string,
  restaurantIds: string[] = [],
  settings: Record<string, string> = {},
) {
  return db.propertyGroup.create({
    data: { name, slug, ownerEmail, restaurants: restaurantIds, settings },
  });
}

export async function updatePropertyGroup(
  slug: string,
  data: { name?: string; ownerEmail?: string; restaurants?: string[]; settings?: Record<string, string> },
) {
  return db.propertyGroup.update({ where: { slug }, data });
}

export async function addRestaurantToGroup(groupId: string, restaurantId: string) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const ids = group.restaurants as string[];
  if (ids.includes(restaurantId)) return group;

  return db.propertyGroup.update({
    where: { id: groupId },
    data: { restaurants: [...ids, restaurantId] },
  });
}

export async function removeRestaurantFromGroup(groupId: string, restaurantId: string) {
  const group = await db.propertyGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  const ids = (group.restaurants as string[]).filter((id) => id !== restaurantId);
  return db.propertyGroup.update({
    where: { id: groupId },
    data: { restaurants: ids },
  });
}
