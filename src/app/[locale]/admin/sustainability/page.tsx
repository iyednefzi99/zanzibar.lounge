import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { SustainabilityInterface } from "./sustainability-interface";

export const dynamic = "force-dynamic";

export default async function SustainabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [carbonLogs, complianceChecks, carbonCount, pendingChecks, failedChecks] =
    await Promise.all([
      db.carbonLog.findMany({
        where: { period: { gte: thirtyDaysAgo } },
        orderBy: { period: "desc" },
        take: 50,
      }),
      db.complianceCheck.findMany({
        orderBy: { checkedAt: "desc" },
        take: 30,
      }),
      db.carbonLog.count({ where: { period: { gte: thirtyDaysAgo } } }),
      db.complianceCheck.count({ where: { status: "pending" } }),
      db.complianceCheck.count({ where: { status: "failed" } }),
    ]);

  const wasteByCategory: Record<string, number> = {};
  carbonLogs.forEach((log) => {
    if (log.category === "waste") {
      wasteByCategory[log.source ?? "Autre"] =
        (wasteByCategory[log.source ?? "Autre"] ?? 0) + log.amount;
    }
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Durabilité &amp; Conformité</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Entrées carbone (30j)" value={String(carbonCount)} />
        <Kpi label="Vérifications" value={String(complianceChecks.length)} />
        <Kpi label="En attente" value={String(pendingChecks)} />
        <Kpi label="Échouées" value={String(failedChecks)} />
      </div>

      <SustainabilityInterface
        carbonLogs={carbonLogs}
        complianceChecks={complianceChecks}
        wasteByCategory={wasteByCategory}
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
