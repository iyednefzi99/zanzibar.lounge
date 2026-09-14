import Link from "next/link";
import { notFound } from "next/navigation";

import { DonutChart } from "@/components/charts/donut-chart";
import { HorizontalBar } from "@/components/charts/horizontal-bar";
import { LineChart } from "@/components/charts/line-chart";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getRevenueAnalytics } from "@/lib/analytics-advanced";

export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "7", label: "7 jours", days: 7 },
  { key: "30", label: "30 jours", days: 30 },
  { key: "90", label: "90 jours", days: 90 },
] as const;

const DONUT_COLORS = [
  "var(--color-brass)",
  "var(--color-lagoon)",
  "var(--color-coral)",
  "var(--color-shell)",
];

export default async function RevenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const { period } = await searchParams;
  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;

  const revenue = await getRevenueAnalytics(undefined, days);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Revenus</h1>
        <Link
          href={`/${locale}/admin/analytics`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour aux statistiques
        </Link>
      </header>

      {/* Period selector */}
      <nav aria-label="Période" className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/${locale}/admin/analytics/revenue?period=${p.key}`}
            aria-current={p.key === String(days) ? "page" : undefined}
            className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
              p.key === String(days)
                ? "border-brass bg-brass font-medium text-deep"
                : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <Kpi
          label="Revenu total"
          value={`${revenue.totalRevenue.toLocaleString("fr-FR")} millimes`}
        />
        <Kpi
          label="Panier moyen"
          value={`${revenue.avgOrderValue.toLocaleString("fr-FR")} millimes`}
        />
        <Kpi
          label="Transactions"
          value={String(
            revenue.daily.reduce((s, d) => {
              // Approximate count from avgOrderValue
              return s + (d.avgOrderValue > 0 ? Math.round(d.revenue / d.avgOrderValue) : 0);
            }, 0),
          )}
        />
      </div>

      <Studs className="mt-8" />

      {/* Daily revenue */}
      <Section title="Revenu quotidien">
        <LineChart
          data={revenue.daily.map((d) => ({
            label: d.date.slice(5),
            value: d.revenue,
          }))}
          lineColor="var(--color-brass)"
          dotColor="var(--color-brass)"
        />
      </Section>

      {/* Avg order value trend */}
      <Section title="Panier moyen">
        <LineChart
          data={revenue.daily.map((d) => ({
            label: d.date.slice(5),
            value: d.avgOrderValue,
          }))}
          lineColor="var(--color-lagoon)"
          dotColor="var(--color-lagoon)"
        />
      </Section>

      {/* Revenue by channel */}
      <Section title="Revenu par canal">
        {revenue.byChannel.length > 0 ? (
          <DonutChart
            data={revenue.byChannel.map((c, i) => ({
              label: `${c.channel} (${c.revenue.toLocaleString("fr-FR")} millimes)`,
              value: c.revenue,
              color: DONUT_COLORS[i % DONUT_COLORS.length],
            }))}
          />
        ) : (
          <p className="text-sm text-shell-dim">
            Aucune donnée pour cette période.
          </p>
        )}
      </Section>

      {/* Revenue by zone */}
      <Section title="Revenu par zone">
        {revenue.byZone.length > 0 ? (
          <HorizontalBar
            data={revenue.byZone.map((z) => ({
              label: `${z.zone} (${z.revenue.toLocaleString("fr-FR")} millimes)`,
              value: z.revenue,
              max: Math.max(...revenue.byZone.map((zz) => zz.revenue)),
            }))}
            barColor="var(--color-coral)"
          />
        ) : (
          <p className="text-sm text-shell-dim">
            Aucune donnée pour cette période.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell"
        dir="ltr"
      >
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs text-shell-dim">{detail}</p>
      )}
    </div>
  );
}
