import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RealtimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [metricCount, pricingRuleCount, recentMetrics] = await Promise.all([
    db.liveMetric.count({ where: { recordedAt: { gte: oneHourAgo } } }),
    db.dynamicPricingRule.count({ where: { active: true } }),
    db.liveMetric.findMany({
      where: { recordedAt: { gte: oneHourAgo } },
      orderBy: { recordedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Intelligence Temps Réel</h1>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Métriques (1h)" value={String(metricCount)} />
        <Kpi label="Règles de prix" value={String(pricingRuleCount)} />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Métriques récentes
        </h2>
        <div className="mt-4 space-y-2">
          {recentMetrics.length === 0 ? (
            <p className="text-sm text-shell-dim">Aucune métrique récente.</p>
          ) : (
            recentMetrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-t border-brass/35 pt-2">
                <span className="text-sm text-shell-dim">{m.metricType}</span>
                <span className="font-mono text-shell tabular-nums">
                  {m.value}{m.unit ? ` ${m.unit}` : ""}
                </span>
              </div>
            ))
          )}
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
