"use client";

import { useState } from "react";
import Image from "next/image";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
};

type MenuDisplayProps = {
  items: MenuItem[];
  dictionary: {
    priceOfDay: string;
  };
};

export function MenuDisplay({ items, dictionary }: MenuDisplayProps) {
  const categories = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category ?? "general";
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const categoryKeys = Object.keys(categories);
  const [activeCategory, setActiveCategory] = useState(
    categoryKeys[0] ?? "general",
  );

  const activeItems = categories[activeCategory] ?? [];

  return (
    <div>
      {/* Onglets de categories */}
      {categoryKeys.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                activeCategory === cat
                  ? "border-brass bg-brass text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grille des items */}
      <div className="grid gap-4 sm:grid-cols-2">
        {activeItems.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-xl border border-shell/10 bg-deep/40 p-4 transition-colors hover:border-brass/30"
          >
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={64}
                height={64}
                className="size-16 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-shell">{item.name}</h4>
                <span
                  className="shrink-0 font-mono text-sm tabular-nums text-brass"
                  dir="ltr"
                >
                  {item.price === 0
                    ? dictionary.priceOfDay
                    : `${item.price.toFixed(item.price % 1 ? 1 : 0)} TND`}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-shell-dim">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeItems.length === 0 && (
        <p className="py-8 text-center text-shell-dim">
          Aucun article dans cette categorie.
        </p>
      )}
    </div>
  );
}
