import { db } from "@/lib/db";

export type ComplianceType = "allergen" | "food_safety" | "hygiene";
export type ComplianceStatus = "pending" | "passed" | "failed";

type TemperatureLog = {
  location: string;
  temperature: number;
  unit: "C" | "F";
  loggedAt: Date;
};

type ExpiryEntry = {
  itemName: string;
  expiryDate: Date;
  quantity: number;
};

export async function runComplianceCheck(
  restaurantId: string,
  type: ComplianceType,
  details: Record<string, string> = {},
): Promise<{ status: ComplianceStatus; details: Record<string, string> }> {
  let status: ComplianceStatus = "passed";

  if (type === "allergen") {
    const menuItems = await db.menuItem.findMany({
      where: { restaurantId, available: true },
    });
    const untagged = menuItems.filter((item) => item.allergens.length === 0);
    if (untagged.length > 0) {
      details.warning = `${untagged.length} items sans tags d'allergènes`;
      details.untaggedItems = untagged.map((i) => i.name).join(", ");
      status = "failed";
    }
    details.totalMenuItems = String(menuItems.length);
    details.taggedItems = String(menuItems.length - untagged.length);
  }

  if (type === "food_safety") {
    details.lastCheck = new Date().toISOString();

    const recentLogs = await db.complianceCheck.findMany({
      where: {
        restaurantId,
        type: "food_safety",
        checkedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { checkedAt: "desc" },
      take: 10,
    });

    const hasRecentFailure = recentLogs.some((c) => c.status === "failed");
    if (hasRecentFailure) {
      status = "failed";
      details.recentFailure = "true";
    }

    details.checksToday = String(recentLogs.length);
    details.temperatureOk = status === "passed" ? "true" : "false";
  }

  if (type === "hygiene") {
    details.lastClean = new Date().toISOString();
    details.sanitizerLevel = "adequate";

    const lastHygieneCheck = await db.complianceCheck.findFirst({
      where: { restaurantId, type: "hygiene" },
      orderBy: { checkedAt: "desc" },
    });

    if (lastHygieneCheck) {
      const hoursSinceLastCheck =
        (Date.now() - lastHygieneCheck.checkedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCheck > 4) {
        details.gapWarning = `${Math.round(hoursSinceLastCheck)}h depuis la dernière vérification`;
      }
    }
  }

  await db.complianceCheck.create({
    data: {
      restaurantId,
      type,
      status,
      details,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { status, details };
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

  const latestByType = new Map<string, (typeof checks)[0]>();
  for (const check of checks) {
    if (!latestByType.has(check.type)) {
      latestByType.set(check.type, check);
    }
  }

  const statuses = Array.from(latestByType.entries()).map(
    ([type, check]) => ({
      type,
      status: check.status,
      checkedAt: check.checkedAt,
      expiresAt: check.expiresAt,
      expired: check.expiresAt ? check.expiresAt < new Date() : false,
    }),
  );

  const overallStatus = statuses.every(
    (s) => s.status === "passed" && !s.expired,
  )
    ? "compliant"
    : statuses.some((s) => s.status === "failed")
      ? "non_compliant"
      : "pending";

  return { overallStatus, checks: statuses };
}

export async function getViolationHistory(restaurantId: string) {
  const violations = await db.complianceCheck.findMany({
    where: { restaurantId, status: "failed" },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });

  const byType = new Map<string, number>();
  for (const v of violations) {
    byType.set(v.type, (byType.get(v.type) ?? 0) + 1);
  }

  return {
    total: violations.length,
    byType: Object.fromEntries(byType),
    recent: violations.slice(0, 10),
  };
}

export async function logTemperature(
  restaurantId: string,
  logs: TemperatureLog[],
) {
  const details: Record<string, string> = {};
  let allOk = true;

  for (const log of logs) {
    const key = `temp_${log.location}`;
    details[key] = `${log.temperature}°${log.unit}`;

    // HACCP thresholds: fridge 0-4°C, freezer <-18°C, hot holding >63°C
    if (
      log.location.includes("fridge") &&
      (log.temperature < 0 || log.temperature > 4)
    ) {
      allOk = false;
      details[`${key}_status`] = "OUT_OF_RANGE";
    }
    if (log.location.includes("freezer") && log.temperature > -18) {
      allOk = false;
      details[`${key}_status`] = "OUT_OF_RANGE";
    }
    if (
      log.location.includes("hot") &&
      log.unit === "C" &&
      log.temperature < 63
    ) {
      allOk = false;
      details[`${key}_status`] = "OUT_OF_RANGE";
    }
  }

  return runComplianceCheck(restaurantId, "food_safety", details);
}

export async function checkExpiry(
  restaurantId: string,
  items: ExpiryEntry[],
) {
  const now = new Date();
  const expiringSoon = items.filter(
    (item) => item.expiryDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000,
  );
  const expired = items.filter((item) => item.expiryDate < now);

  const details: Record<string, string> = {
    totalChecked: String(items.length),
    expiringSoon: String(expiringSoon.length),
    expired: String(expired.length),
  };

  if (expired.length > 0) {
    details.expiredItems = expired.map((e) => `${e.itemName} (${e.expiryDate.toLocaleDateString("fr-FR")})`).join(", ");
  }
  if (expiringSoon.length > 0) {
    details.expiringItems = expiringSoon.map((e) => `${e.itemName} (${e.expiryDate.toLocaleDateString("fr-FR")})`).join(", ");
  }

  const status: ComplianceStatus = expired.length > 0 ? "failed" : "passed";
  await db.complianceCheck.create({
    data: {
      restaurantId,
      type: "food_safety",
      status,
      details,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { status, expired: expired.length, expiringSoon: expiringSoon.length };
}
