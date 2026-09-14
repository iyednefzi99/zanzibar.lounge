import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { site } from "@/content/site";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { reservationsForDate } from "@/lib/reservations";
import { toISODate } from "@/lib/time";
import { StaffReservationList } from "./reservation-list";

export const dynamic = "force-dynamic";

export default async function StaffReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const today = toISODate(new Date(), site.timezone);
  const reservations = await reservationsForDate(today, restaurantId);

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 font-display text-2xl text-shell">Réservations</h1>
      <StaffReservationList reservations={reservations} />
    </div>
  );
}
