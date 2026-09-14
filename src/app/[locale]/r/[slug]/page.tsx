import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingWidget } from "@/components/booking-widget";
import { MenuDisplay } from "@/components/menu-display";
import { ReviewList } from "@/components/review-list";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { getReviewStats, getApprovedReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const;

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

function getTodayISO(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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

  const typedLocale: Locale = locale;
  const dictionary = await getDictionary(typedLocale);

  const restaurant = await db.restaurant.findUnique({
    where: { slug, active: true },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      },
      tables: {
        where: { active: true },
        select: { zone: true },
      },
    },
  });

  if (!restaurant) notFound();

  const reviews = await getApprovedReviews(50);
  const stats = await getReviewStats();
  const isOpen = isOpenNow(restaurant.timezone ?? site.timezone);
  const todayISO = getTodayISO(restaurant.timezone ?? site.timezone);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const menuItems = restaurant.menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price / 1000,
    category: item.category ?? "general",
    imageUrl: item.imageUrl,
  }));

  return (
    <>
      {/* JSON-LD */}
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
              stats.count > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: stats.average,
                    reviewCount: stats.count,
                    bestRating: 5,
                    worstRating: 1,
                  }
                : undefined,
            openingHoursSpecification: site.hours.map((h) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][h.day],
              opens: h.open,
              closes: h.close,
            })),
            menu: menuItems.length > 0 ? `${baseUrl}/${locale}/r/${slug}` : undefined,
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-deep/60">
        <div className="mx-auto max-w-4xl px-5 pt-16 pb-12 sm:px-8">
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
              {isOpen ? "Ouvert" : "Ferme"}
            </span>
          </div>

          {/* Infos rapides */}
          <div className="reveal reveal-1 mt-5 flex flex-wrap items-center gap-5 text-sm text-shell-dim">
            {stats.count > 0 && (
              <span className="flex items-center gap-1.5 text-brass" dir="ltr">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813 1.134.561 1.531-.38l3.898-3.46 4.753.381c.833.067 1.171-1.107.536-1.651l-3.62-3.102-1.106-4.637c-.194-.813-1.134-.561-1.531-.38L10.868 2.884Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">{stats.average.toFixed(1)}</span>
                <span>({stats.count} avis)</span>
              </span>
            )}
            {restaurant.address && (
              <address className="not-italic">{restaurant.address}</address>
            )}
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                className="hover:text-brass"
                dir="ltr"
              >
                {formatPhone(restaurant.phone.replace(/\s/g, ""))}
              </a>
            )}
          </div>
        </div>
      </section>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        {/* Informations pratiques */}
        <section className="grid gap-8 sm:grid-cols-3">
          {restaurant.address && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
                Adresse
              </h2>
              <address className="mt-3 text-sm text-shell not-italic">
                {restaurant.address}
              </address>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${site.address.lat},${site.address.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-sm text-lagoon underline underline-offset-4 hover:text-brass"
              >
                Ouvrir dans Maps
              </a>
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
                    <span className="text-shell-dim">{DAY_NAMES[day]}</span>
                    <span className="tabular-nums text-shell" dir="ltr">
                      {dayHours
                        ? `${dayHours.open} – ${dayHours.close.replace("26:00", "02:00")}`
                        : "Ferme"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              Contact
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {restaurant.phone && (
                <li>
                  <a
                    href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                    className="text-shell hover:text-brass"
                    dir="ltr"
                  >
                    {formatPhone(restaurant.phone.replace(/\s/g, ""))}
                  </a>
                </li>
              )}
              {site.social.instagram && (
                <li>
                  <a
                    href={site.social.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-shell-dim hover:text-brass"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {site.social.facebook && (
                <li>
                  <a
                    href={site.social.facebook}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-shell-dim hover:text-brass"
                  >
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </section>

        <Studs className="mt-10" />

        {/* Menu */}
        {menuItems.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-3xl text-shell sm:text-4xl">La carte</h2>
            <p className="mt-2 text-sm text-shell-dim">Prix en dinars, service compris.</p>
            <div className="mt-6">
              <MenuDisplay
                items={menuItems}
                dictionary={{
                  priceOfDay: dictionary.menu.priceOfDay,
                }}
              />
            </div>
          </section>
        )}

        <Studs className="mt-10" />

        {/* Avis */}
        <section className="mt-10">
          <h2 className="font-display text-3xl text-shell sm:text-4xl">
            Avis de nos clients
          </h2>
          <div className="mt-6">
            <ReviewList
              reviews={reviews}
              average={stats.average}
              count={stats.count}
              distribution={stats.distribution}
            />
          </div>
        </section>

        <Studs className="mt-10" />

        {/* Widget de reservation */}
        <section className="mt-10">
          <BookingWidget
            todayISO={todayISO}
            dictionary={{
              title: dictionary.booking.title,
              name: dictionary.booking.fields.name,
              phone: dictionary.booking.fields.phone,
              date: dictionary.booking.fields.date,
              time: dictionary.booking.fields.time,
              partySize: dictionary.booking.fields.partySize,
              submit: dictionary.booking.submit,
              submitting: dictionary.booking.submitting,
              success: {
                title: dictionary.booking.success.title,
                body: dictionary.booking.success.body,
              },
              errors: {
                name: dictionary.booking.errors.name,
                phone: dictionary.booking.errors.phone,
                time: dictionary.booking.errors.time,
                generic: dictionary.booking.errors.generic,
              },
            }}
          />
        </section>
      </div>
    </>
  );
}
