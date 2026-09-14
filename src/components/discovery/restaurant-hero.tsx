"use client";

import { useState } from "react";

type Props = {
  name: string;
  address: string | null;
  phone: string | null;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  coverImage?: string | null;
  galleryImages?: string[];
  description?: string | null;
  cuisineTypes?: string[];
};

export function RestaurantHero({
  name,
  address,
  phone,
  rating,
  reviewCount,
  isOpen,
  coverImage,
  galleryImages = [],
  description,
  cuisineTypes = [],
}: Props) {
  const [imgError, setImgError] = useState(false);
  const allImages = coverImage ? [coverImage, ...galleryImages] : galleryImages;

  return (
    <section className="relative overflow-hidden bg-deep/60">
      {/* Hero image */}
      {allImages.length > 0 && (
        <div className="relative h-64 sm:h-80 overflow-hidden">
          {allImages[0] && !imgError ? (
            <img
              src={allImages[0]}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-deep to-deep/60">
              <span className="text-8xl opacity-20">{name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/40 to-transparent" />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-5 pt-8 pb-12 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none text-shell">
              {name}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-shell-dim">{description}</p>
            )}
          </div>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] ${
              isOpen
                ? "bg-lagoon/15 text-lagoon"
                : "bg-coral/15 text-coral"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-2 rounded-full ${isOpen ? "bg-lagoon" : "bg-coral"}`}
            />
            {isOpen ? "Ouvert" : "Fermé"}
          </span>
        </div>

        {/* Quick info */}
        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-shell-dim">
          {reviewCount > 0 && (
            <span className="flex items-center gap-1.5 text-brass" dir="ltr">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813 1.134.561 1.531-.38l3.898-3.46 4.753.381c.833.067 1.171-1.107.536-1.651l-3.62-3.102-1.106-4.637c-.194-.813-1.134-.561-1.531-.38L10.868 2.884Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span>({reviewCount} avis)</span>
            </span>
          )}
          {address && (
            <address className="not-italic">{address}</address>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hover:text-brass"
              dir="ltr"
            >
              {phone}
            </a>
          )}
        </div>

        {/* Cuisine tags */}
        {cuisineTypes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cuisineTypes.map((c) => (
              <span
                key={c}
                className="inline-block rounded-full bg-shell/5 px-3 py-1 text-xs text-shell-dim"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
