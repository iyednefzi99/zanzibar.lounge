import Link from "next/link";
import { notFound } from "next/navigation";

import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import {
  generateInsights,
  predictRevenue,
  predictNoShows,
  segmentMarketing,
} from "@/lib/ai-analytics";
import { toISODate, addDays } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const { days: daysParam } = await searchParams;
  const days = Number(daysParam) || 7;

  const today = toISODate(new Date(), "Africa/Tunis");
  const tomorrow = addDays(today, 1);
  const restaurantId = await getDefaultRestaurantId();

  const [insights, revenuePredictions, noShowRisks, segments] = await Promise.all([
    generateInsights(restaurantId),
    predictRevenue(restaurantId, days),
    predictNoShows(restaurantId, tomorrow),
    segmentMarketing(restaurantId),
  ]);

  const totalPredictedRevenue = revenuePredictions.reduce(
    (s, p) => s + p.predicted,
    0,
  );

  const highRiskCount = noShowRisks.filter((r) => r.riskLevel === "high").length;
  const mediumRiskCount = noShowRisks.filter((r) => r.riskLevel === "medium").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Insights IA</h1>
        <Link
          href={`/${locale}/admin/analytics`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour aux statistiques
        </Link>
      </header>

      {/* Period selector */}
      <nav aria-label="Horizon" className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "7", label: "7 jours" },
          { key: "14", label: "14 jours" },
          { key: "30", label: "30 jours" },
        ].map((p) => (
          <Link
            key={p.key}
            href={`/${locale}/admin/analytics/insights?days=${p.key}`}
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
        <Kpi
          label="Revenu prédit"
          value={`${totalPredictedRevenue.toLocaleString("fr-FR")} millimes`}
        />
        <Kpi
          label="Risques no-show"
          value={String(highRiskCount + mediumRiskCount)}
          detail={`${highRiskCount} élevé · ${mediumRiskCount} moyen`}
        />
        <Kpi
          label="Segments actifs"
          value={String(segments.length)}
        />
        <Kpi
          label="Insights"
          value={String(insights.length)}
          detail={`${insights.filter((i) => i.priority === "high").length} critiques`}
        />
      </div>

      <Studs className="mt-8" />

      {/* AI Insights */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Analyse IA
        </h2>
        <div className="mt-4 space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 ${
                  insight.category === "opportunity"
                    ? "border-lagoon/30 bg-lagoon/5"
                    : insight.category === "risk"
                      ? "border-coral/30 bg-coral/5"
                      : "border-brass/30 bg-brass/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                          insight.category === "opportunity"
                            ? "bg-lagoon/20 text-lagoon"
                            : insight.category === "risk"
                              ? "bg-coral/20 text-coral"
                              : "bg-brass/20 text-brass"
                        }`}
                      >
                        {insight.category === "opportunity"
                          ? "↑"
                          : insight.category === "risk"
                            ? "!"
                            : "→"}
                      </span>
                      <h3 className="font-mono text-sm font-medium text-shell">
                        {insight.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-shell-dim">
                      {insight.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider ${
                      insight.priority === "high"
                        ? "bg-coral/20 text-coral"
                        : insight.priority === "medium"
                          ? "bg-brass/20 text-brass"
                          : "bg-shell/10 text-shell-dim"
                    }`}
                  >
                    {insight.priority}
                  </span>
                </div>
                {insight.metric !== undefined && (
                  <p className="mt-2 font-mono text-xs text-shell-dim/60">
                    Métrique: {insight.metric > 0 ? "+" : ""}
                    {insight.metric}
                    {insight.category === "opportunity" || insight.category === "risk"
                      ? "%"
                      : ""}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-shell-dim">
              Pas assez de données pour générer des insights. Revenez après
              quelques jours d&apos;activité.
            </p>
          )}
        </div>
      </section>

      {/* Revenue Predictions */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Prédictions de revenus
        </h2>
        <div className="mt-4 overflow-x-auto">
          {revenuePredictions.length > 0 ? (
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Date
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Prédiction
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Fourchette 95%
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Confiance
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenuePredictions.map((pred) => (
                  <tr key={pred.date}>
                    <td className="border-b border-shell/8 px-3 py-2 font-mono text-xs text-shell">
                      {pred.date}
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-brass">
                      {pred.predicted.toLocaleString("fr-FR")} millimes
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                      {pred.lowerBound.toLocaleString("fr-FR")} –{" "}
                      {pred.upperBound.toLocaleString("fr-FR")}
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[0.65rem] ${
                          pred.confidence === "high"
                            ? "bg-lagoon/20 text-lagoon"
                            : pred.confidence === "medium"
                              ? "bg-brass/20 text-brass"
                              : "bg-shell/10 text-shell-dim"
                        }`}
                      >
                        {pred.confidence === "high"
                          ? "Élevée"
                          : pred.confidence === "medium"
                            ? "Moyenne"
                            : "Faible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-shell-dim">
              Aucune donnée de paiement pour les prédictions.
            </p>
          )}
        </div>
      </section>

      {/* No-Show Risks */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Alertes no-show — {tomorrow}
        </h2>
        <div className="mt-4 space-y-3">
          {noShowRisks.length > 0 ? (
            noShowRisks.slice(0, 10).map((risk) => (
              <div
                key={risk.reservationId}
                className={`rounded-xl border p-4 ${
                  risk.riskLevel === "high"
                    ? "border-coral/30 bg-coral/5"
                    : risk.riskLevel === "medium"
                      ? "border-brass/30 bg-brass/5"
                      : "border-shell/12 bg-deep/40"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-shell">
                      {risk.guestName ?? "Client inconnu"}
                    </p>
                    <p className="font-mono text-xs text-shell-dim" dir="ltr">
                      {risk.guestPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-shell-dim">
                      {risk.startsAt} · {risk.partySize} pers.
                    </p>
                    <p
                      className={`mt-1 font-mono text-sm font-bold ${
                        risk.riskLevel === "high"
                          ? "text-coral"
                          : risk.riskLevel === "medium"
                            ? "text-brass"
                            : "text-lagoon"
                      }`}
                    >
                      {Math.round(risk.riskScore * 100)}% risque
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {risk.factors.map((factor, fi) => (
                    <span
                      key={fi}
                      className="rounded-full bg-shell/8 px-2 py-0.5 font-mono text-[0.6rem] text-shell-dim"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-shell-dim">
              Aucune réservation confirmée pour demain.
            </p>
          )}
        </div>
      </section>

      {/* Marketing Segments */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Segments marketing
        </h2>
        <div className="mt-4 overflow-x-auto">
          {segments.length > 0 ? (
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Segment
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Clients
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Panier moyen
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Freq.
                  </th>
                  <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                    Offre recommandée
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((seg) => (
                  <tr key={seg.segment}>
                    <td className="border-b border-shell/8 px-3 py-2 font-mono text-xs text-shell">
                      {seg.segment}
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                      {seg.guestCount}
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-brass">
                      {seg.avgSpend.toLocaleString("fr-FR")} millimes
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                      {seg.visitFrequency}/mois
                    </td>
                    <td className="border-b border-shell/8 px-3 py-2 text-xs text-shell-dim">
                      {seg.recommendedOffer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-shell-dim">
              Aucune donnée de client pour le marketing.
            </p>
          )}
        </div>
      </section>
    </div>
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
