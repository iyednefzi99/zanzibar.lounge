import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuList } from "@/components/menu-list";
import { OpenBadge } from "@/components/open-badge";
import { Studs } from "@/components/studs";
import { menu } from "@/content/menu";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { formatPhone, normalizePhone } from "@/lib/phone";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const whatsapp = normalizePhone(site.contact.whatsapp);

  return (
    <>
      {/* ------------------------------------------------------------------
          L'accroche : l'arche d'une porte de Stone Town, la devise du lieu,
          et l'état d'ouissance en direct — la question qu'on se pose vraiment
          avant de sortir.
          ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.22em] text-brass">
              {dictionary.hero.eyebrow}
            </p>

            <h1 className="reveal reveal-2 mt-5 font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.95] tracking-[-0.02em] text-shell">
              {dictionary.hero.title}
            </h1>

            <p className="reveal reveal-3 mt-6 max-w-xl text-lg leading-relaxed text-shell-dim">
              {dictionary.hero.lead}
            </p>

            <div className="reveal reveal-4 mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/reserver`}
                className="rounded-full bg-brass px-7 py-3.5 font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100"
              >
                {dictionary.hero.book}
              </Link>

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.slice(1)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-lagoon/60 px-7 py-3.5 font-medium text-lagoon transition-colors hover:bg-lagoon/10"
                >
                  {dictionary.hero.bookWhatsapp}
                </a>
              )}

              <Link
                href={`/${locale}/carte`}
                className="px-2 py-3.5 text-shell-dim underline underline-offset-4 hover:text-shell"
              >
                {dictionary.hero.menu}
              </Link>
            </div>

            <OpenBadge
              dictionary={dictionary}
              className="reveal reveal-4 mt-8 inline-flex"
            />
          </div>

          {/* L'arche. Sans photographie du lieu, on ne met pas d'image
              d'illustration : on dessine la porte elle-même. */}
          <div className="reveal reveal-3 relative mx-auto w-full max-w-sm">
            <div className="arch relative aspect-[3/4] w-full border border-brass/50 bg-gradient-to-b from-deep via-night to-clove/40">
              <div className="arch absolute inset-3 border border-brass/25" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-8 text-center">
                <span className="font-display text-5xl text-brass/90">ز</span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-shell-dim">
                  {site.address.city}
                </span>
              </div>
              <Studs className="absolute inset-x-8 top-1/3" />
              <Studs className="absolute inset-x-8 top-1/2" />
            </div>
          </div>
        </div>

        <Studs className="reveal reveal-4" />
      </section>

      {/* --- Ce qu'on fait, et les trois façons de s'installer --- */}
      <section className="mx-auto max-w-6xl px-5 py-section sm:px-8">
        <div className="on-scroll grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-4xl text-shell sm:text-5xl">
            {dictionary.about.title}
          </h2>
          <p className="text-lg leading-relaxed text-shell-dim">
            {dictionary.about.body}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {(["terrasse", "salle", "salon"] as const).map((zoneId) => {
            const zone = dictionary.about.zones[zoneId];
            const capacity = site.zones.find((z) => z.id === zoneId)?.capacity;
            return (
              <article
                key={zoneId}
                className="on-scroll arch border border-shell/12 bg-deep/40 p-7 pt-10"
              >
                <h3 className="font-display text-2xl text-brass">{zone.name}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-shell-dim">
                  {zone.body}
                </p>
                {capacity && (
                  <p className="mt-4 font-mono text-xs tracking-widest text-shell-dim/70">
                    {capacity} {"couverts"}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <Studs className="on-scroll" />

      {/* --- Un aperçu de la carte, deux catégories --- */}
      <section className="mx-auto max-w-4xl px-5 py-section sm:px-8">
        <MenuList
          locale={locale}
          dictionary={dictionary}
          categories={menu.slice(0, 2)}
        />
        <Link
          href={`/${locale}/carte`}
          className="mt-12 inline-block rounded-full border border-shell/25 px-7 py-3 text-shell transition-colors hover:border-brass hover:text-brass"
        >
          {dictionary.hero.menu}
        </Link>
      </section>

      <Studs className="on-scroll" />

      {/* --- Infos pratiques --- */}
      <section id="infos" className="mx-auto max-w-6xl px-5 py-section sm:px-8">
        <h2 className="font-display text-4xl text-shell sm:text-5xl">
          {dictionary.info.title}
        </h2>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              {dictionary.info.address}
            </h3>
            <address className="mt-3 text-shell not-italic">
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
              <br />
              {site.address.region}
            </address>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${site.address.lat},${site.address.lng}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-sm text-lagoon underline underline-offset-4 hover:text-brass"
            >
              {dictionary.info.directions}
            </a>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              {dictionary.info.hours}
            </h3>
            <ul className="mt-3 space-y-1 font-mono text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const hours = site.hours.find((h) => h.day === day);
                return (
                  <li key={day} className="flex justify-between gap-6">
                    <span className="text-shell-dim">
                      {dictionary.days.short[day]}
                    </span>
                    <span className="tabular-nums text-shell" dir="ltr">
                      {hours
                        ? `${hours.open} – ${hours.close.replace("26:00", "02:00")}`
                        : dictionary.info.closed}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              {dictionary.info.contact}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
                  className="text-shell hover:text-brass"
                  dir="ltr"
                >
                  {formatPhone(site.contact.phone.replace(/\s/g, ""))}
                </a>
              </li>
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.slice(1)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-shell hover:text-brass"
                  >
                    {dictionary.info.whatsapp}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={site.social.tripadvisor}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-shell-dim hover:text-brass"
                >
                  {dictionary.info.reviews}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
