import { notFound } from "next/navigation";

import { RealtimeDashboard } from "@/components/realtime-dashboard";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getRealtimeStats } from "@/lib/analytics-advanced";

export const dynamic = "force-dynamic";

export default async function RealtimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const stats = await getRealtimeStats();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Temps réel</h1>
        <a
          href={`/${locale}/admin/analytics`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour aux statistiques
        </a>
      </header>

      <Studs className="mt-6" />

      <RealtimeDashboard initialStats={stats} />
    </div>
  );
}
