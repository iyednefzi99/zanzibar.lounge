import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminVoicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Voice Commerce" subtitle="Voice ordering and phone agent" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Voice commerce dashboard coming soon</p>
      </div>
    </div>
  );
}
