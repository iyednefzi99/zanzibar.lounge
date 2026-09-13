import Link from "next/link";
import { notFound } from "next/navigation";

import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { HorizontalBar } from "@/components/charts/horizontal-bar";
import { LineChart } from "@/components/charts/line-chart";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import {
  cancellationStats,
  channelDistribution,
  coversByPeriod,
  fillRateByZone,
  reservationTrend,
  topTimeSlots,
} from "@/lib/analytics";
import { toISODate, addDays } from "@/lib/time";

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

export default async function AnalyticsPage({
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

  const today = toISODate(new Date(), "Africa/Tunis");
  const from = addDays(today, -days);

  const [covers, zones, channels, slots, cancellations, trend] =
    await Promise.all([
      coversByPeriod(from, today, "day"),
      fillRateByZone(from, today),
      channelDistribution(from, today),
      topTimeSlots(from, today),
      cancellationStats(from, today),
      reservationTrend(from, today),
    ]);

  const totalReservations = covers.reduce((s, c) => s + c.reservations, 0);
  const totalCovers = covers.reduce((s, c) => s + c.covers, 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Statistiques</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      {/* Sélecteur de période */}
      <nav aria-label="Période" className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/${locale}/admin/analytics?period=${p.key}`}
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
      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Réservations" value={String(totalReservations)} />
        <Kpi label="Couverts" value={String(totalCovers)} />
        <Kpi
          label="Taux d'annulation"
          value={`${Math.round(cancellations.cancelRate * 100)}%`}
        />
        <Kpi
          label="Non-voyageurs"
          value={`${Math.round(cancellations.noShowRate * 100)}%`}
        />
      </div>

      <Studs className="mt-8" />

      {/* Évolution */}
      <Section title="Évolution quotidienne">
        <LineChart
          data={trend.map((t) => ({
            label: t.date.slice(5),
            value: t.count,
          }))}
        />
      </Section>

      {/* Couverts par période */}
      <Section title="Couverts par jour">
        <BarChart
          data={covers.map((c) => ({
            label: c.label.slice(5),
            value: c.covers,
          }))}
        />
      </Section>

      {/* Taux par zone */}
      <Section title="Taux de remplissage par zone">
        {zones.length > 0 ? (
          <HorizontalBar
            data={zones.map((z) => ({
              label: `${z.zone} (${z.avgCovers}/${z.capacity})`,
              value: z.avgCovers,
              max: z.capacity,
            }))}
          />
        ) : (
          <p className="text-sm text-shell-dim">Aucune donnée pour cette période.</p>
        )}
      </Section>

      {/* Répartition par canal */}
      <Section title="Répartition par canal">
        {channels.length > 0 ? (
          <DonutChart
            data={channels.map((c, i) => ({
              label: c.channel,
              value: c.count,
              color: DONUT_COLORS[i % DONUT_COLORS.length],
            }))}
          />
        ) : (
          <p className="text-sm text-shell-dim">Aucune donnée pour cette période.</p>
        )}
      </Section>

      {/* Top créneaux */}
      <Section title="Créneaux les plus demandés">
        <BarChart
          data={slots.map((s) => ({
            label: s.label,
            value: s.count,
          }))}
          barColor="var(--color-lagoon)"
        />
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

function Kpi({ label, value }: { label: string; value: string }) {
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
    </div>
  );
}
