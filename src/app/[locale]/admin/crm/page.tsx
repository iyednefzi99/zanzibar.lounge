import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getGuestSegments } from "@/lib/crm";
import { getCampaigns } from "@/lib/crm/campaigns";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const [segments, campaigns, guestCount, tagCount] = await Promise.all([
    getGuestSegments(restaurantId),
    getCampaigns(restaurantId),
    db.guest.count({
      where: { reservations: { some: { restaurantId } } },
    }),
    db.guestTag.count({ where: { restaurantId } }),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "sent" || c.status === "sending");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-3xl text-shell">CRM & Marketing</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Gérez vos clients, campagnes et automatisations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5">
          <p className="font-mono text-xs uppercase text-shell-dim">Clients</p>
          <p className="mt-2 font-display text-3xl text-shell">{guestCount}</p>
        </div>
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5">
          <p className="font-mono text-xs uppercase text-shell-dim">Tags</p>
          <p className="mt-2 font-display text-3xl text-shell">{tagCount}</p>
        </div>
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5">
          <p className="font-mono text-xs uppercase text-shell-dim">Campagnes</p>
          <p className="mt-2 font-display text-3xl text-shell">{campaigns.length}</p>
        </div>
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5">
          <p className="font-mono text-xs uppercase text-shell-dim">En cours</p>
          <p className="mt-2 font-display text-3xl text-brass">{activeCampaigns.length}</p>
        </div>
      </div>

      {/* Segments */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Segments clients
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => (
            <Link
              key={seg.id}
              href={`/admin/crm/guests?segment=${seg.id}`}
              className="rounded-xl border border-shell/10 bg-deep/40 p-4 transition-colors hover:border-brass/30"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <div>
                  <p className="text-sm font-medium text-shell">{seg.name}</p>
                  <p className="text-xs text-shell-dim">{seg.description}</p>
                </div>
              </div>
              <p className="mt-3 font-display text-2xl text-shell">{seg.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Actions rapides
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/crm/guests"
            className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center transition-colors hover:border-brass/30"
          >
            <p className="text-sm font-medium text-shell">Gérer les clients</p>
          </Link>
          <Link
            href="/admin/crm/campaigns"
            className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center transition-colors hover:border-brass/30"
          >
            <p className="text-sm font-medium text-shell">Créer une campagne</p>
          </Link>
          <Link
            href="/admin/crm/automations"
            className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center transition-colors hover:border-brass/30"
          >
            <p className="text-sm font-medium text-shell">Automatisations</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
