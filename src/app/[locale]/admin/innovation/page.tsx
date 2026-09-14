import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InnovationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [badgeCount, socialProofCount, maintenanceActive, sentimentData] = await Promise.all([
    db.gamificationBadge.count(),
    db.socialProofEvent.count({ where: { active: true } }),
    db.maintenanceAlert.count({ where: { status: "active" } }),
    db.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { rating: true },
    }),
  ]);

  const avgSentiment =
    sentimentData.length > 0
      ? Math.round((sentimentData.reduce((s, r) => s + r.rating, 0) / sentimentData.length) * 10) / 10
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Innovation Lab</h1>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Badges gamifiés" value={String(badgeCount)} />
        <Kpi label="Preuves sociales actives" value={String(socialProofCount)} />
        <Kpi label="Alertes maintenance" value={String(maintenanceActive)} />
        <Kpi label="Sentiment moyen" value={`${avgSentiment}/5`} />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Modules
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ModuleCard title="Gamification" description="Badges et accomplissements" />
          <ModuleCard title="Preuve Sociale" description="Activité en temps réel" />
          <ModuleCard title="Sentiment" description="Avis et tendances" />
          <ModuleCard title="Sommelier IA" description="Accords mets-vins" />
          <ModuleCard title="Maintenance" description="Alertes et suivi" />
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell" dir="ltr">
        {value}
      </p>
    </div>
  );
}

function ModuleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-shell/10 bg-night p-4">
      <h3 className="text-sm font-medium text-shell">{title}</h3>
      <p className="mt-1 text-xs text-shell-dim">{description}</p>
    </div>
  );
}
