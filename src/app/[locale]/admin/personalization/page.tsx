import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PersonalizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [profileCount, recommendationCount, menuCount, tierStats] = await Promise.all([
    db.guestAiProfile.count(),
    db.recommendation.count(),
    db.personalizedMenu.count(),
    db.guestAiProfile.groupBy({
      by: ["loyaltyTier"],
      _count: true,
    }),
  ]);

  const totalRecommendations = recommendationCount;
  const acceptedRecs = await db.recommendation.count({ where: { accepted: true } });
  const acceptRate = totalRecommendations > 0 ? Math.round((acceptedRecs / totalRecommendations) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Personnalisation IA</h1>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Profils IA" value={String(profileCount)} />
        <Kpi label="Recommandations" value={String(totalRecommendations)} />
        <Kpi label="Taux d'acceptation" value={`${acceptRate}%`} />
        <Kpi label="Menus générés" value={String(menuCount)} />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
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
