"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createCategory,
  createMenuItem,
  reorderItems,
  toggleItemAvailability,
  updateCategory,
  updateMenuItem,
  type CategoryData,
  type MenuItemData,
} from "@/lib/menu-manager";
import { getDefaultRestaurantId } from "@/lib/restaurant";

// --- Catégories ---

export async function createCategoryAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const data: CategoryData = {
    name: name.trim(),
    description: toStringOrUndefined(formData.get("description")),
    icon: toStringOrUndefined(formData.get("icon")),
    sortOrder: toInt(formData.get("sortOrder")),
  };

  await createCategory(restaurantId, data);
  revalidatePath("/[locale]/admin/menu", "page");
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string") return;

  const data: Partial<CategoryData> = {};
  const name = formData.get("name");
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (formData.has("description"))
    data.description = toStringOrUndefined(formData.get("description"));
  if (formData.has("icon"))
    data.icon = toStringOrUndefined(formData.get("icon"));
  if (formData.has("sortOrder"))
    data.sortOrder = toInt(formData.get("sortOrder"));
  if (formData.has("active"))
    data.active = formData.get("active") === "true";

  await updateCategory(categoryId, data);
  revalidatePath("/[locale]/admin/menu", "page");
}

// --- Articles ---

export async function createMenuItemAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const name = formData.get("name");
  const price = formData.get("price");
  if (typeof name !== "string" || !name.trim()) return;
  if (typeof price !== "string") return;

  const data: MenuItemData = {
    name: name.trim(),
    description: toStringOrUndefined(formData.get("description")),
    price: Math.round(parseFloat(price) * 1000),
    category: toStringOrNull(formData.get("category")) ?? "general",
    categoryId: toStringOrUndefined(formData.get("categoryId")),
    imageUrl: toStringOrUndefined(formData.get("imageUrl")),
    allergens: toStringArray(formData.get("allergens")),
    calories: toIntNullable(formData.get("calories")),
    preparationTime: toIntNullable(formData.get("preparationTime")),
    seasonal: formData.get("seasonal") === "true",
  };

  await createMenuItem(restaurantId, data);
  revalidatePath("/[locale]/admin/menu", "page");
}

export async function updateMenuItemAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const itemId = formData.get("itemId");
  if (typeof itemId !== "string") return;

  const data: Partial<MenuItemData> = {};
  const name = formData.get("name");
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (formData.has("description"))
    data.description = toStringOrUndefined(formData.get("description"));
  if (formData.has("price")) {
    const price = formData.get("price");
    if (typeof price === "string") data.price = Math.round(parseFloat(price) * 1000);
  }
  if (formData.has("category"))
    data.category = toStringOrNull(formData.get("category")) ?? "general";
  if (formData.has("categoryId"))
    data.categoryId = toStringOrUndefined(formData.get("categoryId"));
  if (formData.has("imageUrl"))
    data.imageUrl = toStringOrUndefined(formData.get("imageUrl"));
  if (formData.has("allergens"))
    data.allergens = toStringArray(formData.get("allergens"));
  if (formData.has("calories"))
    data.calories = toIntNullable(formData.get("calories"));
  if (formData.has("preparationTime"))
    data.preparationTime = toIntNullable(formData.get("preparationTime"));
  if (formData.has("seasonal"))
    data.seasonal = formData.get("seasonal") === "true";

  await updateMenuItem(itemId, data);
  revalidatePath("/[locale]/admin/menu", "page");
}

export async function toggleAvailabilityAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const itemId = formData.get("itemId");
  if (typeof itemId !== "string") return;

  await toggleItemAvailability(itemId);
  revalidatePath("/[locale]/admin/menu", "page");
}

export async function reorderItemsAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const categoryId = formData.get("categoryId");
  const itemIdsRaw = formData.get("itemIds");
  if (typeof categoryId !== "string") return;
  if (typeof itemIdsRaw !== "string") return;

  const itemIds = itemIdsRaw.split(",").filter(Boolean);
  if (itemIds.length === 0) return;

  await reorderItems(categoryId, itemIds);
  revalidatePath("/[locale]/admin/menu", "page");
}

// --- Helpers ---

function toStringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringOrUndefined(
  value: FormDataEntryValue | null,
): string | undefined {
  return toStringOrNull(value) ?? undefined;
}

function toInt(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

function toIntNullable(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

function toStringArray(
  value: FormDataEntryValue | null,
): string[] | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
