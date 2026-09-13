import { currency, menu } from "@/content/menu";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * La carte.
 *
 * Prix alignés à droite en chiffres tabulaires : c'est ce qu'on lit d'abord sur
 * une carte, et une colonne qui ondule fait douter du reste.
 */
export function MenuList({
  locale,
  dictionary,
  categories = menu,
}: {
  locale: Locale;
  dictionary: Dictionary;
  categories?: typeof menu;
}) {
  return (
    <div className="space-y-16">
      {categories.map((category) => (
        // `scroll-mt` garde le titre sous l'en-tête collant quand on
        // arrive par une ancre du rail de catégories.
        <section
          key={category.id}
          id={category.id}
          className="on-scroll scroll-mt-28"
        >
          <header>
            <h2 className="font-display text-3xl text-shell sm:text-4xl">
              {category.name[locale]}
            </h2>
            {category.note && (
              <p className="mt-1.5 text-sm text-shell-dim">
                {category.note[locale]}
              </p>
            )}
          </header>

          <ul className="mt-6 divide-y divide-shell/10">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline gap-4 py-3.5 first:pt-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-shell">{item.name[locale]}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-shell-dim">
                      {item.description[locale]}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-brass/40 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-brass"
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
  );
}
