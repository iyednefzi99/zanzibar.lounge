import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prédictions — Opérations",
};

export default async function PredictPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id
    : null;

  if (!restaurantId) notFound();

  const [wasteCount, forecastCount, menuCount] = await Promise.all([
    db.wasteLog.count({ where: { restaurantId } }),
    db.demandForecast.count({ where: { restaurantId } }),
    db.menuEngineering.count({ where: { restaurantId } }),
  ]);

  const recentWaste = await db.wasteLog.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      category: true,
      quantity: true,
      unit: true,
      reason: true,
      costCents: true,
      createdAt: true,
    },
  });

  const topMenuItems = await db.menuEngineering.findMany({
    where: { restaurantId, category: "star" },
    orderBy: { popularityRank: "asc" },
    take: 5,
    select: {
      id: true,
      menuItemId: true,
      marginPercent: true,
      popularityRank: true,
      category: true,
    },
  });

  const totalWasteCost = recentWaste.reduce((s, w) => s + w.costCents, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">
          Prédictions — Opérations
        </h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-deep bg-deep/40 p-6">
          <h2 className="text-sm font-medium text-shell-dim">Gaspillage</h2>
          <p className="mt-2 font-display text-3xl text-coral">
            {wasteCount}
          </p>
          <p className="mt-1 text-xs text-shell-dim">
            {(totalWasteCost / 100).toFixed(2)} € coût total
          </p>
        </div>
        <div className="rounded-xl border border-deep bg-deep/40 p-6">
          <h2 className="text-sm font-medium text-shell-dim">Prévisions</h2>
          <p className="mt-2 font-display text-3xl text-lagoon">
            {forecastCount}
          </p>
          <p className="mt-1 text-xs text-shell-dim">entrées créées</p>
        </div>
        <div className="rounded-xl border border-deep bg-deep/40 p-6">
          <h2 className="text-sm font-medium text-shell-dim">
            Ingénierie Menu
          </h2>
          <p className="mt-2 font-display text-3xl text-brass">{menuCount}</p>
          <p className="mt-1 text-xs text-shell-dim">articles analysés</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Derniers gaspillages</h2>
        {recentWaste.length === 0 ? (
          <p className="mt-4 text-sm text-shell-dim">Aucune trace enregistrée.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-deep">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-deep bg-deep/60 text-left text-shell-dim">
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2">Quantité</th>
                  <th className="px-4 py-2">Raison</th>
                  <th className="px-4 py-2">Coût</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentWaste.map((w) => (
                  <tr key={w.id} className="border-b border-deep/50">
                    <td className="px-4 py-2 capitalize text-shell">
                      {w.category}
                    </td>
                    <td className="px-4 py-2 text-shell-dim">
                      {w.quantity} {w.unit}
                    </td>
                    <td className="px-4 py-2 text-shell-dim">{w.reason}</td>
                    <td className="px-4 py-2 text-coral">
                      {(w.costCents / 100).toFixed(2)} €
                    </td>
                    <td className="px-4 py-2 text-shell-dim">
                      {w.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">
          Top articles (étoiles)
        </h2>
        {topMenuItems.length === 0 ? (
          <p className="mt-4 text-sm text-shell-dim">
            Aucun score ingénierie disponible.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {topMenuItems.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-deep bg-deep/40 px-4 py-3"
              >
                <div>
                  <span className="text-xs text-brass">#{m.popularityRank}</span>
                  <span className="ml-2 text-sm text-shell">{m.menuItemId}</span>
                </div>
                <span className="text-sm text-lagoon">
                  {m.marginPercent.toFixed(1)}% marge
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
