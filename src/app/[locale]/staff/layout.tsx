import { notFound } from "next/navigation";

import { AppShell, type NavGroup } from "@/components/admin/app-shell";
import { site } from "@/content/site";
import { isLocale, type Locale } from "@/i18n/config";

const staffRoutes: Array<[string, string]> = [
  ["", "Dashboard"],
  ["reservations", "Reservations"],
  ["orders", "Orders"],
  ["scan", "QR Scanner"],
];

export default async function StaffLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;

  const groups: NavGroup[] = [
    {
      items: staffRoutes.map(([path, label]) => ({
        label,
        href: `/${typedLocale}/staff${path ? `/${path}` : ""}`,
      })),
    },
  ];

  return (
    <AppShell
      brand={site.name}
      context="Staff"
      locale={typedLocale}
      groups={groups}
    >
      {children}
    </AppShell>
  );
}
