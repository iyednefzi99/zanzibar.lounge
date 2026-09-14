"use client";

import { useTransition } from "react";

import {
  togglePricingRuleAction,
  updatePricingRuleMultiplierAction,
} from "./actions";

type PricingRule = {
  id: string;
  restaurantId: string;
  menuItemId: string;
  ruleType: string;
  multiplier: number;
  conditions: unknown;
  active: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date;
};

type ZoneOccupancy = {
  name: string;
  occupancy: number;
};

type Props = {
  metricsByType: Record<string, { value: number; unit: string | null }[]>;
  pricingRules: PricingRule[];
  zoneOccupancy: ZoneOccupancy[];
};

const RULE_TYPE_LABELS: Record<string, string> = {
  happy_hour: "Happy Hour",
  demand_surge: "Pic de demande",
  off_peak: "Hors pic",
  loyalty: "Fidélité",
};

function getOccupancyColor(pct: number): string {
  if (pct >= 80) return "bg-coral/70";
  if (pct >= 50) return "bg-brass/60";
  return "bg-lagoon/60";
}

export function RealtimeInterface({
  metricsByType,
  pricingRules,
  zoneOccupancy,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggleRule(ruleId: string) {
    const fd = new FormData();
    fd.set("ruleId", ruleId);
    startTransition(async () => {
      await togglePricingRuleAction(fd);
    });
  }

  function handleMultiplierChange(ruleId: string, value: string) {
    const fd = new FormData();
    fd.set("ruleId", ruleId);
    fd.set("multiplier", value);
    startTransition(async () => {
      await updatePricingRuleMultiplierAction(fd);
    });
  }

  return (
    <div className="mt-10 space-y-10">
      {/* Floor heatmap */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Carte de chaleur — Occupation
        </h2>
        <div className="mt-4 grid grid-cols-5 gap-3">
          {zoneOccupancy.map((zone) => (
            <div key={zone.name} className="text-center">
              <div
                className={`relative flex h-24 items-center justify-center rounded-xl border border-shell/10 ${getOccupancyColor(zone.occupancy)}`}
              >
                <span className="font-mono text-2xl font-bold text-shell tabular-nums" dir="ltr">
                  {zone.occupancy}%
                </span>
              </div>
              <p className="mt-2 text-xs text-shell-dim">{zone.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-6 text-[0.6rem] text-shell-dim">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-lagoon/60" /> &lt;50%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-brass/60" /> 50–79%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-coral/70" /> 80%+
          </span>
        </div>
      </section>

      {/* Metrics grouped by type */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Métriques récentes par type
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(metricsByType).map(([type, values]) => {
            const latest = values[0];
            const avg =
              values.reduce((s, v) => s + v.value, 0) / values.length;
            return (
              <div
                key={type}
                className="rounded-xl border border-shell/10 p-4"
              >
                <h3 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
                  {type}
                </h3>
                <div className="mt-2 flex items-baseline gap-4">
                  <div>
                    <p className="font-mono text-[0.6rem] text-shell-dim/80">
                      Dernière valeur
                    </p>
                    <p className="font-mono text-2xl tabular-nums text-shell" dir="ltr">
                      {latest?.value.toFixed(1) ?? "—"}
                      {latest?.unit ? ` ${latest.unit}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.6rem] text-shell-dim/80">
                      Moyenne ({values.length})
                    </p>
                    <p className="font-mono text-lg tabular-nums text-shell-dim" dir="ltr">
                      {avg.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(metricsByType).length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-shell-dim">
              Aucune métrique récente.
            </p>
          )}
        </div>
      </section>

      {/* Pricing rules table */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Règles de tarification dynamique
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Article</th>
                <th className="px-4 py-3 text-right">Multiplicateur</th>
                <th className="px-4 py-3 text-left">Conditions</th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pricingRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell">
                    {RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
                  </td>
                  <td className="px-4 py-3 text-xs text-shell-dim">
                    {rule.menuItemId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3"
                      defaultValue={rule.multiplier}
                      onBlur={(e) =>
                        handleMultiplierChange(rule.id, e.target.value)
                      }
                      disabled={isPending}
                      className="w-16 rounded border border-shell/20 bg-deep px-1.5 py-0.5 text-right font-mono text-xs text-shell tabular-nums focus:border-brass focus:outline-none disabled:opacity-30"
                      dir="ltr"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-shell-dim">
                    {typeof rule.conditions === "object" && rule.conditions !== null
                      ? JSON.stringify(rule.conditions).slice(0, 60)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                        rule.active
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-shell/20 text-shell-dim"
                      }`}
                    >
                      {rule.active ? "actif" : "inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      disabled={isPending}
                      className="rounded-full border border-shell/20 px-2 py-0.5 text-[0.6rem] text-shell-dim transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
                    >
                      {rule.active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pricingRules.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune règle de tarification dynamique.
          </p>
        )}
      </section>
    </div>
  );
}
