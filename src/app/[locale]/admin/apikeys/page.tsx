import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clés API",
};

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id
    : null;

  if (!restaurantId) notFound();

  const apiKeys = await db.apiKey.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      active: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = apiKeys.filter((k) => k.active).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Clés API</h1>
        <Link
          href={`/${locale}/admin/security`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour à la sécurité
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Clés actives
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-lagoon">
            {activeCount}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Total
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell">
            {apiKeys.length}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-shell">Clés</h2>
        </div>

        {apiKeys.length === 0 ? (
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
                    Dernière utilisation
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Créée le
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-deep/30">
                    <td className="px-5 py-3 text-shell">{key.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                      {key.keyPrefix}…
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                      {key.lastUsedAt
                        ? new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(key.lastUsedAt)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(key.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {key.active ? (
                        <span className="rounded-full border border-lagoon/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-lagoon">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full border border-coral/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-coral">
                          Révoquée
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-brass/35 pt-6">
        <p className="text-sm leading-relaxed text-shell-dim">
          Les clés API sont utilisées pour l&apos;authentification des webhooks
          entrants et des intégrations externes. La clé complète n&apos;est
          affichée qu&apos;une seule fois lors de sa création.
        </p>
      </div>
    </div>
  );
}
