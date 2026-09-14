"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

const NAV_ITEMS = [
  { href: "/guest", icon: "home", label: "Accueil" },
  { href: "/guest/reservations", icon: "calendar", label: "Réservations" },
  { href: "/guest/loyalty", icon: "star", label: "Fidélité" },
  { href: "/guest/profile", icon: "user", label: "Profil" },
] as const;

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const ICONS: Record<string, React.FC> = {
  home: HomeIcon,
  calendar: CalendarIcon,
  star: StarIcon,
  user: UserIcon,
};

export function GuestNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brass/20 bg-deep/95 backdrop-blur-sm"
      aria-label="Navigation client"
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive =
            item.href === "/guest"
              ? pathname === href || pathname === `${href}/`
              : pathname.startsWith(href);

          const Icon = ICONS[item.icon];

          return (
            <li key={item.href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 transition-colors ${
                  isActive ? "text-brass" : "text-shell-dim hover:text-shell"
                }`}
              >
                {Icon && <Icon />}
                <span className="text-[0.6rem] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
