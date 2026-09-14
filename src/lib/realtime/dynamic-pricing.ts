import { db } from "@/lib/db";

export type PricingRuleType = "happy_hour" | "demand_surge" | "off_peak" | "loyalty";

export async function getPricingRules(restaurantId: string, menuItemId?: string) {
  return db.dynamicPricingRule.findMany({
    where: {
      restaurantId,
      ...(menuItemId ? { menuItemId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPricingRule(
  restaurantId: string,
  menuItemId: string,
  ruleType: PricingRuleType,
  multiplier: number,
  conditions: Record<string, string> = {},
  validFrom?: Date,
  validUntil?: Date,
) {
  return db.dynamicPricingRule.create({
    data: {
      restaurantId,
      menuItemId,
      ruleType,
      multiplier,
      conditions,
      validFrom,
      validUntil,
    },
  });
}

export async function updatePricingRule(
  id: string,
  data: Partial<{
    multiplier: number;
    conditions: Record<string, string>;
    active: boolean;
    validFrom: Date;
    validUntil: Date;
  }>,
) {
  return db.dynamicPricingRule.update({ where: { id }, data });
}

export async function deletePricingRule(id: string) {
  return db.dynamicPricingRule.delete({ where: { id } });
}

export async function calculatePrice(
  restaurantId: string,
  menuItemId: string,
  basePrice: number,
  context: {
    covers?: number;
    hour?: number;
    loyaltyTier?: string;
  } = {},
) {
  const now = new Date();
  const hour = context.hour ?? now.getHours();

  const rules = await db.dynamicPricingRule.findMany({
    where: {
      restaurantId,
      menuItemId,
      active: true,
    },
  });

  let finalMultiplier = 1;
  let appliedRule: string | null = null;

  for (const rule of rules) {
    if (rule.validFrom && rule.validFrom > now) continue;
    if (rule.validUntil && rule.validUntil < now) continue;

    const conditions = rule.conditions as Record<string, string>;

    if (rule.ruleType === "happy_hour") {
      const startHour = Number(conditions.startHour ?? 17);
      const endHour = Number(conditions.endHour ?? 19);
      if (hour >= startHour && hour <= endHour) {
        finalMultiplier = rule.multiplier;
        appliedRule = rule.id;
      }
    }

    if (rule.ruleType === "demand_surge") {
      const minCovers = Number(conditions.minCovers ?? 80);
      if (context.covers && context.covers >= minCovers) {
        finalMultiplier = rule.multiplier;
        appliedRule = rule.id;
      }
    }

    if (rule.ruleType === "off_peak") {
      const startHour = Number(conditions.startHour ?? 14);
      const endHour = Number(conditions.endHour ?? 17);
      if (hour >= startHour && hour <= endHour) {
        finalMultiplier = rule.multiplier;
        appliedRule = rule.id;
      }
    }

    if (rule.ruleType === "loyalty" && context.loyaltyTier) {
      const tiers = (conditions.tiers ?? "").split(",");
      if (tiers.includes(context.loyaltyTier)) {
        finalMultiplier = rule.multiplier;
        appliedRule = rule.id;
      }
    }
  }

  const finalPrice = Math.round(basePrice * finalMultiplier);

  return {
    basePrice,
    finalPrice,
    multiplier: finalMultiplier,
    appliedRule,
  };
}
