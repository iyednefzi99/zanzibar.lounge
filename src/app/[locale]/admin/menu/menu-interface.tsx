"use client";

import { useState, useTransition } from "react";

import {
  createCategoryAction,
  createMenuItemAction,
  toggleAvailabilityAction,
  updateCategoryAction,
  updateMenuItemAction,
} from "./actions";

type FullMenuItem = {
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

type FullCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  icon: string | null;
  items: FullMenuItem[];
};

type Props = {
  initialCategories: FullCategory[];
};

export function MenuInterface({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(
    initialCategories[0]?.id ?? "__all__",
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCategory = categories.find((c) => c.id === activeTab);
  const displayItems =
    activeTab === "__all__"
      ? categories.flatMap((c) => c.items)
      : activeCategory?.items ?? [];

  function formatPrice(millimes: number): string {
    return `${(millimes / 1000).toFixed(3)} DT`;
  }

  function handleToggle(itemId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", itemId);
      await toggleAvailabilityAction(fd);
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? { ...item, available: !item.available }
              : item,
          ),
        })),
      );
    });
  }

  return (
    <div className="mt-8">
      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
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
        <button
          onClick={() => setShowNewCategory(true)}
          className="rounded-full border border-dashed border-brass/40 px-4 py-2 font-mono text-xs text-brass transition-colors hover:bg-brass/10"
        >
          + Catégorie
        </button>
      </div>

      {/* New category form */}
      {showNewCategory && (
        <NewCategoryForm
          onSave={(fd) => {
            startTransition(async () => {
              await createCategoryAction(fd);
              setShowNewCategory(false);
            });
          }}
          onCancel={() => setShowNewCategory(false)}
        />
      )}

      {/* Category edit form */}
      {editingCategory && (
        <EditCategoryForm
          category={categories.find((c) => c.id === editingCategory)!}
          onSave={(fd) => {
            startTransition(async () => {
              fd.set("categoryId", editingCategory);
              await updateCategoryAction(fd);
              setEditingCategory(null);
            });
          }}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      {/* Items toolbar */}
      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-xs text-shell-dim">
          {displayItems.length} article{displayItems.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          {activeTab !== "__all__" && activeCategory && (
            <button
              onClick={() => setEditingCategory(activeCategory.id)}
              className="rounded-full border border-shell/20 px-3 py-1.5 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass"
            >
              Modifier la catégorie
            </button>
          )}
          <button
            onClick={() => setShowNewItem(true)}
            className="rounded-full border border-brass/40 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
          >
            + Article
          </button>
        </div>
      </div>

      {/* New item form */}
      {showNewItem && (
        <NewItemForm
          categories={categories}
          defaultCategoryId={activeTab !== "__all__" ? activeTab : undefined}
          onSave={(fd) => {
            startTransition(async () => {
              await createMenuItemAction(fd);
              setShowNewItem(false);
            });
          }}
          onCancel={() => setShowNewItem(false)}
        />
      )}

      {/* Items grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayItems.map((item) =>
          editingItem === item.id ? (
            <EditItemForm
              key={item.id}
              item={item}
              categories={categories}
              onSave={(fd) => {
                startTransition(async () => {
                  fd.set("itemId", item.id);
                  await updateMenuItemAction(fd);
                  setEditingItem(null);
                });
              }}
              onCancel={() => setEditingItem(null)}
            />
          ) : (
            <ItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id)}
              onEdit={() => setEditingItem(item.id)}
              formatPrice={formatPrice}
              isPending={isPending}
            />
          ),
        )}
      </div>

      {displayItems.length === 0 && !showNewItem && (
        <p className="py-12 text-center text-sm text-shell-dim">
          Aucun article dans cette catégorie.
        </p>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onToggle,
  onEdit,
  formatPrice,
  isPending,
}: {
  item: FullMenuItem;
  onToggle: () => void;
  onEdit: () => void;
  formatPrice: (n: number) => string;
  isPending: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        item.available
          ? "border-shell/10 bg-deep/40 hover:border-brass/30"
          : "border-shell/5 bg-deep/20 opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-shell">{item.name}</h4>
          {item.description && (
            <p className="mt-1 text-xs text-shell-dim line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-sm tabular-nums text-brass">
          {formatPrice(item.price)}
        </span>
      </div>

      {/* Allergen tags */}
      {item.allergens.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.allergens.map((a) => (
            <span
              key={a}
              className="rounded-full border border-coral/30 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase text-coral/80"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Metadata row */}
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[0.6rem] text-shell-dim">
        {item.calories != null && <span>{item.calories} kcal</span>}
        {item.preparationTime != null && (
          <span>{item.preparationTime} min</span>
        )}
        {item.seasonal && (
          <span className="text-brass">Saisonnier</span>
        )}
        {item.category && <span>{item.category}</span>}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onToggle}
          disabled={isPending}
          className={`flex-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            item.available
              ? "border-green-500/40 text-green-400 hover:bg-green-500/10"
              : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
          }`}
        >
          {item.available ? "Disponible" : "Indisponible"}
        </button>
        <button
          onClick={onEdit}
          className="rounded-full border border-shell/20 px-3 py-1.5 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}

function NewCategoryForm({
  onSave,
  onCancel,
}: {
  onSave: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
        Nouvelle catégorie
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nom"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="icon"
          placeholder="Icône (emoji)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="description"
          placeholder="Description"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="sortOrder"
          type="number"
          placeholder="Ordre"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          Créer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-shell/20 px-4 py-1.5 text-xs text-shell-dim transition-colors hover:text-shell"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function EditCategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category: FullCategory;
  onSave: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
        Modifier « {category.name} »
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          defaultValue={category.name}
          required
          placeholder="Nom"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="icon"
          defaultValue={category.icon ?? ""}
          placeholder="Icône (emoji)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="description"
          defaultValue={category.description ?? ""}
          placeholder="Description"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="sortOrder"
          type="number"
          defaultValue={category.sortOrder}
          placeholder="Ordre"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <select
          name="active"
          defaultValue={String(category.active)}
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-shell/20 px-4 py-1.5 text-xs text-shell-dim transition-colors hover:text-shell"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function NewItemForm({
  categories,
  defaultCategoryId,
  onSave,
  onCancel,
}: {
  categories: FullCategory[];
  defaultCategoryId?: string;
  onSave: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
        Nouvel article
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nom"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="price"
          type="number"
          step="0.001"
          required
          placeholder="Prix (DT)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="description"
          placeholder="Description"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <select
          name="categoryId"
          defaultValue={defaultCategoryId ?? ""}
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="">Sans catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon && `${cat.icon} `}
              {cat.name}
            </option>
          ))}
        </select>
        <input
          name="category"
          placeholder="Catégorie texte"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="imageUrl"
          placeholder="URL image"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="allergens"
          placeholder="Allergènes (séparés par virgules)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="calories"
          type="number"
          placeholder="Calories (kcal)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="preparationTime"
          type="number"
          placeholder="Temps prép. (min)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <select
          name="seasonal"
          defaultValue="false"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="false">Normal</option>
          <option value="true">Saisonnier</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          Créer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-shell/20 px-4 py-1.5 text-xs text-shell-dim transition-colors hover:text-shell"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function EditItemForm({
  item,
  categories,
  onSave,
  onCancel,
}: {
  item: FullMenuItem;
  categories: FullCategory[];
  onSave: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brass/30 bg-deep/60 p-4"
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
        Modifier « {item.name} »
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          defaultValue={item.name}
          required
          placeholder="Nom"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="price"
          type="number"
          step="0.001"
          defaultValue={(item.price / 1000).toFixed(3)}
          required
          placeholder="Prix (DT)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="description"
          defaultValue={item.description ?? ""}
          placeholder="Description"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <select
          name="categoryId"
          defaultValue={item.categoryId ?? ""}
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="">Sans catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon && `${cat.icon} `}
              {cat.name}
            </option>
          ))}
        </select>
        <input
          name="category"
          defaultValue={item.category}
          placeholder="Catégorie texte"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="imageUrl"
          defaultValue={item.imageUrl ?? ""}
          placeholder="URL image"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="allergens"
          defaultValue={item.allergens.join(", ")}
          placeholder="Allergènes (séparés par virgules)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none sm:col-span-2"
        />
        <input
          name="calories"
          type="number"
          defaultValue={item.calories ?? ""}
          placeholder="Calories (kcal)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="preparationTime"
          type="number"
          defaultValue={item.preparationTime ?? ""}
          placeholder="Temps prép. (min)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <select
          name="seasonal"
          defaultValue={String(item.seasonal)}
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="false">Normal</option>
          <option value="true">Saisonnier</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-shell/20 px-4 py-1.5 text-xs text-shell-dim transition-colors hover:text-shell"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
