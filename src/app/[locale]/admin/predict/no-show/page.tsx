import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import { predictNoShow } from "@/lib/predict/no-show";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prédiction No-Show — Prédictions",
};

export default async function NoShowPredictPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();

  // Historical stats
  const totalReservations = await db.reservation.count({
    where: { restaurantId, status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
  });
  const noShows = await db.reservation.count({
    where: { restaurantId, status: "NO_SHOW" },
  });
  const noShowRate = totalReservations > 0 ? ((noShows / totalReservations) * 100).toFixed(1) : "0.0";

  // Upcoming reservations with risk scores
  const upcoming = await db.reservation.findMany({
    where: {
      restaurantId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { gte: new Date() },
    },
    include: {
      guest: { select: { name: true, phone: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  const reservationsWithRisk = await Promise.all(
    upcoming.map(async (res) => {
      const now = new Date();
      const leadTimeHours =
        (res.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isWeekend = [0, 6].includes(res.startsAt.getDay());

      let hasVisitedBefore = false;
      if (res.guestId) {
        const pastCount = await db.reservation.count({
          where: {
            restaurantId,
            guestId: res.guestId,
            status: "COMPLETED",
            id: { not: res.id },
          },
        });
        hasVisitedBefore = pastCount > 0;
      }

      const { probability, factors } = await predictNoShow(restaurantId, {
        guestId: res.guestId,
        partySize: res.partySize,
        leadTimeHours,
        isWeekend,
        hasVisitedBefore,
      });

      return {
        id: res.id,
        guestName: res.guest?.name ?? res.guest?.phone ?? "Anonyme",
        date: res.startsAt,
        partySize: res.partySize,
        probability,
        factors,
        reference: res.reference,
      };
    }),
  );

  const riskGroups = {
    low: reservationsWithRisk.filter((r) => r.probability < 0.3),
    medium: reservationsWithRisk.filter(
      (r) => r.probability >= 0.3 && r.probability < 0.6,
    ),
    high: reservationsWithRisk.filter((r) => r.probability >= 0.6),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl text-shell">
          Prédiction No-Show
        </h1>
        <p className="mt-2 text-sm text-shell-dim">
          Analyse du risque d&apos;absence pour les réservations à venir
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Total réservations
          </p>
          <p className="mt-2 font-mono text-3xl text-shell">{totalReservations}</p>
        </div>
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            No-Shows
          </p>
          <p className="mt-2 font-mono text-3xl text-coral">{noShows}</p>
        </div>
        <div className="rounded-xl border border-shell/10 bg-deep/40 p-5 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Taux no-show
          </p>
          <p className="mt-2 font-mono text-3xl text-brass">{noShowRate}%</p>
        </div>
      </div>

      {/* Risk breakdown */}
      {(["high", "medium", "low"] as const).map((level) => {
        const items = riskGroups[level];
        const colors = {
          high: "text-coral",
          medium: "text-brass",
          low: "text-lagoon",
        };
        const labels = {
          high: "Risque élevé",
          medium: "Risque moyen",
          low: "Risque faible",
        };
        return (
          <section key={level}>
            <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
              {labels[level]} ({items.length})
            </h2>
            <div className="mt-3 space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-shell-dim">Aucune réservation.</p>
              ) : (
                items.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-shell">
                        {res.guestName}
                      </p>
                      <p className="text-xs text-shell-dim">
                        {res.date.toLocaleDateString("fr-FR")} · {res.partySize}{" "}
                        pers. · {res.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-lg font-bold ${colors[level]}`}>
                        {Math.round(res.probability * 100)}%
                      </span>
                      {res.factors.length > 0 && (
                        <p className="mt-1 text-[0.6rem] text-shell-dim/60">
                          {res.factors.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
