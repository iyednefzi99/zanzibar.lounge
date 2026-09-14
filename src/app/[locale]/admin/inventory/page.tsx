import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import {
  getInventory,
  checkLowStock,
} from "@/lib/inventory";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { db } from "@/lib/db";
import { InventoryInterface } from "./inventory-interface";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const [items, lowStockItems, menuItems] = await Promise.all([
    getInventory(restaurantId),
    checkLowStock(restaurantId),
    db.menuItem.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Inventaire</h1>
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/admin/menu`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Menu
          </Link>
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            ← Retour au service
          </Link>
        </div>
      </header>

      <InventoryInterface
        initialItems={items}
        lowStockItems={lowStockItems}
        menuItems={menuItems}
      />
    </div>
  );
}
