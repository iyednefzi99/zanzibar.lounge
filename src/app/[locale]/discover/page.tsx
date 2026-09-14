import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DiscoveryFilters } from "@/components/discovery/discovery-filters";
import { DiscoveryGrid } from "@/components/discovery/discovery-grid";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { searchRestaurants } from "@/lib/discovery";

export const dynamic = "force-dynamic";

type DiscoverSearchParams = {
  q?: string;
  cuisine?: string;
  price?: string;
  rating?: string;
  open?: string;
  sort?: string;
  page?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.discover?.title ?? "Découvrir",
    description:
      dictionary.discover?.description ??
      "Trouvez le restaurant parfait près de chez vous.",
    openGraph: {
      title: dictionary.discover?.title ?? "Découvrir",
      description:
        dictionary.discover?.description ??
        "Trouvez le restaurant parfait près de chez vous.",
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

  const result = await searchRestaurants({
    query: sp.q?.trim() || undefined,
    cuisine: sp.cuisine || undefined,
    priceRange: sp.price ? Number(sp.price) : undefined,
    minRating: sp.rating ? Number(sp.rating) : undefined,
    isOpenNow: sp.open === "1",
    sortBy: (sp.sort as "rating" | "price" | "name" | "popularity" | "newest") ?? "rating",
    page: sp.page ? Number(sp.page) : 1,
    limit: 12,
  });

  const { restaurants, total, page, totalPages } = result;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep/60">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8">
          <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
            {dictionary.discover?.title ?? "Découvrir nos restaurants"}
          </h1>
          <p className="reveal reveal-1 mt-4 max-w-xl text-shell-dim">
            {dictionary.discover?.description ??
              "Trouvez le restaurant parfait près de chez vous."}
          </p>

          {/* Barre de recherche */}
          <form
            action=""
            method="get"
            className="reveal reveal-2 mt-8 flex max-w-lg items-center gap-2"
          >
            <input type="hidden" name="sort" value={sp.sort ?? "rating"} />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder={dictionary.discover?.search ?? "Rechercher un restaurant..."}
              className="min-h-12 flex-1 rounded-full border border-shell/20 bg-deep/80 px-5 text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass/60 px-5 text-brass transition-colors hover:bg-brass/10"
              aria-label="Rechercher"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
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
          {/* Sidebar filtres */}
          <div className="mb-8 lg:mb-0">
            <details className="group lg:hidden">
              <summary className="flex cursor-pointer items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-brass [&::marker]:text-shell-dim">
                <span>Filtres</span>
                {(sp.cuisine || sp.price || sp.rating || sp.open) && (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-brass text-[0.6rem] font-bold text-deep">
                    {[sp.cuisine, sp.price, sp.rating, sp.open].filter(Boolean).length}
                  </span>
                )}
              </summary>
              <div className="mt-4 rounded-xl border border-shell/10 bg-deep/40 p-5">
                <Suspense>
                  <DiscoveryFilters />
                </Suspense>
              </div>
            </details>
            <div className="hidden lg:block lg:sticky lg:top-24">
              <Suspense>
                <DiscoveryFilters />
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

            <DiscoveryGrid
              restaurants={restaurants}
              emptyMessage={dictionary.discover?.empty ?? "Aucun restaurant trouvé."}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
                {page > 1 && (
                  <a
                    href={`?${new URLSearchParams({
                      ...(sp.q ? { q: sp.q } : {}),
                      ...(sp.cuisine ? { cuisine: sp.cuisine } : {}),
                      ...(sp.price ? { price: sp.price } : {}),
                      ...(sp.rating ? { rating: sp.rating } : {}),
                      ...(sp.open ? { open: sp.open } : {}),
                      ...(sp.sort && sp.sort !== "rating" ? { sort: sp.sort } : {}),
                      page: String(page - 1),
                    }).toString()}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
                    aria-label={dictionary.discover?.pagination?.previous ?? "Précédent"}
                  >
                    &lsaquo;
                  </a>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({
                      ...(sp.q ? { q: sp.q } : {}),
                      ...(sp.cuisine ? { cuisine: sp.cuisine } : {}),
                      ...(sp.price ? { price: sp.price } : {}),
                      ...(sp.rating ? { rating: sp.rating } : {}),
                      ...(sp.open ? { open: sp.open } : {}),
                      ...(sp.sort && sp.sort !== "rating" ? { sort: sp.sort } : {}),
                      page: String(p),
                    }).toString()}`}
                    className={`inline-flex size-10 items-center justify-center rounded-full font-mono text-sm transition-colors ${
                      p === page
                        ? "bg-brass text-deep"
                        : "border border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
                    }`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </a>
                ))}
                {page < totalPages && (
                  <a
                    href={`?${new URLSearchParams({
                      ...(sp.q ? { q: sp.q } : {}),
                      ...(sp.cuisine ? { cuisine: sp.cuisine } : {}),
                      ...(sp.price ? { price: sp.price } : {}),
                      ...(sp.rating ? { rating: sp.rating } : {}),
                      ...(sp.open ? { open: sp.open } : {}),
                      ...(sp.sort && sp.sort !== "rating" ? { sort: sp.sort } : {}),
                      page: String(page + 1),
                    }).toString()}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
                    aria-label={dictionary.discover?.pagination?.next ?? "Suivant"}
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
