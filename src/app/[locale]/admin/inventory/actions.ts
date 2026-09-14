"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { updateStock, getInventoryLog } from "@/lib/inventory";
import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

// --- Stock ---

export async function updateStockAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const inventoryId = formData.get("inventoryId");
  const quantity = formData.get("quantity");
  const reason = formData.get("reason");

  if (typeof inventoryId !== "string") return;
  if (typeof quantity !== "string") return;
  const qty = parseFloat(quantity);
  if (isNaN(qty)) return;

  const reasonStr =
    typeof reason === "string" && reason.trim() ? reason.trim() : "Ajustement manuel";

  await updateStock(inventoryId, qty, reasonStr);
  revalidatePath("/[locale]/admin/inventory", "page");
}

// --- Create inventory item ---

export async function createInventoryItemAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const name = formData.get("name");
  const quantity = formData.get("quantity");
  const unit = formData.get("unit");
  const minQuantity = formData.get("minQuantity");

  if (typeof name !== "string" || !name.trim()) return;
  if (typeof quantity !== "string") return;
  if (typeof unit !== "string" || !unit.trim()) return;
  if (typeof minQuantity !== "string") return;

  const qty = parseFloat(quantity);
  const minQty = parseFloat(minQuantity);
  if (isNaN(qty) || isNaN(minQty)) return;

  const menuItemId = toStringOrNull(formData.get("menuItemId"));

  await db.inventory.create({
    data: {
      restaurantId,
      name: name.trim(),
      quantity: qty,
      unit: unit.trim(),
      minQuantity: minQty,
      menuItemId,
    },
  });

  revalidatePath("/[locale]/admin/inventory", "page");
}

// --- Log query ---

export async function fetchInventoryLogAction(
  inventoryId: string,
  days: number = 30,
): Promise<
  Array<{ id: string; change: number; reason: string; createdAt: Date }>
> {
  await requireAdmin();
  return getInventoryLog(inventoryId, days);
}

// --- Helpers ---

function toStringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
