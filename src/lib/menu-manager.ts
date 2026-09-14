import { db } from "@/lib/db";

// --- Types ---

export type CategoryData = {
  name: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
  icon?: string;
};

export type MenuItemData = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  available?: boolean;
  sortOrder?: number;
  allergens?: string[];
  calories?: number;
  preparationTime?: number;
  seasonal?: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
};

export type FullMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
  allergens: string[];
  calories: number | null;
  preparationTime: number | null;
  seasonal: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  categoryId: string | null;
};

export type FullCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  icon: string | null;
  items: FullMenuItem[];
};

export type AllergenInfo = {
  itemId: string;
  itemName: string;
  allergens: string[];
};

// --- Queries ---

/**
 * Menu complet d'un restaurant avec catégories et articles.
 */
export async function getFullMenu(
  restaurantId: string,
): Promise<FullCategory[]> {
  const categories = await db.menuCategory.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    sortOrder: cat.sortOrder,
    active: cat.active,
    icon: cat.icon,
    items: cat.items.map(mapMenuItem),
  }));
}

/**
 * Articles spéciaux / saisonniers du jour.
 */
export async function getDailySpecials(
  restaurantId: string,
): Promise<FullMenuItem[]> {
  const now = new Date();
  const items = await db.menuItem.findMany({
    where: {
      restaurantId,
      seasonal: true,
      available: true,
      OR: [
        { availableFrom: null, availableUntil: null },
        { availableFrom: { lte: now }, availableUntil: { gte: now } },
        { availableFrom: { lte: now }, availableUntil: null },
        { availableFrom: null, availableUntil: { gte: now } },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return items.map(mapMenuItem);
}

/**
 * Infos allergènes d'un article.
 */
export async function checkAllergens(
  itemId: string,
): Promise<AllergenInfo | null> {
  const item = await db.menuItem.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, allergens: true },
  });

  if (!item) return null;

  return {
    itemId: item.id,
    itemName: item.name,
    allergens: item.allergens,
  };
}

// --- Mutations ---

/**
 * Créer une catégorie de menu.
 */
export async function createCategory(
  restaurantId: string,
  data: CategoryData,
): Promise<FullCategory> {
  const category = await db.menuCategory.create({
    data: {
      restaurantId,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      active: data.active ?? true,
      icon: data.icon,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    active: category.active,
    icon: category.icon,
    items: category.items.map(mapMenuItem),
  };
}

/**
 * Mettre à jour une catégorie.
 */
export async function updateCategory(
  categoryId: string,
  data: Partial<CategoryData>,
): Promise<FullCategory> {
  const category = await db.menuCategory.update({
    where: { id: categoryId },
    data,
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    active: category.active,
    icon: category.icon,
    items: category.items.map(mapMenuItem),
  };
}

/**
 * Créer un article du menu.
 */
export async function createMenuItem(
  restaurantId: string,
  data: MenuItemData,
): Promise<FullMenuItem> {
  const item = await db.menuItem.create({
    data: {
      restaurantId,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category ?? "general",
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      available: data.available ?? true,
      sortOrder: data.sortOrder ?? 0,
      allergens: data.allergens ?? [],
      calories: data.calories,
      preparationTime: data.preparationTime,
      seasonal: data.seasonal ?? false,
      availableFrom: data.availableFrom,
      availableUntil: data.availableUntil,
    },
  });

  return mapMenuItem(item);
}

/**
 * Mettre à jour un article du menu.
 */
export async function updateMenuItem(
  itemId: string,
  data: Partial<MenuItemData>,
): Promise<FullMenuItem> {
  const item = await db.menuItem.update({
    where: { id: itemId },
    data,
  });

  return mapMenuItem(item);
}

/**
 * Basculer la disponibilité d'un article.
 */
export async function toggleItemAvailability(
  itemId: string,
): Promise<FullMenuItem> {
  const current = await db.menuItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { available: true },
  });

  const item = await db.menuItem.update({
    where: { id: itemId },
    data: { available: !current.available },
  });

  return mapMenuItem(item);
}

/**
 * Réordonner les articles d'une catégorie.
 */
export async function reorderItems(
  categoryId: string,
  itemIds: string[],
): Promise<void> {
  await db.$transaction(
    itemIds.map((id, index) =>
      db.menuItem.update({
        where: { id },
        data: { sortOrder: index, categoryId },
      }),
    ),
  );
}

// --- Helpers ---

function mapMenuItem(
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
    available: boolean;
    sortOrder: number;
    allergens: string[];
    calories: number | null;
    preparationTime: number | null;
    seasonal: boolean;
    availableFrom: Date | null;
    availableUntil: Date | null;
    categoryId: string | null;
  },
): FullMenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    sortOrder: item.sortOrder,
    allergens: item.allergens,
    calories: item.calories,
    preparationTime: item.preparationTime,
    seasonal: item.seasonal,
    availableFrom: item.availableFrom,
    availableUntil: item.availableUntil,
    categoryId: item.categoryId,
  };
}
