"use client";

import { useState } from "react";
import { generateKey, revokeKey } from "./actions";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  active: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
};

export default function ApiKeysInterface({ keys }: { keys: ApiKeyRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    setLoading(true);
    const result = await generateKey(newKeyName.trim());
    setGeneratedKey(result.rawKey);
    setNewKeyName("");
    setLoading(false);
    window.location.reload();
  }

  async function handleRevoke(id: string) {
    await revokeKey(id);
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-shell">Clés</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-brass bg-brass px-4 text-xs font-medium text-deep transition-colors hover:bg-brass/80"
        >
          {showForm ? "Annuler" : "Générer une clé"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-brass/30 bg-deep/40 p-5">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de la clé"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !newKeyName.trim()}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-lagoon bg-lagoon/20 px-4 text-xs font-medium text-lagoon transition-colors hover:bg-lagoon/30 disabled:opacity-40"
            >
              {loading ? "Génération..." : "Générer"}
            </button>
          </div>
        </div>
      )}

      {generatedKey && (
        <div className="mt-4 rounded-xl border border-lagoon/40 bg-lagoon/5 p-5">
          <p className="text-xs text-lagoon">
            Copiez cette clé, elle ne sera plus affichée :
          </p>
          <code className="mt-2 block break-all font-mono text-xs text-shell">
            {generatedKey}
          </code>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="mt-8 py-8 text-center text-shell-dim">
          Aucune clé API configurée.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-shell/12">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-shell/12 bg-deep/60">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                  Nom
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                  Préfixe
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                  Statut
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-shell/8">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-deep/30">
                  <td className="px-5 py-3 text-shell">{k.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                    {k.keyPrefix}…
                  </td>
                  <td className="px-5 py-3">
                    {k.active ? (
                      <span className="rounded-full border border-lagoon/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-lagoon">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-coral/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-coral">
                        Révoquée
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {k.active && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="inline-flex min-h-7 items-center justify-center rounded-full border border-coral/40 px-3 text-[0.65rem] font-medium text-coral transition-colors hover:bg-coral/10"
                      >
                        Révoquer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
