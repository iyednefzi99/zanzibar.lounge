import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { OpenBadge } from "@/components/open-badge";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const links = [
    { href: `/${locale}/carte`, label: dictionary.nav.menu },
    { href: `/${locale}/galerie`, label: dictionary.nav.gallery },
    { href: `/${locale}#infos`, label: dictionary.nav.info },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-shell/10 bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
        <Link
          href={`/${locale}`}
          className="font-display text-lg leading-none tracking-tight text-shell sm:text-xl"
        >
          {site.name}
        </Link>

        <OpenBadge dictionary={dictionary} className="hidden md:flex" />

        <nav className="ms-auto hidden items-center gap-6 text-sm sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-shell-dim transition-colors hover:text-shell"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 sm:ms-0">
          <LocaleSwitcher current={locale} label={dictionary.nav.language} />
          <Link
            href={`/${locale}/reserver`}
            className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100"
          >
            {dictionary.nav.book}
          </Link>
        </div>
      </div>
    </header>
  );
}
