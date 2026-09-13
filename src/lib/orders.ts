import { OrderStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { minutesToHM } from "@/lib/time";

/**
 * Commandes en ligne (à emporter).
 *
 * Le client compose son panier, choisit l'heure de récupération,
 * et le staff voit les commandes arriver en temps réel.
 */

// --- Types ---

export type MenuItemSummary = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
};

export type CartItem = {
  menuItemId: string;
  quantity: number;
};

export type OrderSummary = {
  id: string;
  reference: string;
  guestName: string | null;
  guestPhone: string;
  status: OrderStatus;
  pickupTime: string | null;
  total: number;
  itemCount: number;
  notes: string | null;
  createdAt: Date;
};

export type OrderDetail = OrderSummary & {
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type OrderError =
  | { code: "GUEST_NOT_FOUND" }
  | { code: "CART_EMPTY" }
  | { code: "ITEM_UNAVAILABLE"; name: string }
  | { code: "NOT_FOUND" }
  | { code: "ALREADY_COMPLETED" };

export type OrderResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: OrderError };

// --- Menu ---

/**
 * Articles du menu disponibles, regroupés par catégorie.
 */
export async function getMenu(
  restaurantId?: string,
): Promise<Record<string, MenuItemSummary[]>> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const items = await db.menuItem.findMany({
    where: { restaurantId: rid, available: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const grouped: Record<string, MenuItemSummary[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
    });
  }
  return grouped;
}

// --- Création ---

/**
 * Créer une commande à partir du panier client.
 */
export async function createOrder(
  phone: string,
  cart: CartItem[],
  pickupMinutes: number | null,
  notes: string | null,
  locale: string,
  restaurantId?: string,
): Promise<OrderResult<OrderDetail>> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { ok: false, error: { code: "GUEST_NOT_FOUND" } };
  }

  if (cart.length === 0) {
    return { ok: false, error: { code: "CART_EMPTY" } };
  }

  const rid = restaurantId ?? await getDefaultRestaurantId();

  // Vérifier la disponibilité de chaque article
  const menuItems = await db.menuItem.findMany({
    where: { restaurantId: rid, id: { in: cart.map((c) => c.menuItemId) } },
  });

  const menuMap = new Map(menuItems.map((m) => [m.id, m]));

  for (const cartItem of cart) {
    const item = menuMap.get(cartItem.menuItemId);
    if (!item || !item.available) {
      return {
        ok: false,
        error: { code: "ITEM_UNAVAILABLE", name: item?.name ?? "Inconnu" },
      };
    }
  }

  // Calculer le total
  let total = 0;
  for (const cartItem of cart) {
    const item = menuMap.get(cartItem.menuItemId);
    if (item) total += item.price * cartItem.quantity;
  }

  // Upsert guest
  const guest = await db.guest.upsert({
    where: { phone: normalized },
    create: { phone: normalized, locale },
    update: { locale },
  });

  // Générer la référence
  const reference = await generateOrderReference();

  // Créer la commande avec les articles
  const order = await db.order.create({
    data: {
      restaurantId: rid,
      reference,
      guestId: guest.id,
      pickupMinutes,
      notes,
      total,
      items: {
        create: cart.map((cartItem) => {
          const item = menuMap.get(cartItem.menuItemId)!;
          return {
            menuItemId: cartItem.menuItemId,
            quantity: cartItem.quantity,
            unitPrice: item.price,
          };
        }),
      },
    },
    include: {
      items: { include: { menuItem: true } },
    },
  });

  return {
    ok: true,
    value: {
      id: order.id,
      reference: order.reference,
      guestName: guest.name,
      guestPhone: guest.phone,
      status: order.status,
      pickupTime: order.pickupMinutes != null ? minutesToHM(order.pickupMinutes) : null,
      total: order.total,
      itemCount: order.items.length,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map((oi) => ({
        id: oi.id,
        name: oi.menuItem.name,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice,
      })),
    },
  };
}

// --- Lectures ---

/**
 * Commandes ouvertes pour le back-office.
 */
export async function getOpenOrders(
  restaurantId?: string,
): Promise<OrderSummary[]> {
  const rid = restaurantId ?? await getDefaultRestaurantId();
  const orders = await db.order.findMany({
    where: {
      restaurantId: rid,
      status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
    },
    include: {
      guest: { select: { name: true, phone: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    guestName: o.guest.name,
    guestPhone: o.guest.phone,
    status: o.status,
    pickupTime: o.pickupMinutes != null ? minutesToHM(o.pickupMinutes) : null,
    total: o.total,
    itemCount: o.items.length,
    notes: o.notes,
    createdAt: o.createdAt,
  }));
}

/**
 * Détail d'une commande.
 */
export async function getOrderDetail(
  orderId: string,
): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      guest: { select: { name: true, phone: true } },
      items: { include: { menuItem: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    reference: order.reference,
    guestName: order.guest.name,
    guestPhone: order.guest.phone,
    status: order.status,
    pickupTime: order.pickupMinutes != null ? minutesToHM(order.pickupMinutes) : null,
    total: order.total,
    itemCount: order.items.length,
    notes: order.notes,
    createdAt: order.createdAt,
    items: order.items.map((oi) => ({
      id:oi.id,
      name: oi.menuItem.name,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
    })),
  };
}

/**
 * Commandes d'un client (par téléphone).
 */
export async function getGuestOrders(
  phone: string,
): Promise<OrderSummary[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) return [];

  const orders = await db.order.findMany({
    where: { guestId: guest.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    guestName: guest.name,
    guestPhone: guest.phone,
    status: o.status,
    pickupTime: o.pickupMinutes != null ? minutesToHM(o.pickupMinutes) : null,
    total: o.total,
    itemCount: o.items.length,
    notes: o.notes,
    createdAt: o.createdAt,
  }));
}

// --- Transitions ---

/**
 * Mettre à jour le statut d'une commande.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<OrderResult<OrderSummary>> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { guest: true, items: true },
  });

  if (!order) {
    return { ok: false, error: { code: "NOT_FOUND" } };
  }

  if (
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED
  ) {
    return { ok: false, error: { code: "ALREADY_COMPLETED" } };
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status },
    include: { guest: true, items: true },
  });

  return {
    ok: true,
    value: {
      id: updated.id,
      reference: updated.reference,
      guestName: updated.guest.name,
      guestPhone: updated.guest.phone,
      status: updated.status,
      pickupTime: updated.pickupMinutes != null ? minutesToHM(updated.pickupMinutes) : null,
      total: updated.total,
      itemCount: updated.items.length,
      notes: updated.notes,
      createdAt: updated.createdAt,
    },
  };
}

/**
 * Annuler une commande.
 */
export async function cancelOrder(
  orderId: string,
): Promise<OrderResult<OrderSummary>> {
  return updateOrderStatus(orderId, OrderStatus.CANCELLED);
}

// --- Helpers ---

async function generateOrderReference(): Promise<string> {
  // Format: CMD-XXXX (4 caractères aléatoires)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let reference: string;
  let exists: boolean;

  do {
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    reference = `CMD-${suffix}`;
    const existing = await db.order.findUnique({ where: { reference } });
    exists = !!existing;
  } while (exists);

  return reference;
}
