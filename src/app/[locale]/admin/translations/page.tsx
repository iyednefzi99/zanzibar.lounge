import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminTranslationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Translations" subtitle="Manage multi-language content" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Translation management coming soon</p>
      </div>
    </div>
  );
}
