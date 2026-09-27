import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, type Locale } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin-auth";

export default async function OwnerLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  await requireAdmin();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;

  const nav = [
    { label: "Dashboard", href: `/${typedLocale}/owner` },
    { label: "Settings", href: `/${typedLocale}/owner/settings` },
    { label: "Team", href: `/${typedLocale}/owner/team` },
    { label: "Billing", href: `/${typedLocale}/owner/billing` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-48">
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-shell-dim transition-colors hover:bg-shell/5 hover:text-shell"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
