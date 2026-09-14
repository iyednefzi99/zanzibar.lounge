import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SustainabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [carbonCount, complianceCount, pendingChecks, failedChecks] = await Promise.all([
    db.carbonLog.count({ where: { period: { gte: thirtyDaysAgo } } }),
    db.complianceCheck.count(),
    db.complianceCheck.count({ where: { status: "pending" } }),
    db.complianceCheck.count({ where: { status: "failed" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Durabilité &amp; Conformité</h1>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Entrées carbone (30j)" value={String(carbonCount)} />
        <Kpi label="Vérifications" value={String(complianceCount)} />
        <Kpi label="En attente" value={String(pendingChecks)} />
        <Kpi label="Échouées" value={String(failedChecks)} />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Dernières vérifications
        </h2>
        <div className="mt-4">
          <p className="text-sm text-shell-dim">
            {complianceCount === 0
              ? "Aucune vérification enregistrée."
              : `${complianceCount} vérification(s) au total, ${pendingChecks} en attente, ${failedChecks} échouée(s).`}
          </p>
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
