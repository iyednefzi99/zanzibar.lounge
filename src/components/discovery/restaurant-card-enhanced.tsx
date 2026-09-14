"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  name: string;
  slug: string;
  address: string | null;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  cuisineTypes?: string[];
  priceRange?: number;
  coverImage?: string | null;
  featured?: boolean;
};

export function RestaurantCardEnhanced({
  name,
  slug,
  address,
  isOpen,
  rating,
  reviewCount,
  cuisineTypes = [],
  priceRange = 2,
  coverImage,
  featured,
}: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/r/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-shell/10 bg-deep/60 transition-all hover:border-brass/40 hover:shadow-lg hover:shadow-brass/5"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-deep">
        {coverImage && !imgError ? (
          <img
            src={coverImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-deep to-deep/80">
            <span className="text-4xl opacity-30">
              {name.charAt(0)}
            </span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] backdrop-blur-sm ${
              isOpen
                ? "bg-lagoon/20 text-lagoon"
                : "bg-coral/20 text-coral"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-1.5 rounded-full ${isOpen ? "bg-lagoon" : "bg-coral"}`}
            />
            {isOpen ? "Ouvert" : "Fermé"}
          </span>
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brass/20 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brass backdrop-blur-sm">
              ★ Populaire
            </span>
          )}
        </div>
        {/* Price */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center rounded-full bg-deep/60 px-2.5 py-0.5 font-mono text-xs text-shell backdrop-blur-sm">
            {"$".repeat(priceRange)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-shell transition-colors group-hover:text-brass">
            {name}
          </h3>
          {rating > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 text-sm text-brass" dir="ltr">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813 1.134.561 1.531-.38l3.898-3.46 4.753.381c.833.067 1.171-1.107.536-1.651l-3.62-3.102-1.106-4.637c-.194-.813-1.134-.561-1.531-.38L10.868 2.884Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        {address && (
          <address className="mt-2 text-sm not-italic text-shell-dim line-clamp-1">
            {address}
          </address>
        )}

        {cuisineTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cuisineTypes.slice(0, 3).map((c) => (
              <span
                key={c}
                className="inline-block rounded-full bg-shell/5 px-2.5 py-0.5 text-xs text-shell-dim"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {reviewCount > 0 ? (
            <span className="text-sm text-shell-dim">
              {reviewCount} avis
            </span>
          ) : (
            <span className="text-sm text-shell-dim/60">Pas encore d&apos;avis</span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brass transition-colors group-hover:gap-2.5">
            Réserver
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
