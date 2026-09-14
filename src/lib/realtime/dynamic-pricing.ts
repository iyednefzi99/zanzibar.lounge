import { type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function getPricingRules(restaurantId: string) {
  return db.dynamicPricingRule.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPricingRule(restaurantId: string, input: {
  menuItemId: string;
  ruleType: string;
  multiplier: number;
  conditions?: Record<string, unknown>;
}) {
  return db.dynamicPricingRule.create({
    data: {
      restaurantId,
      menuItemId: input.menuItemId,
      ruleType: input.ruleType,
      multiplier: input.multiplier,
      conditions: (input.conditions ?? {}) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function togglePricingRule(id: string, active: boolean) {
  return db.dynamicPricingRule.update({
    where: { id },
    data: { active },
  });
}

export async function deletePricingRule(id: string) {
  return db.dynamicPricingRule.delete({ where: { id } });
}

export async function getApplicableMultiplier(restaurantId: string, menuItemId: string, context: {
  covers?: number;
  hour?: number;
}): Promise<number> {
  const rules = await db.dynamicPricingRule.findMany({
    where: { restaurantId, menuItemId, active: true },
  });

  let multiplier = 1;
  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, unknown>;
    let applies = true;

    if (conditions.minCovers && context.covers && context.covers < (conditions.minCovers as number)) applies = false;
    if (conditions.maxCovers && context.covers && context.covers > (conditions.maxCovers as number)) applies = false;
    if (conditions.startHour && context.hour && context.hour < (conditions.startHour as number)) applies = false;
    if (conditions.endHour && context.hour && context.hour > (conditions.endHour as number)) applies = false;

    if (applies) multiplier *= rule.multiplier;
  }

  return multiplier;
}
