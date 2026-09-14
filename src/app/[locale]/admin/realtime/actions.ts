"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function togglePricingRuleAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const ruleId = formData.get("ruleId");
  if (typeof ruleId !== "string") return;

  const rule = await db.dynamicPricingRule.findUnique({
    where: { id: ruleId },
    select: { active: true },
  });
  if (!rule) return;

  await db.dynamicPricingRule.update({
    where: { id: ruleId },
    data: { active: !rule.active },
  });

  revalidatePath("/[locale]/admin/realtime", "page");
}

export async function updatePricingRuleMultiplierAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const ruleId = formData.get("ruleId");
  const multiplier = formData.get("multiplier");

  if (typeof ruleId !== "string") return { error: "Règle introuvable" };
  if (typeof multiplier !== "string" || isNaN(parseFloat(multiplier))) {
    return { error: "Multiplicateur invalide" };
  }

  await db.dynamicPricingRule.update({
    where: { id: ruleId },
    data: { multiplier: parseFloat(multiplier) },
  });

  revalidatePath("/[locale]/admin/realtime", "page");
  return {};
}
