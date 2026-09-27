import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminPersonalizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Personalization" subtitle="AI-driven guest recommendations" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Personalization engine coming soon</p>
      </div>
    </div>
  );
}
