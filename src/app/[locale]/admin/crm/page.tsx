import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminCRMPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="CRM" subtitle="Guest relationship management" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {["Guests", "Tags", "Campaigns", "Automations", "Notes"].map((item) => (
          <div key={item} className="glass-card rounded-xl p-6">
            <h3 className="font-display text-xl text-shell">{item}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
