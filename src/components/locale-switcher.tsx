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
            // 44 px de haut pour le pouce ; 32 px de large en dessous de 640 px, sinon
            // les trois langues plus le bouton dépassent de 2,5 px sur un écran
            // de 320 px (mesuré). La hauteur est ce qui compte pour viser.
            className={`inline-flex min-h-11 min-w-8 items-center justify-center font-mono text-xs tracking-widest transition-colors sm:min-w-9 ${
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
