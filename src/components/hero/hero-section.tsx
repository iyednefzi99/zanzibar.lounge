import fs from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DoorClock } from "@/components/hero/door-clock";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { normalizePhone } from "@/lib/phone";

/**
 * HERO IMAGE SLOT
 * Drop a real photo at `public/images/hero.jpg` (landscape, ≥2400px wide)
 * and it replaces the placeholder composition automatically — no code change.
 * Recommended: warm interior/terrace shot with space on the left for the title.
 */
const HERO_IMAGE = "/images/hero.jpg";

function heroImageExists() {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "images", "hero.jpg"));
  } catch {
    return false;
  }
}

export async function HeroSection({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const whatsapp = normalizePhone(site.contact.whatsapp);
  const hasHeroImage = heroImageExists();

  return (
    <section className="relative isolate overflow-hidden bg-night grain">
      {/* Photo slot — renders only when public/images/hero.jpg exists */}
      {hasHeroImage && (
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Placeholder composition — charcoal & gold, retires when the photo lands */}
      {!hasHeroImage && (
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -top-40 end-[-15%] h-[70vh] w-[70vh] rounded-full bg-brass/12 blur-[130px]" />
          <div className="absolute bottom-[-20%] start-[-10%] h-[50vh] w-[50vh] rounded-full bg-lagoon/8 blur-[120px]" />
          <div className="absolute inset-y-0 start-[12%] w-px bg-gradient-to-b from-transparent via-brass/15 to-transparent" />
          <div className="absolute inset-y-0 end-[12%] w-px bg-gradient-to-b from-transparent via-brass/15 to-transparent" />
          <span className="absolute bottom-6 inset-x-0 select-none text-center font-display text-[22vw] leading-none tracking-[-0.04em] text-shell/[0.04]">
            {site.name}
          </span>
        </div>
      )}

      {/* Legibility scrim over photo (or tint over the composition) */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep/70 via-deep/35 to-deep" />

      <div className="relative z-10 mx-auto flex min-h-[88vh] flex-col items-center justify-center px-5 pt-24 pb-20 sm:px-8">
        {/* Eyebrow */}
        <div className="reveal reveal-1 mb-8 inline-flex items-center gap-2 rounded-sm border border-brass/40 bg-brass/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-brass">
            {dictionary.hero.eyebrow}
          </span>
        </div>

        {/* Title */}
        <h1 className="reveal reveal-2 max-w-4xl text-center font-display text-[clamp(2.75rem,8vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.02em] text-balance text-shell">
          {dictionary.hero.title}
        </h1>

        {/* Gold hairline */}
        <div className="reveal reveal-2 mt-7 h-px w-24 bg-gradient-to-r from-transparent via-brass to-transparent" />

        {/* Subtitle */}
        <p className="reveal reveal-3 mt-7 max-w-2xl text-center text-lg leading-relaxed text-shell-dim sm:text-xl">
          {dictionary.hero.lead}
        </p>

        {/* CTAs */}
        <div className="reveal reveal-4 mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button href={`/${locale}/reserver`} size="lg">
            {dictionary.hero.book}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Button>

          {whatsapp && (
            <Button
              href={`https://wa.me/${whatsapp.slice(1)}`}
              variant="secondary"
              size="lg"
            >
              {dictionary.hero.bookWhatsapp}
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </Button>
          )}
        </div>

        {/* Menu link */}
        <Link
          href={`/${locale}/carte`}
          className="reveal-4 mt-6 inline-flex items-center gap-1.5 text-sm text-shell-dim transition-colors duration-200 hover:text-brass"
        >
          {dictionary.hero.menu}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* DoorClock */}
        <div className="reveal-3 mt-12">
          <DoorClock dictionary={dictionary} className="w-48" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="scroll-indicator h-8 w-px bg-gradient-to-b from-brass/60 to-transparent" />
      </div>
    </section>
  );
}
