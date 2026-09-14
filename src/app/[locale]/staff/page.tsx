import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { site } from "@/content/site";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { reservationsForDate } from "@/lib/reservations";
import { getOpenOrders } from "@/lib/orders";
import { toISODate } from "@/lib/time";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = {
  upcoming: ["PENDING", "CONFIRMED"],
  active: ["SEATED"],
  completed: ["COMPLETED"],
  dropped: ["CANCELLED", "NO_SHOW"],
};

export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const today = toISODate(new Date(), site.timezone);

  const [reservations, orders] = await Promise.all([
    reservationsForDate(today, restaurantId),
    getOpenOrders(restaurantId),
  ]);

  const live = reservations.filter(
    (r) => !STATUS_GROUPS.dropped.includes(r.status),
  );
  const pendingCount = live.filter((r) => STATUS_GROUPS.upcoming.includes(r.status)).length;
  const seatedCount = live.filter((r) => STATUS_GROUPS.active.includes(r.status)).length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const preparingOrders = orders.filter((o) => o.status === "PREPARING").length;
  const readyOrders = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="px-4 py-6">
      {/* Today's Summary */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl text-shell">Aujourd&apos;hui</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Réservations" value={String(live.length)} sub={`${pendingCount} en attente`} />
          <StatCard label="À table" value={String(seatedCount)} sub="clients installés" />
          <StatCard label="Commandes" value={String(pendingOrders + preparingOrders)} sub={`${readyOrders} prêtes`} />
          <StatCard label="Couverts" value={String(live.reduce((s, r) => s + r.partySize, 0))} sub="ce service" />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl text-shell">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction href={`/${locale}/staff/scan`} icon="scan" label="Scanner QR" />
          <QuickAction href={`/${locale}/staff/reservations`} icon="calendar" label="Réservations" />
          <QuickAction href={`/${locale}/staff/orders`} icon="orders" label="Commandes" />
          <QuickAction href={`/${locale}/admin/floor`} icon="floor" label="Plan de salle" />
        </div>
      </section>

      {/* Next Arrivals */}
      {live.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl text-shell">Prochaines arrivées</h2>
          <div className="space-y-2">
            {live
              .filter((r) => STATUS_GROUPS.upcoming.includes(r.status))
              .slice(0, 5)
              .map((r) => (
                <div
                  key={r.reference}
                  className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-shell">
                      {r.name ?? "—"} · {r.partySize} pers.
                    </p>
                    <p className="text-xs text-shell-dim">{r.reference}</p>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-brass" dir="ltr">
                    {r.time}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {live.length === 0 && (
        <p className="py-12 text-center text-sm text-shell-dim">
          Aucune réservation pour l&apos;instant.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-wider text-shell-dim">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell"
        dir="ltr"
      >
        {value}
      </p>
      <p className="mt-1 text-[0.65rem] text-shell-dim">{sub}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const icons: Record<string, string> = {
    scan: "📸",
    calendar: "📅",
    orders: "🍽️",
    floor: "🗺️",
  };

  return (
    <Link
      href={href}
      className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-brass/20 bg-deep/40 text-shell transition-colors hover:border-brass/40 hover:bg-brass/5"
    >
      <span className="text-2xl" aria-hidden="true">
        {icons[icon]}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
