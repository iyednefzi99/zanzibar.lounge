import { notFound } from "next/navigation";

import { MenuList } from "@/components/menu-list";
import { Studs } from "@/components/studs";
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
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <MenuList locale={locale} dictionary={dictionary} />
      </div>
    </>
  );
}
