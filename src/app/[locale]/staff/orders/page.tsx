import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getOpenOrders } from "@/lib/orders";
import { StaffOrderList } from "./order-list";

export const dynamic = "force-dynamic";

export default async function StaffOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const orders = await getOpenOrders(restaurantId);

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 font-display text-2xl text-shell">Commandes</h1>
      <StaffOrderList orders={orders} />
    </div>
  );
}
