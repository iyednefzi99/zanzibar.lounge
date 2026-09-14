import Link from "next/link";
import { notFound } from "next/navigation";

import { FloorPlanClient } from "@/components/floor-plan-client";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FloorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [tables, reservations] = await Promise.all([
    db.restaurantTable.findMany({
      where: { active: true },
      orderBy: [{ zone: "asc" }, { name: "asc" }],
    }),
    db.reservation.findMany({
      where: { serviceDate: todayString() },
      include: { guest: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const serializedTables = tables.map((t) => ({
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    zone: t.zone.toLowerCase(),
  }));

  const serializedReservations = reservations.map((r) => ({
    id: r.id,
    reference: r.reference,
    name: r.guest.name,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    partySize: r.partySize,
    zone: r.zone?.toLowerCase() ?? null,
    tableId: r.tableId,
    status: r.status,
  }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Plan de salle</h1>
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            ← Retour au service
          </Link>
          <p className="font-mono text-sm text-shell-dim" dir="ltr">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Africa/Tunis",
            }).format(new Date())}
          </p>
        </div>
      </header>

      <Studs className="mt-6" />

      <div className="mt-6">
        <FloorPlanClient
          tables={serializedTables}
          reservations={serializedReservations}
        />
      </div>
    </div>
  );
}

function todayString(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Tunis",
  }).format(new Date());
}
