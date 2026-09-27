import Link from "next/link";

import { SectionHeader } from "@/components/ui/section-header";
import { currency, menu } from "@/content/menu";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function MenuSection({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const categories = menu.slice(0, 2);

  return (
    <section className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        eyebrow={dictionary.menu.lead}
        title={dictionary.menu.title}
      />

      <div className="mt-12 space-y-16">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="scroll-mt-28"
          >
            <header>
              <h3 className="font-display text-3xl text-shell sm:text-4xl">
                {category.name[locale]}
              </h3>
              {category.note && (
                <p className="mt-1.5 text-sm italic text-shell-dim">
                  {category.note[locale]}
                </p>
              )}
            </header>

            <ul className="mt-6 space-y-1">
              {category.items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-baseline gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-shell/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-shell">{item.name[locale]}</p>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-shell-dim">
                        {item.description[locale]}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <p className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-brass/30 bg-brass/5 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-brass"
                          >
                            {dictionary.menu.tags[tag]}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  <span
                    className="shrink-0 font-mono text-sm tabular-nums text-brass transition-colors group-hover:text-brass"
                    dir="ltr"
                  >
                    {item.price === null
                      ? dictionary.menu.priceOfDay
                      : `${item.price.toFixed(item.price % 1 ? 1 : 0)} ${currency}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href={`/${locale}/carte`}
          className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-shell/25 px-8 text-base text-shell transition-all duration-300 hover:border-brass hover:bg-brass/5 hover:text-brass"
        >
          {dictionary.hero.menu}
          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      <div className="brass-rule mt-16" />
    </section>
  );
}
