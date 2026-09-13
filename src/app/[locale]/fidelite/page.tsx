import { notFound } from "next/navigation";

import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { POINTS, TIERS } from "@/lib/loyalty";
import { LoyaltyCardSection } from "./loyalty-card-section";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <header>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {locale === "fr" ? "Programme fidélité" : locale === "ar" ? "برنامج الولاء" : "Loyalty program"}
        </h1>
        <p className="mt-4 max-w-xl text-shell-dim">
          {locale === "ar"
            ? "accumulate نقاط واحصل على خصومات"
            : locale === "en"
              ? "Earn points and get discounts on every visit."
              : "Cumulez des points et obtenez des réductions sur chaque visite."}
        </p>
      </header>

      <Studs className="mt-10" />

      {/* Règles */}
      <section className="mt-10 grid gap-6 sm:grid-cols-3">
        <RuleCard
          emoji="🍽️"
          title={locale === "fr" ? "Réservation" : locale === "ar" ? "حجز" : "Booking"}
          body={
            locale === "fr"
              ? `${POINTS.RESERVATION} point par couvert`
              : locale === "ar"
                ? `${POINTS.RESERVATION} نقطة لكل مقعد`
                : `${POINTS.RESERVATION} point per seat`
          }
        />
        <RuleCard
          emoji="⭐"
          title={locale === "fr" ? "Avis" : locale === "ar" ? "تقييم" : "Review"}
          body={`${POINTS.REVIEW} ${locale === "fr" ? "points" : locale === "ar" ? "نقاط" : "points"}`}
        />
        <RuleCard
          emoji="🤝"
          title={locale === "fr" ? "Parrainage" : locale === "ar" ? "إحالة" : "Referral"}
          body={`${POINTS.REFERRAL} ${locale === "fr" ? "points" : locale === "ar" ? "نقاط" : "points"}`}
        />
      </section>

      {/* Paliers */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {locale === "fr" ? "Paliers" : locale === "ar" ? "المستويات" : "Tiers"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(["bronze", "silver", "gold"] as const).map((tier) => {
            const config = TIERS[tier];
            return (
              <div
                key={tier}
                className="rounded-xl border border-shell/10 bg-deep/40 p-4"
              >
                <p className="font-mono text-sm uppercase tracking-widest text-brass">
                  {tier === "bronze" ? "Bronze" : tier === "silver" ? "Argent" : "Or"}
                </p>
                <p className="mt-2 font-mono text-2xl tabular-nums text-shell">
                  {config.min}+ pts
                </p>
                <p className="mt-1 text-sm text-shell-dim">
                  {config.discount > 0
                    ? `${config.discount}% ${locale === "fr" ? "de réduction" : locale === "ar" ? "خصم" : "discount"}`
                    : locale === "fr"
                      ? "Base"
                      : locale === "ar"
                        ? "الأساس"
                        : "Base"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <Studs className="mt-10" />

      {/* Carte de fidélité */}
      <LoyaltyCardSection locale={locale} />
    </div>
  );
}

function RuleCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-shell/10 bg-deep/40 p-4 text-center">
      <p className="text-3xl">{emoji}</p>
      <p className="mt-2 font-medium text-shell">{title}</p>
      <p className="mt-1 text-sm text-shell-dim">{body}</p>
    </div>
  );
}
