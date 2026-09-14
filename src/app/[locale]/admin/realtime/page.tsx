import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { RealtimeInterface } from "./realtime-interface";

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

  const [recentMetrics, pricingRules] = await Promise.all([
    db.liveMetric.findMany({
      where: { recordedAt: { gte: oneHourAgo } },
      orderBy: { recordedAt: "desc" },
      take: 50,
    }),
    db.dynamicPricingRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const metricsByType: Record<string, { value: number; unit: string | null }[]> = {};
  recentMetrics.forEach((m) => {
    if (!metricsByType[m.metricType]) metricsByType[m.metricType] = [];
    metricsByType[m.metricType].push({ value: m.value, unit: m.unit });
  });

  const zones = ["Terrasse", "Bar", "Salon", "Privé", "Jardin"];
  const seed = now.getTime();
  const zoneOccupancy = zones.map((name, i) => ({
    name,
    occupancy: Math.min(100, Math.max(0, Math.round(20 + Math.sin(seed / 10000 + i * 1.2) * 40 + i * 15))),
  }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Intelligence Temps Réel</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Métriques (1h)" value={String(recentMetrics.length)} />
        <Kpi label="Règles de prix" value={String(pricingRules.length)} />
        <Kpi label="Types métriques" value={String(Object.keys(metricsByType).length)} />
        <Kpi label="Règles actives" value={String(pricingRules.filter((r) => r.active).length)} />
      </div>

      <RealtimeInterface
        metricsByType={metricsByType}
        pricingRules={pricingRules}
        zoneOccupancy={zoneOccupancy}
      />
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
