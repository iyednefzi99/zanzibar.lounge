"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { db } from "@/lib/db";

export async function addStaff(data: {
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
}) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const passwordHash = crypto.randomUUID().slice(0, 12);

  return db.staff.create({
    data: {
      restaurantId,
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
    },
  });
}

export async function toggleActive(staffId: string) {
  await requireAdmin();
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  if (!staff) throw new Error("Staff not found");

  return db.staff.update({
    where: { id: staffId },
    data: { active: !staff.active },
  });
}

export async function updateRole(
  staffId: string,
  role: "OWNER" | "MANAGER" | "STAFF",
) {
  await requireAdmin();
  return db.staff.update({
    where: { id: staffId },
    data: { role },
  });
}
