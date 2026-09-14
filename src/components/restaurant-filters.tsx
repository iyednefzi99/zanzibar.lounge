"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CUISINES = [
  "Tunisienne",
  "Mediterraneenne",
  "Cafe",
  "Chicha",
  "Pizza",
  "Grillades",
  "Poisson",
  "Vegan",
  "Patisserie",
] as const;

const ZONES = ["terrasse", "salle", "salon"] as const;

type FilterState = {
  search: string;
  cuisine: string;
  price: string;
  zone: string;
  rating: string;
  openNow: string;
  sort: string;
};

function readFilters(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get("q") ?? "",
    cuisine: searchParams.get("cuisine") ?? "",
    price: searchParams.get("price") ?? "",
    zone: searchParams.get("zone") ?? "",
    rating: searchParams.get("rating") ?? "",
    openNow: searchParams.get("open") ?? "",
    sort: searchParams.get("sort") ?? "rating",
  };
}

export function RestaurantFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = readFilters(searchParams);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, startTransition],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push("?", { scroll: false });
    });
  }, [router, startTransition]);

  const hasActiveFilters =
    filters.cuisine ||
    filters.price ||
    filters.zone ||
    filters.rating ||
    filters.openNow;

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Filtres
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-lagoon underline underline-offset-4 hover:text-brass"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Cuisine */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim">
          Cuisine
        </label>
        <select
          value={filters.cuisine}
          onChange={(e) => updateFilter("cuisine", e.target.value)}
          className="mt-2 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2.5 text-sm text-shell transition-colors focus:border-brass"
        >
          <option value="">Toutes</option>
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Prix */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim">
          Budget
        </label>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() =>
                updateFilter("price", filters.price === String(level) ? "" : String(level))
              }
              aria-pressed={filters.price === String(level)}
              className={`flex-1 rounded-lg border py-2 font-mono text-sm transition-colors ${
                filters.price === String(level)
                  ? "border-brass bg-brass text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {"$".repeat(level)}
            </button>
          ))}
        </div>
      </div>

      {/* Zone */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim">
          Zone
        </label>
        <div className="mt-2 space-y-1.5">
          {ZONES.map((zone) => (
            <label
              key={zone}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-shell-dim transition-colors hover:text-shell"
            >
              <input
                type="checkbox"
                checked={filters.zone === zone}
                onChange={() =>
                  updateFilter("zone", filters.zone === zone ? "" : zone)
                }
                className="size-3.5 rounded border-shell/30 bg-deep/60 accent-lagoon"
              />
              <span className="capitalize">{zone}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Note minimum */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim">
          Note minimum
        </label>
        <div className="mt-2 flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                updateFilter("rating", filters.rating === String(star) ? "" : String(star))
              }
              aria-label={`${star} etoile${star > 1 ? "s" : ""} et plus`}
              className={`text-xl transition-colors ${
                Number(filters.rating) >= star
                  ? "text-brass"
                  : "text-shell/20 hover:text-brass/50"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Ouvert maintenant */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.openNow === "1"}
            onChange={() =>
              updateFilter("open", filters.openNow === "1" ? "" : "1")
            }
            className="size-3.5 rounded border-shell/30 bg-deep/60 accent-lagoon"
          />
          <span className="text-sm text-shell-dim transition-colors hover:text-shell">
            Ouvert maintenant
          </span>
        </label>
      </div>

      {/* Tri */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim">
          Trier par
        </label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="mt-2 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2.5 text-sm text-shell transition-colors focus:border-brass"
        >
          <option value="rating">Meilleure note</option>
          <option value="name">Nom A-Z</option>
          <option value="newest">Plus recent</option>
        </select>
      </div>

      {isPending && (
        <div className="flex justify-center py-2">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-brass border-t-transparent" />
        </div>
      )}
    </aside>
  );
}
