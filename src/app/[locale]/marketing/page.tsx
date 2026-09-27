import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Marketing Dashboard"
        subtitle="Manage campaigns, automations, and guest journeys"
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { label: "Campaigns", desc: "Email and SMS campaigns" },
          { label: "Automations", desc: "Automated guest journeys" },
          { label: "Segments", desc: "Guest segmentation" },
          { label: "Analytics", desc: "Campaign performance" },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-xl text-shell">{item.label}</h3>
            <p className="mt-2 text-sm text-shell-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
