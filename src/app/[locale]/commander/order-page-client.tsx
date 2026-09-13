"use client";

import { useState } from "react";

import { CartPanel } from "./cart-panel";
import { MenuItemCard } from "./menu-item-card";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
};

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type Props = {
  locale: string;
  menu: Record<string, MenuItem[]>;
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  fr: { boisson: "Boissons", plat: "Plats", dessert: "Desserts", general: "Autres" },
  ar: { boisson: "مشروبات", plat: "أطباق", dessert: "حلويات", general: "أخرى" },
  en: { boisson: "Drinks", plat: "Mains", dessert: "Desserts", general: "Other" },
};

export function OrderPageClient({ locale, menu }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.menuItemId === menuItemId ? { ...c, quantity } : c,
      ),
    );
  }

  const labels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.fr;

  return (
    <div className="mt-8">
      {/* Panier flottant */}
      <CartPanel locale={locale} cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />

      {/* Menu par catégorie */}
      {Object.entries(menu).map(([category, items]) => (
        <section key={category} className="mt-10">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            {labels[category] ?? category}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  quantity={inCart?.quantity ?? 0}
                  onAdd={() => addToCart(item)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
