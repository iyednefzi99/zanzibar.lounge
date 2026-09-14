import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const groups = await db.propertyGroup.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Multi-Propriétés</h1>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi label="Groupes" value={String(groups.length)} />
        <Kpi
          label="Établissements"
          value={String(
            groups.reduce((sum, g) => sum + (g.restaurants as string[]).length, 0),
          )}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Groupes
        </h2>
        <div className="mt-4 space-y-4">
          {groups.length === 0 ? (
            <p className="text-sm text-shell-dim">Aucun groupe configuré.</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="border-t border-brass/35 pt-4">
                <p className="font-medium text-shell">{g.name}</p>
                <p className="mt-1 text-sm text-shell-dim">
                  {(g.restaurants as string[]).length} établissement(s) · {g.slug}
                </p>
              </div>
            ))
          )}
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
