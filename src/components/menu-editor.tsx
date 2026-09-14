"use client";

import { useState, useRef, useCallback } from "react";

type MenuItem = {
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
};

type MenuCategory = {
  id: string;
  name: string;
  icon: string | null;
  items: MenuItem[];
};

type Props = {
  categories: MenuCategory[];
  onReorder: (categoryId: string, itemIds: string[]) => void;
  onToggleAvailability: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
};

export function MenuEditor({
  categories,
  onReorder,
  onToggleAvailability,
  onEditItem,
}: Props) {
  const [activeTab, setActiveTab] = useState(
    categories[0]?.id ?? "__all__",
  );
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const activeCategory = categories.find((c) => c.id === activeTab);
  const displayItems =
    activeTab === "__all__"
      ? categories.flatMap((c) => c.items)
      : activeCategory?.items ?? [];

  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      setDraggedItem(itemId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", itemId);
    },
    [],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent, itemId: string) => {
      e.preventDefault();
      dragCounter.current++;
      setDragOverItem(itemId);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragOverItem(null);
      }
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOverItem(null);

      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;
      if (activeTab === "__all__") return;

      const catId = activeTab;
      const items = displayItems.map((i) => i.id);
      const fromIdx = items.indexOf(sourceId);
      const toIdx = items.indexOf(targetId);

      if (fromIdx === -1 || toIdx === -1) return;

      const reordered = [...items];
      reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, sourceId);

      onReorder(catId, reordered);
    },
    [activeTab, displayItems, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
    dragCounter.current = 0;
  }, []);

  function formatPrice(millimes: number): string {
    return `${(millimes / 1000).toFixed(3)} DT`;
  }

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "__all__"}
          onClick={() => setActiveTab("__all__")}
          className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
            activeTab === "__all__"
              ? "border-brass bg-brass text-deep"
              : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
          }`}
        >
          Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeTab === cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
              activeTab === cat.id
                ? "border-brass bg-brass text-deep"
                : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
            }`}
          >
            {cat.icon && `${cat.icon} `}
            {cat.name}
            <span className="ml-1 text-[0.6rem] opacity-60">
              ({cat.items.length})
            </span>
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="mt-4 space-y-2">
        {displayItems.map((item) => {
          const isDragged = draggedItem === item.id;
          const isDragOver = dragOverItem === item.id;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnter={(e) => handleDragEnter(e, item.id)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onEditItem(item.id)}
              className={`flex cursor-grab items-center gap-4 rounded-xl border p-4 transition-all active:cursor-grabbing ${
                isDragged
                  ? "opacity-40 border-brass/40"
                  : isDragOver
                    ? "border-brass border-2 bg-brass/5"
                    : "border-shell/10 bg-deep/40 hover:border-brass/30"
              }`}
            >
              {/* Drag handle */}
              <div className="flex flex-col gap-0.5 text-shell-dim/40">
                <span className="block h-0.5 w-3 rounded bg-current" />
                <span className="block h-0.5 w-3 rounded bg-current" />
                <span className="block h-0.5 w-3 rounded bg-current" />
              </div>

              {/* Item info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h4 className="truncate text-shell">{item.name}</h4>
                  {item.seasonal && (
                    <span className="shrink-0 font-mono text-[0.55rem] text-brass">
                      SAISONNIER
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 truncate text-xs text-shell-dim">
                    {item.description}
                  </p>
                )}

                {/* Allergen tags */}
                {item.allergens.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-coral/30 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase text-coral/70"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-1 flex gap-2 font-mono text-[0.55rem] text-shell-dim">
                  {item.calories != null && <span>{item.calories} kcal</span>}
                  {item.preparationTime != null && (
                    <span>{item.preparationTime} min</span>
                  )}
                  <span>{item.category}</span>
                </div>
              </div>

              {/* Price */}
              <span className="shrink-0 font-mono text-sm tabular-nums text-brass">
                {formatPrice(item.price)}
              </span>

              {/* Availability toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAvailability(item.id);
                }}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.6rem] font-mono uppercase tracking-widest transition-colors ${
                  item.available
                    ? "border-green-500/40 text-green-400 hover:bg-green-500/10"
                    : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
                }`}
              >
                {item.available ? "Actif" : "Inactif"}
              </button>
            </div>
          );
        })}
      </div>

      {displayItems.length === 0 && (
        <p className="py-12 text-center text-sm text-shell-dim">
          Aucun article. Glissez-déposez des éléments ici après en avoir ajouté.
        </p>
      )}
    </div>
  );
}
