import Link from "next/link";
import { notFound } from "next/navigation";

import { Heatmap } from "@/components/charts/heatmap";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getHourlyHeatmap, DAY_NAMES } from "@/lib/analytics-advanced";

export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "30", label: "30 jours", days: 30 },
  { key: "60", label: "60 jours", days: 60 },
  { key: "90", label: "90 jours", days: 90 },
] as const;

export default async function HeatmapPage({
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
  const days = PERIODS.find((p) => p.key === period)?.days ?? 90;

  const data = await getHourlyHeatmap(undefined, days);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Find peak slots
  const topSlots = [...data]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">
          Carte de chaleur
        </h1>
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
            href={`/${locale}/admin/analytics/heatmap?period=${p.key}`}
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

      <Studs className="mt-8" />

      {/* Heatmap */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Densité de réservations (jour × heure)
        </h2>
        <div className="mt-4">
          <Heatmap
            data={data}
            label={`${days} derniers jours`}
          />
        </div>
      </section>

      {/* Peak slots */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Créneaux les plus忙
        </h2>
        <div className="mt-4 space-y-2">
          {topSlots.map((slot, i) => {
            const pct = Math.round((slot.count / maxCount) * 100);
            return (
              <div
                key={`${slot.dayOfWeek}-${slot.hour}`}
                className="flex items-center gap-4"
              >
                <span className="w-8 text-right font-mono text-xs text-shell-dim/60">
                  #{i + 1}
                </span>
                <span className="w-20 font-mono text-sm text-shell">
                  {DAY_NAMES[slot.dayOfWeek]}
                </span>
                <span className="font-mono text-sm tabular-nums text-brass">
                  {String(slot.hour).padStart(2, "0")}:00
                </span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-shell/12">
                    <div
                      className="h-full rounded-full bg-brass"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-xs text-shell-dim">
                  {slot.count}
                </span>
              </div>
            );
          })}
          {topSlots.length === 0 && (
            <p className="text-sm text-shell-dim">
              Aucune donnée de réservation pour cette période.
            </p>
          )}
        </div>
      </section>

      {/* Legend */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Légende
        </h2>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block size-4 rounded bg-shell-dim opacity-20" />
            <span className="font-mono text-xs text-shell-dim">0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-4 rounded bg-shell-dim opacity-50" />
            <span className="font-mono text-xs text-shell-dim">Faible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-4 rounded bg-brass" />
            <span className="font-mono text-xs text-shell-dim">Moyen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-4 rounded bg-coral" />
            <span className="font-mono text-xs text-shell-dim">Fort</span>
          </div>
        </div>
      </section>
    </div>
  );
}
