import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suggestions d'horaires — Prédictions",
};

export default async function SchedulePredictPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();

  // Get current week start (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Staff list
  const staff = await db.staff.findMany({
    where: { restaurantId, active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  // Existing suggestion
  const existing = await db.scheduleSuggestion.findUnique({
    where: { restaurantId_weekStart: { restaurantId, weekStart } },
  });

  const suggestions = (existing?.suggestions as Record<string, string>[]) ?? [];

  // Historical demand per day of week
  const demandByDay = await db.reservation.groupBy({
    by: ["serviceDate"],
    where: { restaurantId, status: "COMPLETED" },
    _count: { id: true },
    orderBy: { serviceDate: "asc" },
    take: 28,
  });

  // Compute average covers per weekday
  const dayTotals: Record<number, { count: number; total: number }> = {};
  for (const d of demandByDay) {
    const date = new Date(d.serviceDate);
    const dow = date.getDay();
    if (!dayTotals[dow]) dayTotals[dow] = { count: 0, total: 0 };
    dayTotals[dow].count += 1;
    dayTotals[dow].total += d._count.id;
  }
  const avgDemand = Object.entries(dayTotals).map(([dow, v]) => ({
    day: Number(dow),
    avg: Math.round(v.total / v.count),
  }));

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl text-shell">
          Suggestions d&apos;horaires
        </h1>
        <p className="mt-2 text-sm text-shell-dim">
          Planning de la semaine du{" "}
          {weekStart.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Average demand */}
      <section>
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Demande moyenne par jour
        </h2>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {avgDemand
            .sort((a, b) => a.day - b.day)
            .map((d) => (
              <div
                key={d.day}
                className="rounded-lg border border-shell/10 bg-deep/40 p-3 text-center"
              >
                <p className="text-[0.65rem] text-shell-dim">{dayNames[d.day]}</p>
                <p className="mt-1 font-mono text-lg text-shell">{d.avg}</p>
                <p className="text-[0.6rem] text-shell-dim/50">couverts</p>
              </div>
            ))}
        </div>
      </section>

      {/* Staff list */}
      <section>
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Équipe active
        </h2>
        <div className="mt-3 space-y-1">
          {staff.length === 0 ? (
            <p className="text-sm text-shell-dim">Aucun membre actif.</p>
          ) : (
            staff.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-2 text-sm"
              >
                <span className="text-shell">{s.name}</span>
                <span className="text-xs text-shell-dim">{s.role}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Existing suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            Suggestions IA
          </h2>
          <div className="mt-3 space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-shell">
                    {s.staffId ?? `Staff #${i + 1}`}
                  </p>
                  <p className="text-xs text-shell-dim">{s.shift ?? "—"}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-brass">
                    Confiance: {Math.round((Number(s.confidence) || 0.7) * 100)}%
                  </span>
                  {s.reason && (
                    <p className="mt-1 text-[0.6rem] text-shell-dim/60">
                      {s.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {suggestions.length === 0 && (
        <div className="rounded-xl border border-shell/10 bg-deep/40 py-10 text-center">
          <p className="text-shell-dim">
            Aucune suggestion disponible. Générez un planning via l&apos;API.
          </p>
        </div>
      )}
    </div>
  );
}
