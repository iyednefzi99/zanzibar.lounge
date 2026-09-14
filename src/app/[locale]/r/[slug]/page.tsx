import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const restaurant = await db.restaurant.findUnique({
    where: { slug, active: true },
  });
  if (!restaurant) return {};

  const dictionary = await getDictionary(locale);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = `${restaurant.name} — ${site.name}`;
  const description =
    dictionary.discover?.description ??
    `${restaurant.name} — ${restaurant.address ?? site.address.city}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/r/${slug}`,
      languages: Object.fromEntries(
        ["fr", "ar", "en"].map((l) => [l, `/${l}/r/${slug}`]),
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      siteName: site.name,
      url: `${baseUrl}/${locale}/r/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  const restaurant = await db.restaurant.findUnique({
    where: { slug, active: true },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      },
      reservations: {
        where: { status: "COMPLETED" },
        include: {
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const reviews = restaurant.reservations.flatMap((res) => res.reviews);
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((s, rv) => s + rv.rating, 0) / reviewCount) * 10,
        ) / 10
      : 0;

  const now = new Date();
  const tz = restaurant.timezone ?? site.timezone;
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
  const isOpen =
    !!hours &&
    minutes >= parseInt(hours.open, 10) * 60 &&
    minutes <
      parseInt(hours.close.replace("26:00", "26"), 10) * 60;

  const groupedMenu = restaurant.menuItems.reduce<
    Record<string, typeof restaurant.menuItems>
  >((acc, item) => {
    const cat = item.category ?? "general";
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: restaurant.name,
            description: restaurant.address
              ? `${restaurant.name} — ${restaurant.address}`
              : restaurant.name,
            url: `${baseUrl}/${locale}/r/${slug}`,
            telephone: restaurant.phone,
            address: restaurant.address
              ? {
                  "@type": "PostalAddress",
                  streetAddress: restaurant.address,
                  addressLocality: site.address.city,
                  addressRegion: site.address.region,
                  addressCountry: "TN",
                }
              : undefined,
            priceRange: "$$",
            servesCuisine: ["Tunisian", "Mediterranean", "Cafe"],
            acceptsReservations: "True",
            aggregateRating:
              reviewCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: averageRating,
                    reviewCount,
                    bestRating: 5,
                    worstRating: 1,
                  }
                : undefined,
          }),
        }}
      />

      <header className="mx-auto max-w-4xl px-5 pt-16 sm:px-8">
        <div className="reveal flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
            {restaurant.name}
          </h1>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] ${
              isOpen
                ? "bg-lagoon/15 text-lagoon"
                : "bg-coral/15 text-coral"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-2 rounded-full ${
                isOpen ? "bg-lagoon" : "bg-coral"
              }`}
            />
            {isOpen ? "Ouvert" : "Fermé"}
          </span>
        </div>

        {reviewCount > 0 && (
          <p className="reveal reveal-1 mt-4 flex items-center gap-2 text-brass">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813 1.134.561 1.531-.38l3.898-3.46 4.753.381c.833.067 1.171-1.107.536-1.651l-3.62-3.102-1.106-4.637c-.194-.813-1.134-.561-1.531-.38L10.868 2.884Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-shell-dim">({reviewCount} avis)</span>
          </p>
        )}
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {restaurant.address && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
                Adresse
              </h2>
              <address className="mt-3 text-sm text-shell not-italic">
                {restaurant.address}
              </address>
            </div>
          )}

          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              Horaires
            </h2>
            <ul className="mt-3 space-y-1 font-mono text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const dayHours = site.hours.find((h) => h.day === day);
                return (
                  <li key={day} className="flex justify-between gap-6">
                    <span className="text-shell-dim">
                      {dictionary.days.short[day]}
                    </span>
                    <span className="tabular-nums text-shell" dir="ltr">
                      {dayHours
                        ? `${dayHours.open} – ${dayHours.close.replace("26:00", "02:00")}`
                        : dictionary.info.closed}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {restaurant.phone && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
                Contact
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                    className="text-shell hover:text-brass"
                    dir="ltr"
                  >
                    {formatPhone(restaurant.phone.replace(/\s/g, ""))}
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {Object.keys(groupedMenu).length > 0 && (
        <>
          <Studs />
          <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
            <h2 className="font-display text-3xl text-shell sm:text-4xl">
              La carte
            </h2>
            <p className="mt-2 text-sm text-shell-dim">
              Prix en dinars, service compris.
            </p>

            <div className="mt-8 space-y-10">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
                    {category}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-4 border-b border-shell/5 pb-3"
                      >
                        <div className="min-w-0">
                          <span className="text-shell">{item.name}</span>
                          {item.description && (
                            <span className="ml-2 text-sm text-shell-dim">
                              {item.description}
                            </span>
                          )}
                        </div>
                        <span
                          className="shrink-0 font-mono text-sm tabular-nums text-brass"
                          dir="ltr"
                        >
                          {(item.price / 1000).toFixed(3)} DT
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Studs />

      <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <Link
          href={`/${locale}/reserver?restaurant=${slug}`}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brass px-8 text-lg font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100"
        >
          Réserver une table
        </Link>
      </section>
    </>
  );
}
