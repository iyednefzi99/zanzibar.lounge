"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function updateRecommendationStatusAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const recId = formData.get("recId");
  const accepted = formData.get("accepted");
  if (typeof recId !== "string") return;
  if (typeof accepted !== "string") return;

  await db.recommendation.update({
    where: { id: recId },
    data: { accepted: accepted === "true" },
  });

  revalidatePath("/[locale]/admin/personalization", "page");
}
