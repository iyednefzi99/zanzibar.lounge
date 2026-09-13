import { notFound } from "next/navigation";

import { MenuList } from "@/components/menu-list";
import { Studs } from "@/components/studs";
import { menu } from "@/content/menu";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    <>
      <header className="mx-auto max-w-4xl px-5 pt-16 pb-10 sm:px-8">
        <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dictionary.menu.title}
        </h1>
        <p className="reveal reveal-1 mt-4 text-shell-dim">
          {dictionary.menu.lead}
        </p>

        {/* L'index des catégories. La carte est longue : on donne l'entrée
            directe plutôt que de faire défiler à l'aveugle. Ce n'est pas un
            ornement, c'est la table des matières. */}
        <nav
          aria-label={dictionary.menu.jumpTo}
          className="reveal reveal-2 mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-shell-dim/80">
            {dictionary.menu.jumpTo}
          </span>
          {menu.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="font-mono text-xs uppercase tracking-[0.14em] text-shell-dim underline-offset-4 transition-colors hover:text-brass hover:underline"
            >
              {category.name[locale]}
            </a>
          ))}
        </nav>
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <MenuList locale={locale} dictionary={dictionary} />
      </div>
    </>
  );
}
