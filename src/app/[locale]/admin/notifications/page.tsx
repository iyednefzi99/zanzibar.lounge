import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Manage push notifications and alerts" />
      <div className="mt-6 glass-card rounded-xl p-6">
        <p className="text-shell-dim">Notification management coming soon</p>
      </div>
    </div>
  );
}
