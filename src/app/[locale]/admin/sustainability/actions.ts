"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function addCarbonLogAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const category = formData.get("category");
  const amount = formData.get("amount");
  const unit = formData.get("unit");
  const source = formData.get("source");

  if (typeof category !== "string" || !category.trim()) {
    return { error: "Catégorie requise" };
  }
  if (typeof amount !== "string" || isNaN(parseFloat(amount))) {
    return { error: "Montant invalide" };
  }
  if (typeof unit !== "string" || !unit.trim()) {
    return { error: "Unité requise" };
  }

  await db.carbonLog.create({
    data: {
      restaurantId: "default",
      category: category.trim(),
      amount: parseFloat(amount),
      unit: unit.trim(),
      source: typeof source === "string" && source.trim() ? source.trim() : null,
      period: new Date(),
    },
  });

  revalidatePath("/[locale]/admin/sustainability", "page");
  return {};
}

export async function updateComplianceStatusAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const checkId = formData.get("checkId");
  const status = formData.get("status");
  if (typeof checkId !== "string") return;
  if (typeof status !== "string") return;

  await db.complianceCheck.update({
    where: { id: checkId },
    data: { status },
  });

  revalidatePath("/[locale]/admin/sustainability", "page");
}
