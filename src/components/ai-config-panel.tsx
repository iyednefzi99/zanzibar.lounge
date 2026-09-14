"use client";

import { useEffect, useState } from "react";

type AiConfig = {
  id: string;
  restaurantId: string;
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  dailyBudgetCents: number;
  monthlyBudgetCents: number;
  enabled: boolean;
  fallbackProvider: string | null;
  fallbackModel: string | null;
};

type AuditLog = {
  id: string;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
};

type CostSummary = {
  totalCostCents: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
};

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "local", label: "Local" },
];

const MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3-haiku-20240307",
  "gpt-4o",
  "gpt-4o-mini",
];

const OPERATION_LABELS: Record<string, string> = {
  chat: "Chat",
  voice: "Voix",
  menu_gen: "Génération menu",
  review_reply: "Réponse avis",
  reservation: "Réservation",
};

export function AiConfigPanel({ restaurantId: _restaurantId }: { restaurantId: string }) {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cost, setCost] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [configRes, auditRes, costRes] = await Promise.all([
          fetch("/api/admin/ai/config"),
          fetch("/api/admin/ai/audit?limit=20"),
          fetch("/api/admin/ai/config?summary=true"),
        ]);

        if (!cancelled && configRes.ok) {
          const data = await configRes.json();
          setConfig(data.config ?? null);
        }

        if (!cancelled && auditRes.ok) {
          const data = await auditRes.json();
          setLogs(data.logs ?? []);
        }

        if (!cancelled && costRes.ok) {
          const data = await costRes.json();
          setCost(data.summary ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch AI data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      provider: formData.get("provider") as string,
      model: formData.get("model") as string,
      maxTokens: Number(formData.get("maxTokens")),
      temperature: Number(formData.get("temperature")),
      dailyBudgetCents: Number(formData.get("dailyBudgetCents")),
      monthlyBudgetCents: Number(formData.get("monthlyBudgetCents")),
      enabled: formData.get("enabled") === "on",
      fallbackProvider: formData.get("fallbackProvider") as string || null,
      fallbackModel: formData.get("fallbackModel") as string || null,
    };

    try {
      const res = await fetch("/api/admin/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setMessage("Configuration sauvegardée");
      } else {
        setMessage("Erreur lors de la sauvegarde");
      }
    } catch {
      setMessage("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-sm text-shell-dim">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Cost summary */}
      {cost && (
        <section className="border-t border-brass/35 pt-6">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            Coûts IA — 30 jours
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <CostTile label="Coût total" value={`${(cost.totalCostCents / 100).toFixed(2)} €`} />
            <CostTile label="Requêtes" value={String(cost.totalRequests)} />
            <CostTile label="Tokens entrée" value={formatTokens(cost.totalInputTokens)} />
            <CostTile label="Tokens sortie" value={formatTokens(cost.totalOutputTokens)} />
          </div>
        </section>
      )}

      {/* Config form */}
      <section className="border-t border-brass/35 pt-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Configuration
        </h2>
        <form onSubmit={handleSave} className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Provider">
              <select
                name="provider"
                defaultValue={config?.provider ?? "anthropic"}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Modèle">
              <select
                name="model"
                defaultValue={config?.model ?? "claude-sonnet-4-20250514"}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Max tokens">
              <input
                type="number"
                name="maxTokens"
                defaultValue={config?.maxTokens ?? 1024}
                min={1}
                max={8192}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              />
            </Field>

            <Field label="Température">
              <input
                type="number"
                name="temperature"
                defaultValue={config?.temperature ?? 0.7}
                min={0}
                max={2}
                step={0.1}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              />
            </Field>

            <Field label="Budget journalier (centimes)">
              <input
                type="number"
                name="dailyBudgetCents"
                defaultValue={config?.dailyBudgetCents ?? 5000}
                min={0}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              />
            </Field>

            <Field label="Budget mensuel (centimes)">
              <input
                type="number"
                name="monthlyBudgetCents"
                defaultValue={config?.monthlyBudgetCents ?? 100000}
                min={0}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              />
            </Field>

            <Field label="Provider de secours">
              <select
                name="fallbackProvider"
                defaultValue={config?.fallbackProvider ?? ""}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              >
                <option value="">Aucun</option>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Modèle de secours">
              <select
                name="fallbackModel"
                defaultValue={config?.fallbackModel ?? ""}
                className="w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
              >
                <option value="">Aucun</option>
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-shell">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={config?.enabled ?? true}
                className="size-4 rounded border-shell/30 bg-deep/60 text-lagoon focus:ring-lagoon"
              />
              IA activée
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-50"
            >
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
            {message && (
              <span className="font-mono text-xs text-shell-dim">{message}</span>
            )}
          </div>
        </form>
      </section>

      {/* Audit logs */}
      <section className="border-t border-brass/35 pt-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Journal d&apos;audit
        </h2>
        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-shell-dim">Aucune requête IA enregistrée.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-shell/12 text-shell-dim/80">
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest">Opération</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest">Provider</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest">Modèle</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-right">Tokens</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-right">Latence</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-right">Coût</th>
                  <th className="pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {logs.map((log) => (
                  <tr key={log.id} className="text-shell">
                    <td className="py-2 pr-4">{OPERATION_LABELS[log.operation] ?? log.operation}</td>
                    <td className="py-2 pr-4">{log.provider}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.model}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums">
                      {log.inputTokens + log.outputTokens}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums">
                      {(log.costCents / 100).toFixed(4)} €
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                          log.success
                            ? "border border-lagoon/50 text-lagoon"
                            : "border border-coral/50 text-coral"
                        }`}
                      >
                        {log.success ? "OK" : "Erreur"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function CostTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell"
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
