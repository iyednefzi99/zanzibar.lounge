import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminIntegrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect third-party services" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { name: "POS System", desc: "Toast, Square integration" },
          { name: "Email Service", desc: "Resend email delivery" },
          { name: "Google Business", desc: "Google Maps & reviews" },
          { name: "TripAdvisor", desc: "Review sync" },
          { name: "Calendar", desc: "Google/Apple calendar sync" },
        ].map((item) => (
          <div key={item.name} className="glass-card rounded-xl p-5">
            <h3 className="font-display text-lg text-shell">{item.name}</h3>
            <p className="mt-1 text-sm text-shell-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
