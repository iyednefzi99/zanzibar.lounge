import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { EnterpriseInterface } from "./enterprise-interface";

export const dynamic = "force-dynamic";

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const [groups, analytics] = await Promise.all([
    db.propertyGroup.findMany({ orderBy: { name: "asc" } }),
    db.groupAnalytics.findMany({ orderBy: { period: "desc" }, take: 50 }),
  ]);

  const totalRestaurants = groups.reduce(
    (sum, g) => sum + (g.restaurants as string[]).length,
    0,
  );
  const totalRevenue = analytics.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalCovers = analytics.reduce((sum, a) => sum + a.totalCovers, 0);
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Multi-Propriétés</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Groupes" value={String(groups.length)} />
        <Kpi label="Établissements" value={String(totalRestaurants)} />
        <Kpi
          label="Revenu total"
          value={`${(totalRevenue / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €`}
        />
        <Kpi label="Couverts" value={totalCovers.toLocaleString("fr-FR")} />
      </div>

      <EnterpriseInterface
        groups={groups}
        analytics={analytics}
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
