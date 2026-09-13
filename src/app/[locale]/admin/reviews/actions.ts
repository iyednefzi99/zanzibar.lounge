"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { approveReview, rejectReview } from "@/lib/reviews";

/**
 * Actions de modération des avis.
 *
 * Chaque action revérifie l'identité par requireAdmin().
 */
export async function approveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await approveReview(id);
  revalidatePath("/[locale]/admin/reviews", "page");
}

export async function rejectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await rejectReview(id);
  revalidatePath("/[locale]/admin/reviews", "page");
}
