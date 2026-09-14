import { db } from "@/lib/db";

// --- Types ---

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  lastUpdated: Date;
  menuItemId: string | null;
  menuItemName: string | null;
  status: "ok" | "low" | "critical";
};

export type InventoryLogEntry = {
  id: string;
  change: number;
  reason: string;
  createdAt: Date;
};

export type OrderItemForDeduction = {
  menuItemId: string;
  quantity: number;
};

// --- Queries ---

/**
 * Inventaire complet d'un restaurant.
 */
export async function getInventory(
  restaurantId: string,
): Promise<InventoryItem[]> {
  const items = await db.inventory.findMany({
    where: { restaurantId },
    include: { menuItem: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    minQuantity: item.minQuantity,
    lastUpdated: item.lastUpdated,
    menuItemId: item.menuItemId,
    menuItemName: item.menuItem?.name ?? null,
    status: getItemStatus(item.quantity, item.minQuantity),
  }));
}

/**
 * Articles en dessous du seuil minimum.
 */
export async function checkLowStock(
  restaurantId: string,
): Promise<InventoryItem[]> {
  const items = await db.inventory.findMany({
    where: { restaurantId },
    include: { menuItem: { select: { name: true } } },
    orderBy: { quantity: "asc" },
  });

  return items
    .filter((item) => item.quantity <= item.minQuantity)
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.minQuantity,
      lastUpdated: item.lastUpdated,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItem?.name ?? null,
      status: getItemStatus(item.quantity, item.minQuantity),
    }));
}

/**
 * Historique des mouvements de stock.
 */
export async function getInventoryLog(
  inventoryId: string,
  days: number = 30,
): Promise<InventoryLogEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await db.inventoryLog.findMany({
    where: {
      inventoryId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    change: log.change,
    reason: log.reason,
    createdAt: log.createdAt,
  }));
}

// --- Mutations ---

/**
 * Mettre à jour le stock d'un article.
 */
export async function updateStock(
  inventoryId: string,
  quantity: number,
  reason: string,
): Promise<InventoryItem> {
  const item = await db.inventory.findUniqueOrThrow({
    where: { id: inventoryId },
    include: { menuItem: { select: { name: true } } },
  });

  const newQuantity = item.quantity + quantity;

  await db.$transaction([
    db.inventory.update({
      where: { id: inventoryId },
      data: { quantity: newQuantity, lastUpdated: new Date() },
    }),
    db.inventoryLog.create({
      data: {
        inventoryId,
        change: quantity,
        reason,
      },
    }),
  ]);

  return {
    id: item.id,
    name: item.name,
    quantity: newQuantity,
    unit: item.unit,
    minQuantity: item.minQuantity,
    lastUpdated: new Date(),
    menuItemId: item.menuItemId,
    menuItemName: item.menuItem?.name ?? null,
    status: getItemStatus(newQuantity, item.minQuantity),
  };
}

/**
 * Déduction automatique du stock lors d'une commande.
 *
 * Pour chaque article de commande, déduit 1 unité de chaque article
 * d'inventaire lié via menuItemId.
 */
export async function autoDeductStock(
  restaurantId: string,
  orderItems: OrderItemForDeduction[],
): Promise<{ deducted: number; lowStock: string[] }> {
  const menuItemIds = [...new Set(orderItems.map((i) => i.menuItemId))];

  if (menuItemIds.length === 0) {
    return { deducted: 0, lowStock: [] };
  }

  const inventoryItems = await db.inventory.findMany({
    where: {
      restaurantId,
      menuItemId: { in: menuItemIds },
    },
  });

  if (inventoryItems.length === 0) {
    return { deducted: 0, lowStock: [] };
  }

  const deductions: Array<{ id: string; change: number; reason: string }> = [];
  const lowStockItems: string[] = [];

  for (const orderItem of orderItems) {
    const linked = inventoryItems.filter(
      (inv) => inv.menuItemId === orderItem.menuItemId,
    );
    for (const inv of linked) {
      const deduction = -1 * orderItem.quantity;
      deductions.push({
        id: inv.id,
        change: deduction,
        reason: `Commande: ${orderItem.menuItemId} x${orderItem.quantity}`,
      });
    }
  }

  for (const deduction of deductions) {
    const inv = inventoryItems.find((i) => i.id === deduction.id)!;
    const newQty = inv.quantity + deduction.change;

    await db.$transaction([
      db.inventory.update({
        where: { id: deduction.id },
        data: { quantity: newQty, lastUpdated: new Date() },
      }),
      db.inventoryLog.create({
        data: {
          inventoryId: deduction.id,
          change: deduction.change,
          reason: deduction.reason,
        },
      }),
    ]);

    if (newQty <= inv.minQuantity) {
      lowStockItems.push(inv.name);
    }
  }

  return { deducted: deductions.length, lowStock: lowStockItems };
}

// --- Helpers ---

function getItemStatus(
  quantity: number,
  minQuantity: number,
): "ok" | "low" | "critical" {
  if (quantity <= 0) return "critical";
  if (quantity <= minQuantity) return "low";
  return "ok";
}
