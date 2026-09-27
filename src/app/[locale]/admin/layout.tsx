import { notFound } from "next/navigation";

import { AppShell, type NavGroup } from "@/components/admin/app-shell";
import { site } from "@/content/site";
import { isLocale, type Locale } from "@/i18n/config";

const adminRoutes: Array<[string, string]> = [
  ["", "Dashboard"],
  ["analytics", "Analytics"],
  ["realtime", "Realtime"],
  ["predict", "Predictions"],
  ["orders", "Orders"],
  ["menu", "Menu"],
  ["inventory", "Inventory"],
  ["floor", "Floor Plan"],
  ["staff", "Staff"],
  ["jobs", "Background Jobs"],
  ["crm", "CRM"],
  ["reviews", "Reviews"],
  ["personalization", "Personalization"],
  ["chat", "Live Chat"],
  ["voice", "Voice Commerce"],
  ["payments", "Payments"],
  ["integrations", "Integrations"],
  ["widget", "Widget"],
  ["translations", "Translations"],
  ["notifications", "Notifications"],
  ["sustainability", "Sustainability"],
  ["ai", "AI Concierge"],
  ["security", "Security"],
  ["2fa", "Two-Factor Auth"],
  ["apikeys", "API Keys"],
];

const groupPaths: Array<[string | undefined, string[]]> = [
  [undefined, ["", "analytics", "realtime", "predict"]],
  ["Operations", ["orders", "menu", "inventory", "floor", "staff", "jobs"]],
  ["Guests", ["crm", "reviews", "personalization", "chat", "voice"]],
  [
    "Platform",
    [
      "payments",
      "integrations",
      "widget",
      "translations",
      "notifications",
      "sustainability",
      "ai",
    ],
  ],
  ["Security", ["security", "2fa", "apikeys"]],
];

export default async function AdminLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const labels = new Map(adminRoutes);

  const groups: NavGroup[] = groupPaths.map(([label, paths]) => ({
    label,
    items: paths.map((path) => ({
      label: labels.get(path) ?? path,
      href: `/${typedLocale}/admin${path ? `/${path}` : ""}`,
    })),
  }));

  return (
    <AppShell
      brand={site.name}
      context="Admin"
      locale={typedLocale}
      groups={groups}
    >
      {children}
    </AppShell>
  );
}
