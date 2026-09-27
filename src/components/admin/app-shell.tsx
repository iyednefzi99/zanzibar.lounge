"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/cn";

export type NavItem = { label: string; href: string };
export type NavGroup = { label?: string; items: NavItem[] };

function NavLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label ?? group.items[0]?.href}>
          {group.label && (
            <p className="mb-1.5 px-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/60">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center rounded-sm border-s-2 px-2.5 py-1.5 text-sm transition-colors duration-150",
                      active
                        ? "border-brass bg-brass/10 font-medium text-brass"
                        : "border-transparent text-shell-dim hover:bg-shell/5 hover:text-shell",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AppShell({
  brand,
  context,
  locale,
  groups,
  children,
  footer,
}: {
  brand: string;
  context: string;
  locale: string;
  groups: NavGroup[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname.endsWith("/login")) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-dvh bg-deep">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-shell/10 bg-night lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-shell/10 px-4">
          <Link href={`/${locale}`} className="font-display text-base leading-none text-shell transition-colors hover:text-brass">
            {brand}
          </Link>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-brass">
            {context}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={context}>
          <NavLinks groups={groups} pathname={pathname} />
        </nav>
        <div className="border-t border-shell/10 px-3 py-3">
          <Link
            href={`/${locale}`}
            className="flex items-center rounded-sm px-2.5 py-1.5 text-sm text-shell-dim transition-colors hover:bg-shell/5 hover:text-shell"
          >
            ← <span className="ms-2">View site</span>
          </Link>
          {footer}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-shell/10 bg-night/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-label="Open navigation"
          className="inline-flex min-h-11 min-w-11 items-center justify-center -ms-2"
        >
          <svg className="h-5 w-5 text-shell" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Link href={`/${locale}`} className="font-display text-base text-shell">
          {brand}
        </Link>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-brass">
          {context}
        </span>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="mobile-menu-overlay absolute inset-0 bg-midnight/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <nav
            aria-label={context}
            className="absolute inset-y-0 start-0 flex w-72 flex-col border-e border-shell/10 bg-night"
          >
            <div className="flex h-14 items-center justify-between border-b border-shell/10 px-4">
              <span className="font-display text-base text-shell">{brand}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="inline-flex min-h-11 min-w-11 items-center justify-center -me-2"
              >
                <svg className="h-5 w-5 text-shell" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks
                groups={groups}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="border-t border-shell/10 px-3 py-3">
              <Link
                href={`/${locale}`}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center rounded-sm px-2.5 py-1.5 text-sm text-shell-dim transition-colors hover:bg-shell/5 hover:text-shell"
              >
                ← <span className="ms-2">View site</span>
              </Link>
              {footer}
            </div>
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="lg:ps-60">
        <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
