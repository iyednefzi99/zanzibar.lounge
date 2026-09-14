import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { KitchenDisplay } from "./kitchen-display";

export const dynamic = "force-dynamic";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = await getDefaultRestaurantId();

  const orders = await db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["PENDING", "PREPARING", "READY"] },
    },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const payload = orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    status: o.status,
    notes: o.notes,
    total: o.total,
    pickupMinutes: o.pickupMinutes,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((oi) => ({
      id: oi.id,
      name: oi.menuItem.name,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
    })),
  }));

  return <KitchenDisplay initialOrders={payload} />;
}
