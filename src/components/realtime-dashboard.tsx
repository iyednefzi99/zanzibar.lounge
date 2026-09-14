"use client";

import { useEffect, useState, useCallback } from "react";

import type { RealtimeStats } from "@/lib/analytics-advanced";

export function RealtimeDashboard({
  initialStats,
}: {
  initialStats: RealtimeStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/realtime", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastRefresh(new Date());
      }
    } catch {
      // Silent fail — next interval will retry
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const revenueDiff = stats.revenueToday - stats.revenueYesterday;
  const revenueTrend =
    stats.revenueYesterday > 0
      ? Math.round((revenueDiff / stats.revenueYesterday) * 100)
      : 0;

  return (
    <div className="mt-8 space-y-10">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-lagoon opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-lagoon" />
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-lagoon">
          En direct
        </span>
        <span className="font-mono text-xs text-shell-dim" dir="ltr">
          {lastRefresh.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi
          label="Réservations actives"
          value={String(stats.activeReservations)}
        />
        <Kpi label="Installés" value={String(stats.seatedNow)} />
        <Kpi
          label="Arrivées (1h)"
          value={String(stats.arrivingNextHour)}
        />
        <Kpi
          label="Recette du jour"
          value={`${formatDT(stats.revenueToday)}`}
          detail={
            revenueDiff !== 0
              ? `${revenueDiff > 0 ? "+" : ""}${revenueTrend}% vs hier`
              : undefined
          }
        />
      </div>

      {/* Zone occupancy */}
      <section>
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Occupation par zone
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.zoneOccupancy.map((zone) => {
            const pct =
              zone.capacity > 0
                ? Math.round((zone.seated / zone.capacity) * 100)
                : 0;
            return (
              <div
                key={zone.zone}
                className="rounded-xl border border-shell/12 bg-deep/40 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-shell">{zone.zone}</span>
                  <span className="font-mono text-xs text-shell-dim">
                    {zone.seated}/{zone.capacity}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-shell/12">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        pct > 80
                          ? "var(--color-coral)"
                          : pct > 50
                            ? "var(--color-brass)"
                            : "var(--color-lagoon)",
                    }}
                  />
                </div>
                <p className="mt-2 font-mono text-right text-xs text-shell-dim/70">
                  {pct}%
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Yesterday comparison */}
      <section>
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          Comparaison hier
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="border-t border-brass/35 pt-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Recette hier
            </p>
            <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell">
              {formatDT(stats.revenueYesterday)}
            </p>
          </div>
          <div className="border-t border-brass/35 pt-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
              Différence
            </p>
            <p
              className={`mt-2 font-mono text-3xl leading-none tabular-nums ${
                revenueDiff > 0
                  ? "text-lagoon"
                  : revenueDiff < 0
                    ? "text-coral"
                    : "text-shell"
              }`}
            >
              {revenueDiff > 0 ? "+" : ""}
              {formatDT(revenueDiff)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell"
        dir="ltr"
      >
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs text-shell-dim">{detail}</p>
      )}
    </div>
  );
}

/** Format millimes to display (DT). */
function formatDT(amount: number): string {
  const dt = amount / 1000;
  return `${Math.round(dt).toLocaleString("fr-FR")} DT`;
}
