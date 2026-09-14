import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RestaurantCard } from "@/components/restaurant-card";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
      "Trouvez le Zanzibar Lounge le plus proche de vous.",
    openGraph: {
      title: dictionary.discover?.title ?? "Découvrir",
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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale: Locale = locale;
  const dictionary = await getDictionary(typedLocale);

  const restaurants = await db.restaurant.findMany({
    where: { active: true },
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
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const weekday = now.getUTCDay();

  const restaurantsWithStats = restaurants.map((r) => {
    const tz = r.timezone ?? site.timezone;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(now);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const minutes = hour * 60 + minute;

    const hours = site.hours.find((h) => h.day === weekday);
    const open =
      !!hours &&
      minutes >= parseInt(hours.open, 10) * 60 &&
      minutes <
        parseInt(hours.close.replace("26:00", "26"), 10) * 60;

    const reviews = r.reservations.flatMap((res) => res.reviews);
    const count = reviews.length;
    const average =
      count > 0
        ? Math.round(
            (reviews.reduce((s, rv) => s + rv.rating, 0) / count) * 10,
          ) / 10
        : 0;

    return {
      name: r.name,
      slug: r.slug,
      address: r.address,
      isOpen: open,
      rating: average,
      reviewCount: count,
    };
  });

  return (
    <>
      <header className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8">
        <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dictionary.discover?.title ?? "Découvrir nos restaurants"}
        </h1>
        <p className="reveal reveal-1 mt-4 max-w-xl text-shell-dim">
          {dictionary.discover?.description ??
            "Trouvez le Zanzibar Lounge le plus proche de vous."}
        </p>
      </header>

      <Studs className="reveal reveal-2" />

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        {restaurantsWithStats.length === 0 ? (
          <p className="text-center text-shell-dim">
            Aucun restaurant disponible pour le moment.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantsWithStats.map((restaurant) => (
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
      </section>
    </>
  );
}
