import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getCampaigns } from "@/lib/crm/campaigns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CrmCampaignsPage() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const campaigns = await getCampaigns(restaurantId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-shell">Campagnes</h1>
          <p className="mt-2 text-sm text-shell-dim">{campaigns.length} campagnes</p>
        </div>
      </div>

      <div className="space-y-2">
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-shell/10 bg-deep/40 py-12 text-center">
            <p className="text-shell-dim">Aucune campagne créée.</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-shell">{c.name}</p>
                <p className="text-xs text-shell-dim">
                  {c.type.toUpperCase()} · {c.sentCount} envoyés
                  {c.openCount > 0 && ` · ${c.openCount} ouverts`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase ${
                  c.status === "sent"
                    ? "bg-lagoon/15 text-lagoon"
                    : c.status === "draft"
                      ? "bg-shell/10 text-shell-dim"
                      : c.status === "scheduled"
                        ? "bg-brass/15 text-brass"
                        : "bg-coral/15 text-coral"
                }`}
              >
                {c.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
