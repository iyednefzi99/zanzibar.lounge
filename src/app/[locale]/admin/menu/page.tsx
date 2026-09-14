import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getFullMenu } from "@/lib/menu-manager";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { MenuInterface } from "./menu-interface";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const categories = await getFullMenu(restaurantId);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Menu</h1>
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/admin/inventory`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Inventaire
          </Link>
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            ← Retour au service
          </Link>
        </div>
      </header>

      <MenuInterface initialCategories={categories} />
    </div>
  );
}
