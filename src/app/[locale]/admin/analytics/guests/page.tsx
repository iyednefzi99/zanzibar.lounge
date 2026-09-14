import Link from "next/link";
import { notFound } from "next/navigation";

import { DonutChart } from "@/components/charts/donut-chart";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import {
  getCustomerSegments,
} from "@/lib/forecast";
import {
  getCohortAnalysis,
  getGuestLifetimeValue,
} from "@/lib/analytics-advanced";

export const dynamic = "force-dynamic";

const DONUT_COLORS = [
  "var(--color-brass)",
  "var(--color-lagoon)",
  "var(--color-coral)",
  "var(--color-shell)",
];

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [segments, cohort, topGuests] = await Promise.all([
    getCustomerSegments(),
    getCohortAnalysis(undefined, 6),
    getGuestLifetimeValue(undefined, 15),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Clients</h1>
        <Link
          href={`/${locale}/admin/analytics`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour aux statistiques
        </Link>
      </header>

      <Studs className="mt-6" />

      {/* Customer segments */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Segments de clientèle
        </h2>
        <div className="mt-4">
          {segments.length > 0 ? (
            <DonutChart
              data={segments.map((s, i) => ({
                label: `${s.segment} (${s.count} · ${s.percentage}%)`,
                value: s.count,
                color: DONUT_COLORS[i % DONUT_COLORS.length],
              }))}
            />
          ) : (
            <p className="text-sm text-shell-dim">
              Aucune donnée de fidélité disponible.
            </p>
          )}
        </div>
      </section>

      {/* Cohort retention */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Rétention par cohorte
        </h2>
        <div className="mt-4 overflow-x-auto">
          {cohort.length > 0 ? (
            <CohortTable data={cohort} />
          ) : (
            <p className="text-sm text-shell-dim">
              Pas assez de données pour générer la table de cohorte.
            </p>
          )}
        </div>
      </section>

      {/* Top guests by LTV */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Meilleurs clients (valeur vie)
        </h2>
        <div className="mt-4 overflow-x-auto">
          {topGuests.length > 0 ? (
            <GuestTable data={topGuests} />
          ) : (
            <p className="text-sm text-shell-dim">
              Aucune donnée de paiement disponible.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function CohortTable({
  data,
}: {
  data: Awaited<ReturnType<typeof getCohortAnalysis>>;
}) {
  const allMonths = new Set<string>();
  for (const row of data) {
    for (const r of row.retention) {
      allMonths.add(r.month);
    }
  }
  const sortedMonths = [...allMonths].sort();

  return (
    <table className="w-full min-w-[600px] border-collapse">
      <thead>
        <tr>
          <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Cohorte
          </th>
          <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Clients
          </th>
          {sortedMonths.map((m) => (
            <th
              key={m}
              className="border-b border-shell/12 px-3 py-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
            >
              {m.slice(5)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const retentionByMonth = new Map(
            row.retention.map((r) => [r.month, r]),
          );
          return (
            <tr key={row.firstVisitMonth}>
              <td className="border-b border-shell/8 px-3 py-2 font-mono text-xs text-shell">
                {row.firstVisitMonth}
              </td>
              <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                {row.totalGuests}
              </td>
              {sortedMonths.map((m) => {
                const r = retentionByMonth.get(m);
                const isCurrentOrFuture = m >= row.firstVisitMonth;
                if (!isCurrentOrFuture || !r) {
                  return (
                    <td
                      key={m}
                      className="border-b border-shell/8 px-3 py-2 text-center font-mono text-xs text-shell-dim/30"
                    >
                      —
                    </td>
                  );
                }
                const pct = Math.round(r.rate * 100);
                return (
                  <td
                    key={m}
                    className="border-b border-shell/8 px-3 py-2 text-center font-mono text-xs"
                    style={{
                      color:
                        pct >= 50
                          ? "var(--color-lagoon)"
                          : pct >= 25
                            ? "var(--color-brass)"
                            : "var(--color-shell-dim)",
                    }}
                  >
                    {pct}%
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function GuestTable({
  data,
}: {
  data: Awaited<ReturnType<typeof getGuestLifetimeValue>>;
}) {
  return (
    <table className="w-full min-w-[600px] border-collapse">
      <thead>
        <tr>
          <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Client
          </th>
          <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Dépense totale
          </th>
          <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Visites
          </th>
          <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Freq./mois
          </th>
          <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Dernière visite
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((guest) => (
          <tr key={guest.guestId}>
            <td className="border-b border-shell/8 px-3 py-2">
              <p className="font-mono text-xs text-shell">
                {guest.name ?? "—"}
              </p>
              <p className="font-mono text-[0.65rem] text-shell-dim/60" dir="ltr">
                {guest.phone}
              </p>
            </td>
            <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-brass">
              {guest.totalSpend.toLocaleString("fr-FR")} millimes
            </td>
            <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
              {guest.visitCount}
            </td>
            <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
              {guest.avgVisitFrequency}
            </td>
            <td className="border-b border-shell/8 px-3 py-2 text-right">
              <span className="font-mono text-xs text-shell-dim">
                {guest.lastVisit}
              </span>
              {guest.daysSinceLastVisit > 30 && (
                <span className="ml-2 font-mono text-[0.65rem] text-coral">
                  {guest.daysSinceLastVisit}j
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
