"use client";

import { useState } from "react";

type PosIntegration = {
  id: string;
  provider: string;
  syncStatus: string;
  lastSyncAt: string | null;
  syncMenu: boolean;
  syncOrders: boolean;
  syncPayments: boolean;
};

const PROVIDERS = [
  { id: "toast", name: "Toast", description: "POS restaurant populaire" },
  { id: "square", name: "Square", description: "Paiements et POS" },
  { id: "lightspeed", name: "Lightspeed", description: "POS et e-commerce" },
  { id: "clover", name: "Clover", description: "Système de caisse" },
  { id: "custom", name: "Personnalisé", description: "API REST personnalisée" },
] as const;

export function PosConfigManager({ integrations }: { integrations: PosIntegration[] }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [locationId, setLocationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const existingMap = new Map(integrations.map((i) => [i.provider, i]));

  async function handleSave() {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      await fetch("/api/integrations/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
          apiSecret,
          locationId,
          syncMenu: true,
          syncOrders: false,
          syncPayments: false,
        }),
      });
      setSelectedProvider(null);
      setApiKey("");
      setApiSecret("");
      setLocationId("");
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(provider: string) {
    setSyncing(provider);
    try {
      await fetch("/api/integrations/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, type: "menu" }),
      });
      window.location.reload();
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(provider: string) {
    if (!confirm("Supprimer cette intégration ?")) return;
    await fetch(`/api/integrations/pos?provider=${provider}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => {
          const existing = existingMap.get(p.id);
          return (
            <div
              key={p.id}
              className={`rounded-xl border p-5 transition-colors ${
                existing
                  ? "border-lagoon/30 bg-lagoon/5"
                  : "border-shell/10 bg-deep/40 hover:border-shell/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg text-shell">{p.name}</h3>
                  <p className="mt-1 text-sm text-shell-dim">{p.description}</p>
                </div>
                {existing && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.65rem] uppercase ${
                      existing.syncStatus === "syncing"
                        ? "bg-brass/15 text-brass"
                        : existing.syncStatus === "error"
                          ? "bg-coral/15 text-coral"
                          : "bg-lagoon/15 text-lagoon"
                    }`}
                  >
                    {existing.syncStatus === "syncing" ? "Sync..." : existing.syncStatus === "error" ? "Erreur" : "Connecté"}
                  </span>
                )}
              </div>

              {existing ? (
                <div className="mt-4 space-y-2">
                  {existing.lastSyncAt && (
                    <p className="text-xs text-shell-dim">
                      Dernière sync : {new Date(existing.lastSyncAt).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(p.id)}
                      disabled={syncing === p.id}
                      className="rounded-lg bg-brass/10 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/20 disabled:opacity-50"
                    >
                      {syncing === p.id ? "Sync..." : "Synchroniser"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg bg-coral/10 px-3 py-1.5 text-xs text-coral transition-colors hover:bg-coral/20"
                    >
                      Déconnecter
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedProvider(p.id)}
                  className="mt-4 rounded-lg border border-shell/20 px-3 py-1.5 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass"
                >
                  Connecter
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Config modal */}
      {selectedProvider && (
        <div className="rounded-xl border border-shell/20 bg-deep/80 p-6 backdrop-blur">
          <h3 className="font-display text-xl text-shell">
            Configurer {PROVIDERS.find((p) => p.id === selectedProvider)?.name}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-shell-dim">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
                placeholder="Entrez votre API key"
              />
            </div>
            <div>
              <label className="block text-sm text-shell-dim">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
                placeholder="Entrez votre API secret"
              />
            </div>
            <div>
              <label className="block text-sm text-shell-dim">Location ID</label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
                placeholder="ID du lieu (optionnel)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !apiKey}
                className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-deep transition-colors hover:bg-brass/90 disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => setSelectedProvider(null)}
                className="rounded-lg border border-shell/20 px-4 py-2 text-sm text-shell-dim transition-colors hover:border-shell/40"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
