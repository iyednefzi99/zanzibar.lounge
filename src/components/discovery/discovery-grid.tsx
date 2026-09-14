"use client";

import { RestaurantCardEnhanced } from "./restaurant-card-enhanced";
import type { RestaurantWithStats } from "@/lib/discovery";

type Props = {
  restaurants: RestaurantWithStats[];
  emptyMessage?: string;
};

export function DiscoveryGrid({ restaurants, emptyMessage }: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="rounded-xl border border-shell/10 bg-deep/40 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-shell/5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-8 text-shell-dim/40">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-shell-dim">
          {emptyMessage ?? "Aucun restaurant ne correspond à vos critères."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {restaurants.map((r) => (
        <RestaurantCardEnhanced
          key={r.slug}
          name={r.name}
          slug={r.slug}
          address={r.address}
          isOpen={r.isOpen}
          rating={r.rating}
          reviewCount={r.reviewCount}
          cuisineTypes={r.cuisineTypes}
          priceRange={r.priceRange}
          coverImage={r.coverImage}
          featured={r.featured}
        />
      ))}
    </div>
  );
}
