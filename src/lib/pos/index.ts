import { db } from "@/lib/db";

export type PosProvider = "toast" | "square" | "lightspeed" | "clover" | "custom";

export type PosConfig = {
  provider: PosProvider;
  apiKey?: string;
  apiSecret?: string;
  locationId?: string;
  syncMenu?: boolean;
  syncOrders?: boolean;
  syncPayments?: boolean;
};

export type PosSyncResult = {
  success: boolean;
  synced: number;
  errors: string[];
};

export async function getPosIntegrations(restaurantId: string) {
  return db.posIntegration.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPosIntegration(restaurantId: string, provider: PosProvider) {
  return db.posIntegration.findUnique({
    where: { restaurantId_provider: { restaurantId, provider } },
  });
}

export async function createPosIntegration(restaurantId: string, config: PosConfig) {
  return db.posIntegration.upsert({
    where: { restaurantId_provider: { restaurantId, provider: config.provider } },
    create: {
      restaurantId,
      provider: config.provider,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      locationId: config.locationId,
      syncMenu: config.syncMenu ?? true,
      syncOrders: config.syncOrders ?? false,
      syncPayments: config.syncPayments ?? false,
    },
    update: {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      locationId: config.locationId,
      syncMenu: config.syncMenu ?? true,
      syncOrders: config.syncOrders ?? false,
      syncPayments: config.syncPayments ?? false,
      syncStatus: "idle",
      syncError: null,
    },
  });
}

export async function deletePosIntegration(restaurantId: string, provider: PosProvider) {
  return db.posIntegration.deleteMany({
    where: { restaurantId, provider },
  });
}

export async function updateSyncStatus(
  integrationId: string,
  status: "idle" | "syncing" | "error",
  error?: string,
) {
  return db.posIntegration.update({
    where: { id: integrationId },
    data: {
      syncStatus: status,
      syncError: error ?? null,
      lastSyncAt: status === "idle" ? new Date() : undefined,
    },
  });
}

export async function logSync(
  integrationId: string,
  direction: "import" | "export",
  entityType: "menu" | "order" | "payment",
  status: "success" | "error" | "skipped",
  details?: Record<string, unknown>,
  entityId?: string,
) {
  return db.posSyncLog.create({
    data: {
      integrationId,
      direction,
      entityType,
      entityId: entityId ?? null,
      status,
      details: details as Record<string, string> ?? undefined,
    },
  });
}

export async function getSyncHistory(restaurantId: string, limit = 20) {
  return db.posSyncLog.findMany({
    where: { integration: { restaurantId } },
    include: { integration: { select: { provider: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
