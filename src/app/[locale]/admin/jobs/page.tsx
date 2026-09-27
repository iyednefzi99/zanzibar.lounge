import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Background Jobs" subtitle="Monitor background tasks" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Job queue monitor coming soon</p>
      </div>
    </div>
  );
}
