"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { OpenBadge } from "@/components/ui/open-badge";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/carte`, label: dictionary.nav.menu },
    { href: `/${locale}/galerie`, label: dictionary.nav.gallery },
    { href: `/${locale}#infos`, label: dictionary.nav.info },
  ];

  const isActive = (href: string) => {
    if (href.endsWith("#infos")) return pathname === `/${locale}`;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="hidden border-b border-shell/8 bg-deep/90 backdrop-blur-sm sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-1.5 sm:px-8">
          <a
            href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-shell-dim/70 transition-colors hover:text-shell-dim"
            dir="ltr"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {formatPhone(site.contact.phone)}
          </a>
          <div className="flex items-center gap-3">
            <OpenBadge dictionary={dictionary} />
            <LocaleSwitcher current={locale} label={dictionary.nav.language} />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="glass-subtle">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
          <Link href={`/${locale}`} className="group inline-flex min-h-11 items-center">
            <span className="font-display text-lg leading-none tracking-tight text-shell transition-colors group-hover:text-brass sm:text-xl">
              {site.name}
            </span>
          </Link>

          <nav className="ms-auto hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                  isActive(link.href) ? "text-shell" : "text-shell-dim hover:text-shell",
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-1 -bottom-1 h-0.5 rounded-full bg-brass" />
                )}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2 sm:ms-0">
            <div className="sm:hidden">
              <LocaleSwitcher current={locale} label={dictionary.nav.language} />
            </div>
            <Button href={`/${locale}/reserver`} size="sm">
              {dictionary.nav.book}
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg className="h-5 w-5 text-shell" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-menu-overlay fixed inset-0 top-0 z-50 bg-deep/98 backdrop-blur-xl sm:hidden">
          <div className="flex h-full flex-col items-center justify-center">
            <button
              type="button"
              className="absolute right-5 top-5 inline-flex min-h-11 min-w-11 items-center justify-center"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            >
              <svg className="h-6 w-6 text-shell" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <nav className="flex flex-col items-center gap-6">
              {links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "mobile-menu-link font-display text-3xl",
                    isActive(link.href) ? "text-brass" : "text-shell",
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={`/${locale}/reserver`}
                className="mobile-menu-link mt-4 inline-flex min-h-12 items-center justify-center rounded-sm bg-brass px-8 font-medium text-deep"
                style={{ animationDelay: `${links.length * 80}ms` }}
                onClick={() => setMobileOpen(false)}
              >
                {dictionary.nav.book}
              </Link>
            </nav>

            <div
              className="mobile-menu-link absolute bottom-12 flex items-center gap-4"
              style={{ animationDelay: `${(links.length + 1) * 80}ms` }}
            >
              <a
                href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
                className="inline-flex min-h-11 items-center gap-2 font-mono text-sm text-shell-dim"
                dir="ltr"
              >
                {formatPhone(site.contact.phone)}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
