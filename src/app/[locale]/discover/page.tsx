import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantFilters } from "@/components/restaurant-filters";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type DiscoverSearchParams = {
  q?: string;
  cuisine?: string;
  price?: string;
  zone?: string;
  rating?: string;
  open?: string;
  sort?: string;
  page?: string;
};

function isOpenNow(tz: string): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const minutes = hour * 60 + minute;
  const weekday = now.getUTCDay();

  const hours = site.hours.find((h) => h.day === weekday);
  if (!hours) return false;

  const openMin = parseInt(hours.open, 10) * 60;
  const closeStr = hours.close.replace("26:00", "26");
  const closeMin = parseInt(closeStr, 10) * 60;

  return minutes >= openMin && minutes < closeMin;
}

function getReviewStats(reservations: Array<{ reviews: Array<{ rating: number }> }>) {
  const reviews = reservations.flatMap((res) => res.reviews);
  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((s, rv) => s + rv.rating, 0) / count) * 10) / 10
      : 0;
  return { count, average };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.discover?.title ?? "Decouvrir",
    description:
      dictionary.discover?.description ??
      "Trouvez le Zanzibar Lounge le plus proche de vous.",
    openGraph: {
      title: dictionary.discover?.title ?? "Decouvrir",
      description:
        dictionary.discover?.description ??
        "Trouvez le Zanzibar Lounge le plus proche de vous.",
      type: "website",
      locale,
      siteName: site.name,
    },
  };
}

