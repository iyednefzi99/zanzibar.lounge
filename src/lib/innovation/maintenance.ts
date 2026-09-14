import { db } from "@/lib/db";

export async function createMaintenanceAlert(restaurantId: string, input: {
  assetType: string;
  severity?: string;
  title: string;
  description?: string;
}) {
  return db.maintenanceAlert.create({
    data: { restaurantId, ...input },
  });
}

export async function getActiveAlerts(restaurantId: string) {
  return db.maintenanceAlert.findMany({
    where: { restaurantId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function acknowledgeAlert(id: string) {
  return db.maintenanceAlert.update({
    where: { id },
    data: { status: "acknowledged" },
  });
}

export async function resolveAlert(id: string) {
  return db.maintenanceAlert.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}
