import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { InnovationInterface } from "./innovation-interface";

export const dynamic = "force-dynamic";

export default async function InnovationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [socialProofEvents, maintenanceAlerts, badgeDistribution, sentimentData] =
    await Promise.all([
      db.socialProofEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.maintenanceAlert.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.gamificationBadge.groupBy({
        by: ["badgeType"],
        _count: true,
        orderBy: { _count: { badgeType: "desc" } },
      }),
      db.review.findMany({
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { rating: true },
      }),
    ]);

  const avgSentiment =
    sentimentData.length > 0
      ? Math.round(
          (sentimentData.reduce((s, r) => s + r.rating, 0) /
            sentimentData.length) *
            10,
        ) / 10
      : 0;

  const activeAlerts = maintenanceAlerts.filter((a) => a.status === "active");
  const activeSocialProof = socialProofEvents.filter((e) => e.active);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Innovation Lab</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Preuves sociales" value={String(activeSocialProof.length)} />
        <Kpi label="Alertes actives" value={String(activeAlerts.length)} />
        <Kpi label="Badges émis" value={String(badgeDistribution.reduce((s, b) => s + b._count, 0))} />
        <Kpi label="Sentiment moyen" value={`${avgSentiment}/5`} />
      </div>

      <InnovationInterface
        socialProofEvents={socialProofEvents}
        maintenanceAlerts={maintenanceAlerts}
        badgeDistribution={badgeDistribution}
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
