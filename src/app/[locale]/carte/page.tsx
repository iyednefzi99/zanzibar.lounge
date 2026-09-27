import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { currency, menu } from "@/content/menu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = await getDictionary(locale);
  return { title: dictionary.menu.title };
}

export default async function CartePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        as="h1"
        eyebrow={dictionary.menu.lead}
        title={dictionary.menu.title}
        subtitle={`Prices in Tunisian Dinars, service included`}
      />

      {/* Category jump links */}
      <nav className="mt-8 flex flex-wrap justify-center gap-2">
        {menu.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="rounded-full border border-shell/20 px-4 py-2 text-sm text-shell-dim transition-all hover:border-brass hover:text-brass"
          >
            {cat.name[typedLocale]}
          </a>
        ))}
      </nav>

      <div className="mt-14 space-y-20">
        {menu.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="scroll-mt-28"
          >
            <header>
              <h2 className="font-display text-3xl text-shell sm:text-4xl">
                {category.name[typedLocale]}
              </h2>
              {category.note && (
                <p className="mt-1.5 text-sm italic text-shell-dim">
                  {category.note[typedLocale]}
                </p>
              )}
              <div className="brass-rule mt-4 max-w-12" />
            </header>

            <ul className="mt-6 space-y-1">
              {category.items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-baseline gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-shell/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <p className="text-shell">{item.name[typedLocale]}</p>
                      <span className="hidden flex-1 border-b border-dotted border-shell/15 sm:block" />
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-shell-dim">
                        {item.description[typedLocale]}
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
                    className="shrink-0 font-mono text-sm tabular-nums text-brass"
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

      <div className="brass-rule mt-20" />
    </div>
  );
}
