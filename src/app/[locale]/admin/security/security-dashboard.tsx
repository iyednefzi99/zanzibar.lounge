"use client";

import { useCallback, useState } from "react";

import { TotpSetup } from "@/components/totp-setup";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  active: boolean;
};

type AuditLogEntry = {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: Date;
};

type Props = {
  restaurantId: string;
  staffMembers: StaffMember[];
  auditLogs: AuditLogEntry[];
  webhookCount: number;
  apiKeyCount: number;
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "2fa.enabled": "2FA activée",
  "2fa.disabled": "2FA désactivée",
  "2fa.verification_failed": "Code 2FA invalide",
  "2fa.secret_generated": "Secret 2FA généré",
  "webhook.created": "Webhook créé",
  "webhook.deleted": "Webhook supprimé",
  "apikey.created": "Clé API créée",
  "apikey.revoked": "Clé API révoquée",
  "staff.login": "Connexion",
  "staff.created": "Membre créé",
  "staff.deactivated": "Membre désactivé",
  "staff.role_updated": "Rôle modifié",
};

function formatAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "—";
  const entries = Object.entries(details as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
}

export function SecurityDashboard({
  staffMembers,
  auditLogs,
  webhookCount,
  apiKeyCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"2fa" | "audit" | "apikeys">(
    "2fa",
  );
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = useCallback(async () => {
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    setError(null);
    setNewKeyValue(null);

    try {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la génération");
        return;
      }

      setNewKeyValue(data.key);
      setNewKeyName("");
    } catch {
      setError("Erreur réseau");
    } finally {
      setGeneratingKey(false);
    }
  }, [newKeyName]);

  return (
    <div className="mt-8 space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Membres"
          value={String(staffMembers.filter((s) => s.active).length)}
        />
        <StatCard
          label="2FA activée"
          value={String(staffMembers.filter((s) => s.twoFactorEnabled).length)}
        />
        <StatCard label="Webhooks" value={String(webhookCount)} />
        <StatCard label="Clés API" value={String(apiKeyCount)} />
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-shell/12">
        {[
          { key: "2fa" as const, label: "Authentification 2FA" },
          { key: "audit" as const, label: "Journal d'audit" },
          { key: "apikeys" as const, label: "Clés API" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-brass text-brass"
                : "border-transparent text-shell-dim hover:text-shell"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 2FA Tab */}
      {activeTab === "2fa" && (
        <section className="space-y-4">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            Configuration 2FA par membre
          </h2>
          <div className="space-y-4">
            {staffMembers
              .filter((s) => s.active)
              .map((staff) => (
                <TotpSetup
                  key={staff.id}
                  staffId={staff.id}
                  isEnabled={staff.twoFactorEnabled}
                />
              ))}
          </div>
        </section>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <section>
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            Journal d&apos;audit
          </h2>
          {auditLogs.length === 0 ? (
            <p className="mt-4 text-sm text-shell-dim">
              Aucune action enregistrée pour le moment.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-shell/12 text-shell-dim/80">
                    <th className="pb-2 font-mono text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="pb-2 font-mono text-xs uppercase tracking-wider">
                      Action
                    </th>
                    <th className="pb-2 font-mono text-xs uppercase tracking-wider">
                      Acteur
                    </th>
                    <th className="pb-2 font-mono text-xs uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-shell/8">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="text-shell-dim">
                      <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs tabular-nums">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4">
                        <span className="inline-flex items-center rounded-full border border-shell/20 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-xs">
                        {log.actorEmail ?? "Système"}
                      </td>
                      <td className="max-w-xs truncate py-2.5 text-xs text-shell-dim/70">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* API Keys Tab */}
      {activeTab === "apikeys" && (
        <section className="space-y-4">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            Clés API
          </h2>
          <p className="text-sm text-shell-dim">
            Les clés API sont utilisées pour authentifier les requêtes webhook
            entrantes vers votre API.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nom de la clé"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 rounded border border-shell/25 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGenerateKey}
              disabled={generatingKey || !newKeyName.trim()}
              className="rounded bg-brass px-4 py-2 text-sm font-medium text-night transition hover:bg-brass/80 disabled:opacity-50"
            >
              {generatingKey ? "Génération..." : "Générer une clé"}
            </button>
          </div>

          {newKeyValue && (
            <div className="rounded-lg border border-lagoon/30 bg-lagoon/5 p-4">
              <p className="text-xs font-medium text-lagoon">
                Nouvelle clé API (affichée une seule fois) :
              </p>
              <code className="mt-2 block break-all font-mono text-sm text-shell">
                {newKeyValue}
              </code>
              <p className="mt-2 text-xs text-shell-dim">
                Copiez cette clé et stockez-la en lieu sûr. Elle ne sera plus
                affichée.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-coral">{error}</p>}
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-shell-dim/20 bg-night p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell">
        {value}
      </p>
    </div>
  );
}
