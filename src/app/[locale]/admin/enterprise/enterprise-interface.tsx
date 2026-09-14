"use client";

import { useState, useTransition } from "react";

import {
  createPropertyGroupAction,
  deletePropertyGroupAction,
} from "./actions";

type PropertyGroup = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  restaurants: unknown;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type GroupAnalyticsEntry = {
  id: string;
  groupId: string;
  period: Date;
  totalRevenue: number;
  totalCovers: number;
  avgSpend: number;
  topPerformers: unknown;
};

type Props = {
  groups: PropertyGroup[];
  analytics: GroupAnalyticsEntry[];
};

export function EnterpriseInterface({ groups, analytics }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPropertyGroupAction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
      }
    });
  }

  function handleDelete(groupId: string) {
    const fd = new FormData();
    fd.set("groupId", groupId);
    startTransition(async () => {
      await deletePropertyGroupAction(fd);
    });
  }

  return (
    <div className="mt-10">
      {/* Cross-property metrics */}
      {analytics.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-shell">
            Métriques cross-property
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                  <th className="px-4 py-3 text-left">Période</th>
                  <th className="px-4 py-3 text-right">Revenu</th>
                  <th className="px-4 py-3 text-right">Couverts</th>
                  <th className="px-4 py-3 text-right">Panier moy.</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 10).map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                  >
                    <td className="px-4 py-3 text-shell-dim">
                      {new Date(a.period).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                      {(a.totalRevenue / 100).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                      {a.totalCovers.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                      {(a.avgSpend / 100).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Create group */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-shell">Groupes</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full border border-brass/40 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
          >
            {showForm ? "Annuler" : "+ Créer un groupe"}
          </button>
        </div>

        {showForm && (
          <form
            action={handleCreate}
            className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
          >
            <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
              Nouveau groupe
            </h3>
            {error && (
              <p className="mt-2 text-sm text-coral">{error}</p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                name="name"
                required
                placeholder="Nom du groupe"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
              <input
                name="slug"
                required
                placeholder="slug-groupe"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
              <input
                name="ownerEmail"
                type="email"
                required
                placeholder="proprietaire@email.com"
                className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10 disabled:opacity-30"
              >
                {isPending ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Groups table */}
      <section className="mt-6">
        <div className="overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Propriétaire</th>
                <th className="px-4 py-3 text-right">Établissements</th>
                <th className="px-4 py-3 text-right">Créé</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr
                  key={g.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 font-medium text-shell">{g.name}</td>
                  <td className="px-4 py-3 text-shell-dim">{g.slug}</td>
                  <td className="px-4 py-3 text-shell-dim">{g.ownerEmail}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums" dir="ltr">
                    {(g.restaurants as string[]).length}
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(g.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={isPending}
                      className="text-xs text-coral/60 hover:text-coral disabled:opacity-30"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucun groupe configuré. Créez-en un pour commencer.
          </p>
        )}
      </section>
    </div>
  );
}
