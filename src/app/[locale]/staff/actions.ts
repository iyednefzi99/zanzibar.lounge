"use server";

import { authenticateStaff } from "@/lib/staff-auth";
import { createStaffSession } from "@/lib/staff-session";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Identifiants requis" };
  }

  const restaurantId = await getDefaultRestaurantId();
  const staff = await authenticateStaff(restaurantId, email, password);
  if (!staff) {
    return { error: "Email ou mot de passe incorrect" };
  }

  await createStaffSession(staff.id, restaurantId);
  return null;
}
