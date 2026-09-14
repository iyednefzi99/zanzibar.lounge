import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getCampaigns } from "@/lib/crm/campaigns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale } from "@/i18n/config";
import CampaignsInterface from "./campaigns-interface";

export const dynamic = "force-dynamic";

export default async function CrmCampaignsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const campaigns = await getCampaigns(restaurantId);

  const campaignsForClient = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    subject: c.subject,
    content: c.content,
    status: c.status,
    sentCount: c.sentCount,
    openCount: c.openCount,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-shell">Campagnes</h1>
          <p className="mt-2 text-sm text-shell-dim">{campaigns.length} campagnes</p>
        </div>
        <Link
          href={`/${locale}/admin/crm`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au CRM
        </Link>
      </div>

      <CampaignsInterface campaigns={campaignsForClient} />
    </div>
  );
}