export default async function DiscoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale: Locale = locale;
  const dictionary = await getDictionary(typedLocale);
  const sp = await searchParams;

  const q = sp.q?.trim().toLowerCase() ?? "";
  const cuisine = sp.cuisine ?? "";
  const price = sp.price ? Number(sp.price) : 0;
  const zone = sp.zone ?? "";
  const minRating = sp.rating ? Number(sp.rating) : 0;
  const openNow = sp.open === "1";
  const sort = sp.sort ?? "rating";
  const page = Math.max(1, Number(sp.page) ?? 1);

  const restaurants = await db.restaurant.findMany({
    where: {
      active: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      reservations: {
        where: { status: "COMPLETED" },
        include: {
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
        },
      },
      menuItems: {
        where: { available: true },
        select: { category: true, price: true },
      },
      tables: {
        where: { active: true },
        select: { zone: true },
      },
    },
  });

  let filtered = restaurants.map((r) => {
    const stats = getReviewStats(r.reservations);
    const isOpen = isOpenNow(r.timezone ?? site.timezone);

    const uniqueZones = new Set(r.tables.map((t) => t.zone.toLowerCase()));
    const uniqueCuisines = new Set(
      r.menuItems.map((m) => m.category).filter(Boolean),
    );

    const avgPrice =
      r.menuItems.length > 0
        ? r.menuItems.reduce((s, m) => s + m.price, 0) / r.menuItems.length / 1000
        : 0;

    const priceLevel = avgPrice < 10 ? 1 : avgPrice < 20 ? 2 : avgPrice < 30 ? 3 : 4;

    return {
      name: r.name,
      slug: r.slug,
      address: r.address,
      isOpen,
      rating: stats.average,
      reviewCount: stats.count,
      zones: uniqueZones,
      cuisines: uniqueCuisines,
      priceLevel,
    };
  });

  if (cuisine) {
    filtered = filtered.filter((r) =>
      r.cuisines.has(cuisine.toLowerCase()),
    );
  }

  if (price > 0) {
    filtered = filtered.filter((r) => r.priceLevel === price);
  }

  if (zone) {
    filtered = filtered.filter((r) => r.zones.has(zone.toLowerCase()));
  }

  if (minRating > 0) {
    filtered = filtered.filter((r) => r.rating >= minRating);
  }

  if (openNow) {
    filtered = filtered.filter((r) => r.isOpen);
  }

  switch (sort) {
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
      filtered.reverse();
      break;
    case "rating":
    default:
      filtered.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep/60">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8">
          <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
            {dictionary.discover?.title ?? "Decouvrir nos restaurants"}
          </h1>
          <p className="reveal reveal-1 mt-4 max-w-xl text-shell-dim">
            {dictionary.discover?.description ??
              "Trouvez le Zanzibar Lounge le plus proche de vous."}
          </p>

          {/* Barre de recherche */}
          <form
            action=""
            method="get"
            className="reveal reveal-2 mt-8 flex max-w-lg items-center gap-2"
          >
            <input type="hidden" name="sort" value={sort} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher un restaurant..."
              className="min-h-12 flex-1 rounded-full border border-shell/20 bg-deep/80 px-5 text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass/60 px-5 text-brass transition-colors hover:bg-brass/10"
              aria-label="Rechercher"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <Studs className="reveal reveal-3" />

      {/* Contenu principal */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          {/* Sidebar filtres — visible sur desktop, repliable sur mobile */}
          <div className="mb-8 lg:mb-0">
            <details className="group lg:hidden">
              <summary className="flex cursor-pointer items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-brass [&::marker]:text-shell-dim">
                <span>Filtres</span>
                {(cuisine || price || zone || minRating || openNow) && (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-brass text-[0.6rem] font-bold text-deep">
                    {[cuisine, price, zone, minRating, openNow].filter(Boolean).length}
                  </span>
                )}
              </summary>
              <div className="mt-4 rounded-xl border border-shell/10 bg-deep/40 p-5">
                <Suspense>
                  <RestaurantFilters />
                </Suspense>
              </div>
            </details>
            <div className="hidden lg:block lg:sticky lg:top-24">
              <Suspense>
                <RestaurantFilters />
              </Suspense>
            </div>
          </div>

          {/* Grille des restaurants */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-xs text-shell-dim">
                {total} restaurant{total > 1 ? "s" : ""}
              </p>
            </div>

            {paged.length === 0 ? (
              <div className="rounded-xl border border-shell/10 bg-deep/40 py-16 text-center">
                <p className="text-shell-dim">Aucun restaurant ne correspond a vos criteres.</p>
                <a
                  href={`?`}
                  className="mt-4 inline-block text-sm text-lagoon underline underline-offset-4 hover:text-brass"
                >
                  Reinitialiser les filtres
                </a>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.slug}
                    name={restaurant.name}
                    slug={restaurant.slug}
                    address={restaurant.address}
                    isOpen={restaurant.isOpen}
                    rating={restaurant.rating}
                    reviewCount={restaurant.reviewCount}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
                {currentPage > 1 && (
                  <a
                    href={`?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(cuisine ? { cuisine } : {}),
                      ...(price ? { price: String(price) } : {}),
                      ...(zone ? { zone } : {}),
                      ...(minRating ? { rating: String(minRating) } : {}),
                      ...(openNow ? { open: "1" } : {}),
                      ...(sort !== "rating" ? { sort } : {}),
                      page: String(currentPage - 1),
                    }).toString()}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
                    aria-label="Page precedente"
                  >
                    &lsaquo;
                  </a>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(cuisine ? { cuisine } : {}),
                      ...(price ? { price: String(price) } : {}),
                      ...(zone ? { zone } : {}),
                      ...(minRating ? { rating: String(minRating) } : {}),
                      ...(openNow ? { open: "1" } : {}),
                      ...(sort !== "rating" ? { sort } : {}),
                      page: String(p),
                    }).toString()}`}
                    className={`inline-flex size-10 items-center justify-center rounded-full font-mono text-sm transition-colors ${
                      p === currentPage
                        ? "bg-brass text-deep"
                        : "border border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
                    }`}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </a>
                ))}
                {currentPage < totalPages && (
                  <a
                    href={`?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(cuisine ? { cuisine } : {}),
                      ...(price ? { price: String(price) } : {}),
                      ...(zone ? { zone } : {}),
                      ...(minRating ? { rating: String(minRating) } : {}),
                      ...(openNow ? { open: "1" } : {}),
                      ...(sort !== "rating" ? { sort } : {}),
                      page: String(currentPage + 1),
                    }).toString()}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
                    aria-label="Page suivante"
                  >
                    &rsaquo;
                  </a>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
