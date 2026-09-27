"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  locales,
  localeLabel,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} data-testid="locale-switcher" className="flex items-center gap-1">
      {locales.map((locale) => {
        const active = locale === current;
        const href = pathname.replace(`/${current}`, `/${locale}`);

        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            className={cn(
              "inline-flex min-h-8 items-center rounded px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wider transition-colors",
              active
                ? "text-brass"
                : "text-shell-dim/50 hover:text-shell-dim",
            )}
            aria-label={localeLabel[locale]}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
