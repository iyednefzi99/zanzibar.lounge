import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminRealtimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Realtime" subtitle="Live metrics and monitoring" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Realtime dashboard coming soon</p>
      </div>
    </div>
  );
}
