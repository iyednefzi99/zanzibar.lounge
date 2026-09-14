import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PersonalizationInterface } from "./personalization-interface";

export const dynamic = "force-dynamic";

export default async function PersonalizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [profiles, recommendations, acceptedRecs, tierStats] = await Promise.all([
    db.guestAiProfile.findMany({
      orderBy: { lastAnalyzed: "desc" },
      take: 30,
    }),
    db.recommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.recommendation.count({ where: { accepted: true } }),
    db.guestAiProfile.groupBy({
      by: ["loyaltyTier"],
      _count: true,
    }),
  ]);

  const totalRecs = recommendations.length;
  const pendingRecs = recommendations.filter((r) => r.accepted === null).length;
  const acceptRate =
    totalRecs > 0 ? Math.round((acceptedRecs / totalRecs) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Personnalisation IA</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Profils IA" value={String(profiles.length)} />
        <Kpi label="Recommandations" value={String(totalRecs)} />
        <Kpi label="Taux d'acceptation" value={`${acceptRate}%`} />
        <Kpi label="En attente" value={String(pendingRecs)} />
      </div>

      {/* Tier stats */}
      {tierStats.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl text-shell">
            Répartition par fidélité
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tierStats.map((t) => (
              <div key={t.loyaltyTier} className="border-t border-brass/35 pt-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                  {t.loyaltyTier}
                </p>
                <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell" dir="ltr">
                  {t._count}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <PersonalizationInterface
        profiles={profiles}
        recommendations={recommendations}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell" dir="ltr">
        {value}
      </p>
    </div>
  );
}
