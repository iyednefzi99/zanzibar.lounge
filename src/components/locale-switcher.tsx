"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isLocale,
  locales,
  localeLabel,
  localeShortLabel,
  type Locale,
} from "@/i18n/config";

/**
 * Trois langues, trois liens. Pas de menu déroulant : à trois entrées, il
 * ajoute un clic et cache l'information.
 */
export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={swapLocale(pathname, locale)}
            hrefLang={locale}
            lang={locale}
            aria-current={active ? "true" : undefined}
            title={localeLabel[locale]}
            className={`px-2 py-1 font-mono text-xs tracking-widest transition-colors ${
              active
                ? "text-brass"
                : "text-shell-dim hover:text-shell"
            }`}
          >
            {localeShortLabel[locale]}
          </Link>
        );
      })}
    </nav>
  );
}

/** /fr/carte → /ar/carte, en conservant la page où l'on se trouve. */
function swapLocale(pathname: string, next: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = next;
    return segments.join("/") || `/${next}`;
  }
  return `/${next}`;
}
