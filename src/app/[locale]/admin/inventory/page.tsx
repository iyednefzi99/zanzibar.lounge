import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels and ingredients" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Inventory management coming soon</p>
      </div>
    </div>
  );
}
