"use client";

import { useState, use } from "react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { currency, menu } from "@/content/menu";
import type { Locale } from "@/i18n/config";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CommanderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: { id: string; name: Record<Locale, string>; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name[locale as Locale], price: item.price, quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        as="h1"
        title="Order Online"
        subtitle="Browse our menu and order for pickup"
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Menu */}
        <div className="space-y-12">
          {menu.map((category) => (
            <section key={category.id}>
              <h3 className="font-display text-2xl text-shell">{category.name[locale as Locale]}</h3>
              <ul className="mt-4 space-y-2">
                {category.items.filter((item): item is typeof item & { price: number } => item.price !== null).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border border-shell/10 px-4 py-3 transition-colors hover:border-brass/30"
                  >
                    <div className="flex-1">
                      <p className="text-shell">{item.name[locale as Locale]}</p>
                      {item.description && (
                        <p className="mt-0.5 text-sm text-shell-dim">{item.description[locale as Locale]}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-brass" dir="ltr">
                      {item.price!.toFixed(item.price! % 1 ? 1 : 0)} {currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/30 text-brass transition-colors hover:bg-brass hover:text-deep"
                    >
                      +
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Cart sidebar */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display text-lg text-shell">Your Order</h3>
            {cart.length === 0 ? (
              <p className="mt-4 text-sm text-shell-dim">Your cart is empty</p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-shell">{item.name} x{item.quantity}</span>
                      <span className="font-mono text-brass">{(item.price * item.quantity).toFixed(1)} {currency}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-shell/20 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-shell">Total</span>
                    <span className="font-mono text-lg text-brass">{total.toFixed(1)} {currency}</span>
                  </div>
                </div>
                <Button className="mt-4 w-full">Order Now</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
