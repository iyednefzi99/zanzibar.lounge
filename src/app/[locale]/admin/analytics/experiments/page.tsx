import Link from "next/link";
import { notFound } from "next/navigation";

import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import {
  getActiveExperiments,
  getExperimentResults,
} from "@/lib/ab-testing";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = await getDefaultRestaurantId();
  const experiments = await getActiveExperiments(restaurantId);

  // Fetch results for each experiment
  const experimentsWithResults = await Promise.all(
    experiments.map(async (exp) => {
      try {
        const results = await getExperimentResults(exp.id);
        return { ...exp, results };
      } catch {
        return { ...exp, results: null };
      }
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">A/B Testing</h1>
        <Link
          href={`/${locale}/admin/analytics`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour aux statistiques
        </Link>
      </header>

      <Studs className="mt-8" />

      {/* Summary */}
      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <Kpi
          label="Expériences actives"
          value={String(experiments.length)}
        />
        <Kpi
          label="Avec résultats"
          value={String(
            experimentsWithResults.filter((e) => e.results !== null).length,
          )}
        />
        <Kpi
          label="Significatives"
          value={String(
            experimentsWithResults.filter(
              (e) => e.results?.isSignificant,
            ).length,
          )}
        />
      </div>

      {/* Experiments */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Expériences en cours
        </h2>
        <div className="mt-4 space-y-6">
          {experimentsWithResults.length > 0 ? (
            experimentsWithResults.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-shell/12 bg-deep/40 p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-mono text-base font-medium text-shell">
                    {exp.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-lagoon/20 px-3 py-1 font-mono text-[0.65rem] uppercase text-lagoon">
                    {exp.status}
                  </span>
                </div>

                {/* Variants */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {exp.variants.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-full border border-shell/20 px-3 py-1 font-mono text-xs text-shell-dim"
                    >
                      {v.name} ({Math.round(v.weight * 100)}%)
                    </span>
                  ))}
                </div>

                {/* Results */}
                {exp.results && (
                  <div className="mt-4">
                    <ResultsTable results={exp.results} />
                  </div>
                )}

                {!exp.results && (
                  <p className="mt-4 text-sm text-shell-dim">
                    Aucune donnée de conversion pour cette expérience.
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-shell/12 bg-deep/40 p-10 text-center">
              <p className="text-shell-dim">
                Aucune expérience active pour le moment.
              </p>
              <p className="mt-2 text-sm text-shell-dim/60">
                Créez une expérience via l&apos;API ou le code pour commencer les tests.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Guide */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Guide rapide
        </h2>
        <div className="mt-4 space-y-3 text-sm text-shell-dim">
          <p>
            <strong className="text-shell">Créer une expérience :</strong>{" "}
            <code className="rounded bg-shell/8 px-2 py-0.5 font-mono text-xs text-brass">
              createExperiment(restaurantId, &quot;nom&quot;, [&quot;A&quot;, &quot;B&quot;])
            </code>
          </p>
          <p>
            <strong className="text-shell">Assigner un variant :</strong>{" "}
            <code className="rounded bg-shell/8 px-2 py-0.5 font-mono text-xs text-brass">
              assignVariant(experimentId, guestId)
            </code>
          </p>
          <p>
            <strong className="text-shell">Enregistrer une conversion :</strong>{" "}
            <code className="rounded bg-shell/8 px-2 py-0.5 font-mono text-xs text-brass">
              recordConversion(experimentId, variantId, guestId, metric)
            </code>
          </p>
          <p className="mt-4 text-xs text-shell-dim/60">
            Les résultats utilisent un z-test bilatéral (α = 0.05) pour comparer
            les proportions de conversion entre variants. La significativité est
            atteinte quand p &lt; 0.05.
          </p>
        </div>
      </section>
    </div>
  );
}

function ResultsTable({
  results,
}: {
  results: Awaited<ReturnType<typeof getExperimentResults>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-shell/12 px-3 py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Variant
            </th>
            <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Échantillons
            </th>
            <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Conversions
            </th>
            <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Taux
            </th>
            <th className="border-b border-shell/12 px-3 py-2 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              IC 95%
            </th>
          </tr>
        </thead>
        <tbody>
          {results.variants.map((v) => {
            const isWinner = results.winner === v.variantId;
            return (
              <tr
                key={v.variantId}
                className={isWinner ? "bg-lagoon/5" : undefined}
              >
                <td className="border-b border-shell/8 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-shell">
                      {v.name}
                    </span>
                    {isWinner && (
                      <span className="rounded-full bg-lagoon/20 px-2 py-0.5 font-mono text-[0.6rem] text-lagoon">
                        GAGNANT
                      </span>
                    )}
                  </div>
                </td>
                <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                  {v.samples}
                </td>
                <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-shell-dim">
                  {v.conversions}
                </td>
                <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-xs text-brass">
                  {(v.conversionRate * 100).toFixed(1)}%
                </td>
                <td className="border-b border-shell/8 px-3 py-2 text-right font-mono text-[0.65rem] text-shell-dim/60">
                  [{(v.ci95Lower * 100).toFixed(1)}% –{" "}
                  {(v.ci95Upper * 100).toFixed(1)}%]
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Significance */}
      <div className="mt-3 flex items-center gap-3">
        {results.isSignificant ? (
          <span className="rounded-full bg-lagoon/20 px-3 py-1 font-mono text-[0.65rem] text-lagoon">
            Résultat significatif (p &lt; 0.05, confiance {results.confidence}%)
          </span>
        ) : (
          <span className="rounded-full bg-shell/10 px-3 py-1 font-mono text-[0.65rem] text-shell-dim">
            Pas encore significatif ({results.totalSamples} échantillons)
          </span>
        )}
      </div>
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
