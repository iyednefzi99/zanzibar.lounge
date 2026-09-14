"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function toggleAutomation(
  restaurantId: string,
  ruleId: string,
  enabled: boolean,
) {
  await requireAdmin();

  const metricType = `automation:${ruleId}`;

  const existing = await db.liveMetric.findFirst({
    where: { restaurantId, metricType },
  });

  if (existing) {
    return db.liveMetric.update({
      where: { id: existing.id },
      data: { value: enabled ? 1 : 0 },
    });
  }

  return db.liveMetric.create({
    data: {
      restaurantId,
      metricType,
      value: enabled ? 1 : 0,
      unit: "enabled",
    },
  });
}
