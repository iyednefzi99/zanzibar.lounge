"use client";

import { useTransition } from "react";

import { updateRecommendationStatusAction } from "./actions";

type AiProfile = {
  id: string;
  guestId: string;
  preferences: unknown;
  visitPatterns: unknown;
  loyaltyTier: string;
  lifetimeValue: number;
  lastAnalyzed: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Recommendation = {
  id: string;
  guestId: string;
  restaurantId: string;
  type: string;
  title: string;
  description: string | null;
  score: number;
  accepted: boolean | null;
  createdAt: Date;
};

type Props = {
  profiles: AiProfile[];
  recommendations: Recommendation[];
};

const REC_TYPE_LABELS: Record<string, string> = {
  dish: "Plat",
  drink: "Boisson",
  upsell: "Upsell",
  return_visit: "Retour",
};

export function PersonalizationInterface({
  profiles,
  recommendations,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleAccept(recId: string, accepted: boolean) {
    const fd = new FormData();
    fd.set("recId", recId);
    fd.set("accepted", String(accepted));
    startTransition(async () => {
      await updateRecommendationStatusAction(fd);
    });
  }

  return (
    <div className="mt-10 space-y-10">
      {/* Recent recommendations */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Recommandations récentes
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Titre</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell">
                    {REC_TYPE_LABELS[rec.type] ?? rec.type}
                  </td>
                  <td className="px-4 py-3 font-medium text-shell">{rec.title}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                    {rec.score.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-xs text-shell-dim">
                    {rec.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                        rec.accepted === true
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : rec.accepted === false
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {rec.accepted === true
                        ? "acceptée"
                        : rec.accepted === false
                          ? "refusée"
                          : "en attente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {rec.accepted === null && (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleAccept(rec.id, true)}
                          disabled={isPending}
                          className="rounded-full border border-green-500/40 px-2 py-0.5 text-[0.6rem] text-green-400 transition-colors hover:bg-green-500/10 disabled:opacity-30"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleAccept(rec.id, false)}
                          disabled={isPending}
                          className="rounded-full border border-red-500/40 px-2 py-0.5 text-[0.6rem] text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-30"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recommendations.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune recommandation générée.
          </p>
        )}
      </section>

      {/* AI profiles table */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Profils IA récents
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Invité</th>
                <th className="px-4 py-3 text-left">Niveau</th>
                <th className="px-4 py-3 text-right">Valeur vie</th>
                <th className="px-4 py-3 text-right">Dernière analyse</th>
                <th className="px-4 py-3 text-right">Créé</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-shell">
                    {p.guestId.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                        p.loyaltyTier === "vip"
                          ? "border-brass/60 bg-brass/10 text-brass"
                          : p.loyaltyTier === "premium"
                            ? "border-lagoon/40 bg-lagoon/10 text-lagoon"
                            : "border-shell/20 text-shell-dim"
                      }`}
                    >
                      {p.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                    {(p.lifetimeValue / 100).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                    })}{" "}
                    €
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {p.lastAnalyzed
                      ? new Date(p.lastAnalyzed).toLocaleDateString("fr-FR")
                      : "jamais"}
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucun profil IA créé.
          </p>
        )}
      </section>
    </div>
  );
}
