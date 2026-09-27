import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminFloorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Floor Plan" subtitle="Visual table management" />
      <div className="mt-6 glass-card rounded-xl p-8">
        <p className="text-center text-shell-dim">Interactive floor plan coming soon</p>
      </div>
    </div>
  );
}
