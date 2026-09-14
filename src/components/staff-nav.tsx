"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

const NAV_ITEMS = [
  { href: "/staff", icon: "home", label: "Accueil" },
  { href: "/staff/reservations", icon: "calendar", label: "Résas" },
  { href: "/staff/orders", icon: "orders", label: "Commandes" },
  { href: "/staff/scan", icon: "scan", label: "Scanner" },
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

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

const ICONS: Record<string, React.FC> = {
  home: HomeIcon,
  calendar: CalendarIcon,
  orders: OrdersIcon,
  scan: ScanIcon,
};

export function StaffNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brass/20 bg-deep/95 backdrop-blur-sm"
      aria-label="Navigation staff"
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive =
            item.href === "/staff"
              ? pathname === href || pathname === `${href}/`
              : pathname.startsWith(href);

          const Icon = ICONS[item.icon];

          return (
            <li key={item.href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 transition-colors ${
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
