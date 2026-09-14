import { db } from "@/lib/db";

export async function getTags(restaurantId: string) {
  return db.guestTag.findMany({
    where: { restaurantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { assignments: true } } },
  });
}

export async function createTag(restaurantId: string, name: string, color?: string) {
  return db.guestTag.create({
    data: { restaurantId, name, color: color ?? "#C9A96E" },
  });
}

export async function updateTag(tagId: string, data: { name?: string; color?: string }) {
  return db.guestTag.update({ where: { id: tagId }, data });
}

export async function deleteTag(tagId: string) {
  return db.guestTag.delete({ where: { id: tagId } });
}

export async function assignTag(guestId: string, tagId: string) {
  return db.guestTagAssignment.upsert({
    where: { guestId_tagId: { guestId, tagId } },
    create: { guestId, tagId },
    update: {},
  });
}

export async function unassignTag(guestId: string, tagId: string) {
  return db.guestTagAssignment.deleteMany({
    where: { guestId, tagId },
  });
}

export async function getGuestTags(guestId: string) {
  return db.guestTagAssignment.findMany({
    where: { guestId },
    include: { tag: true },
  });
}

export async function getGuestsByTag(restaurantId: string, tagId: string) {
  return db.guest.findMany({
    where: {
      tags: { some: { tagId } },
      reservations: { some: { restaurantId } },
    },
    include: { profile: true },
  });
}
