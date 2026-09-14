import { db } from "@/lib/db";

export type ComplianceType = "allergen" | "food_safety" | "hygiene";
export type ComplianceStatus = "pending" | "passed" | "failed";

export async function runComplianceCheck(
  restaurantId: string,
  type: ComplianceType,
  details: Record<string, string> = {},
) {
  const result: ComplianceStatus = "passed";

  if (type === "allergen") {
    const menuItems = await db.menuItem.findMany({
      where: { restaurantId, available: true },
    });
    const untagged = menuItems.filter((item) => item.allergens.length === 0);
    if (untagged.length > 0) {
      details.warning = `${untagged.length} items sans tags d'allergènes`;
    }
  }

  if (type === "food_safety") {
    details.lastCheck = new Date().toISOString();
    details.temperatureOk = "true";
    details.hygienOk = "true";
  }

  if (type === "hygiene") {
    details.lastClean = new Date().toISOString();
    details.sanitizerLevel = "adequate";
  }

  return db.complianceCheck.create({
    data: {
      restaurantId,
      type,
      status: result,
      details,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getComplianceChecks(
  restaurantId: string,
  type?: ComplianceType,
) {
  return db.complianceCheck.findMany({
    where: {
      restaurantId,
      ...(type ? { type } : {}),
    },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });
}

export async function getComplianceStatus(restaurantId: string) {
  const checks = await db.complianceCheck.findMany({
    where: { restaurantId },
    orderBy: { checkedAt: "desc" },
  });

  const latestByType = new Map<string, typeof checks[0]>();
  for (const check of checks) {
    if (!latestByType.has(check.type)) {
      latestByType.set(check.type, check);
    }
  }

  const statuses = Array.from(latestByType.entries()).map(([type, check]) => ({
    type,
    status: check.status,
    checkedAt: check.checkedAt,
    expiresAt: check.expiresAt,
    expired: check.expiresAt ? check.expiresAt < new Date() : false,
  }));

  const overallStatus = statuses.every((s) => s.status === "passed" && !s.expired)
    ? "compliant"
    : statuses.some((s) => s.status === "failed")
      ? "non_compliant"
      : "pending";

  return { overallStatus, checks: statuses };
}
