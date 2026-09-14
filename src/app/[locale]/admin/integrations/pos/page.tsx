import { requireAdmin } from "@/lib/admin-auth";
import { getPosIntegrations, getSyncHistory } from "@/lib/pos";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { PosConfigManager } from "@/components/pos/pos-config-manager";
import { PosSyncHistory } from "@/components/pos/pos-sync-history";

export const dynamic = "force-dynamic";

export default async function PosIntegrationsPage() {
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();
  const integrations = await getPosIntegrations(restaurantId);
  const syncLogs = await getSyncHistory(restaurantId, 20);

  const mappedIntegrations = integrations.map((i) => ({
    id: i.id,
    provider: i.provider,
    syncStatus: i.syncStatus,
    lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
    syncMenu: i.syncMenu,
    syncOrders: i.syncOrders,
    syncPayments: i.syncPayments,
  }));

  const mappedLogs = syncLogs.map((l) => ({
    id: l.id,
    direction: l.direction,
    entityType: l.entityType,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    integration: l.integration,
    details: l.details as { synced?: number; errors?: string[] } | undefined,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-3xl text-shell">Intégrations POS</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Connectez votre système de caisse pour synchroniser le menu et les commandes.
        </p>
      </div>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Fournisseurs
        </h2>
        <div className="mt-4">
          <PosConfigManager integrations={mappedIntegrations} />
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Historique des synchronisations
        </h2>
        <div className="mt-4">
          <PosSyncHistory logs={mappedLogs} />
        </div>
      </section>
    </div>
  );
}
