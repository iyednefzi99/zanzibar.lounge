"use client";

import { useState, useTransition } from "react";

import {
  addCarbonLogAction,
  updateComplianceStatusAction,
} from "./actions";

type CarbonLogEntry = {
  id: string;
  restaurantId: string;
  category: string;
  amount: number;
  unit: string;
  source: string | null;
  period: Date;
  createdAt: Date;
};

type ComplianceCheckEntry = {
  id: string;
  restaurantId: string;
  type: string;
  status: string;
  details: unknown;
  checkedAt: Date;
  expiresAt: Date | null;
};

type Props = {
  carbonLogs: CarbonLogEntry[];
  complianceChecks: ComplianceCheckEntry[];
  wasteByCategory: Record<string, number>;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  passed: "border-green-500/40 bg-green-500/10 text-green-400",
  failed: "border-red-500/40 bg-red-500/10 text-red-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  energy: "Énergie",
  transport: "Transport",
  waste: "Déchets",
  water: "Eau",
};

export function SustainabilityInterface({
  carbonLogs,
  complianceChecks,
  wasteByCategory,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddCarbon(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addCarbonLogAction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
      }
    });
  }

  function handleStatusChange(checkId: string, status: string) {
    const fd = new FormData();
    fd.set("checkId", checkId);
    fd.set("status", status);
    startTransition(async () => {
      await updateComplianceStatusAction(fd);
    });
  }

  const maxWaste = Math.max(...Object.values(wasteByCategory), 1);

  return (
    <div className="mt-10 space-y-10">
      {/* Waste summary bar chart */}
      {Object.keys(wasteByCategory).length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-shell">
            Déchets par catégorie
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(wasteByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([name, amount]) => (
                <div key={name} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 text-sm text-shell-dim">
                    {name}
                  </span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-deep">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-lagoon/60"
                      style={{ width: `${(amount / maxWaste) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-xs tabular-nums text-shell" dir="ltr">
                    {amount.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Carbon logs table */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-shell">
            Journal carbone (30j)
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full border border-brass/40 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
          >
            {showForm ? "Annuler" : "+ Ajouter"}
          </button>
        </div>

        {showForm && (
          <form
            action={handleAddCarbon}
            className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
          >
            {error && <p className="text-sm text-coral">{error}</p>}
            <div className="mt-2 grid gap-3 sm:grid-cols-4">
              <select
                name="category"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              >
                <option value="energy">Énergie</option>
                <option value="transport">Transport</option>
                <option value="waste">Déchets</option>
                <option value="water">Eau</option>
              </select>
              <input
                name="amount"
                type="number"
                step="0.1"
                required
                placeholder="Montant"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
              <input
                name="unit"
                required
                placeholder="Unité (kgCO2, kWh)"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
              <input
                name="source"
                placeholder="Source"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-3 rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10 disabled:opacity-30"
            >
              {isPending ? "Ajout…" : "Ajouter"}
            </button>
          </form>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-left">Unité</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {carbonLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell">
                    {CATEGORY_LABELS[log.category] ?? log.category}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                    {log.amount.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-4 py-3 text-shell-dim">{log.unit}</td>
                  <td className="px-4 py-3 text-shell-dim">{log.source ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(log.period).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {carbonLogs.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune entrée carbone sur les 30 derniers jours.
          </p>
        )}
      </section>

      {/* Compliance checks table */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Vérifications de conformité
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Vérifié</th>
                <th className="px-4 py-3 text-right">Expire</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complianceChecks.map((check) => (
                <tr
                  key={check.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell">{check.type}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_COLORS[check.status] ?? "border-shell/20 text-shell-dim"}`}
                    >
                      {check.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(check.checkedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {check.expiresAt
                      ? new Date(check.expiresAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {["passed", "failed", "pending"].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(check.id, s)}
                          disabled={isPending || check.status === s}
                          className={`rounded-full border px-2 py-0.5 text-[0.6rem] transition-colors disabled:opacity-30 ${
                            check.status === s
                              ? "border-brass/60 text-brass"
                              : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {complianceChecks.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune vérification enregistrée.
          </p>
        )}
      </section>
    </div>
  );
}
