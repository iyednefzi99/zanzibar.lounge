"use client";

import { useTransition } from "react";

import {
  resolveMaintenanceAlertAction,
  toggleSocialProofEventAction,
} from "./actions";

type SocialProofEvent = {
  id: string;
  restaurantId: string;
  type: string;
  payload: unknown;
  active: boolean;
  createdAt: Date;
};

type MaintenanceAlert = {
  id: string;
  restaurantId: string;
  assetType: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
};

type BadgeDistribution = {
  badgeType: string;
  _count: number;
};

type Props = {
  socialProofEvents: SocialProofEvent[];
  maintenanceAlerts: MaintenanceAlert[];
  badgeDistribution: BadgeDistribution[];
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "border-lagoon/40 bg-lagoon/10 text-lagoon",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
};

const ALERT_STATUS_COLORS: Record<string, string> = {
  active: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  acknowledged: "border-lagoon/40 bg-lagoon/10 text-lagoon",
  resolved: "border-green-500/40 bg-green-500/10 text-green-400",
};

const BADGE_LABELS: Record<string, string> = {
  first_visit: "Première visite",
  power_user: "Power user",
  reviewer: "Critique",
  social_sharer: "Social",
  loyal: "Loyal",
};

export function InnovationInterface({
  socialProofEvents,
  maintenanceAlerts,
  badgeDistribution,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleResolveAlert(alertId: string) {
    const fd = new FormData();
    fd.set("alertId", alertId);
    startTransition(async () => {
      await resolveMaintenanceAlertAction(fd);
    });
  }

  function handleToggleSocialProof(eventId: string) {
    const fd = new FormData();
    fd.set("eventId", eventId);
    startTransition(async () => {
      await toggleSocialProofEventAction(fd);
    });
  }

  const maxBadge = Math.max(...badgeDistribution.map((b) => b._count), 1);

  return (
    <div className="mt-10 space-y-10">
      {/* Badge distribution */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Distribution des badges
        </h2>
        {badgeDistribution.length > 0 ? (
          <div className="mt-4 space-y-3">
            {badgeDistribution.map((b) => (
              <div key={b.badgeType} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-sm text-shell-dim">
                  {BADGE_LABELS[b.badgeType] ?? b.badgeType}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-deep">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-brass/60"
                    style={{ width: `${(b._count / maxBadge) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-xs tabular-nums text-shell" dir="ltr">
                  {b._count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-shell-dim">Aucun badge émis.</p>
        )}
      </section>

      {/* Maintenance alerts */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Alertes de maintenance
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Actif</th>
                <th className="px-4 py-3 text-left">Titre</th>
                <th className="px-4 py-3 text-left">Sévérité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Créé</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {maintenanceAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell-dim">{alert.assetType}</td>
                  <td className="px-4 py-3 text-shell">{alert.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${SEVERITY_COLORS[alert.severity] ?? "border-shell/20 text-shell-dim"}`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${ALERT_STATUS_COLORS[alert.status] ?? "border-shell/20 text-shell-dim"}`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(alert.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {alert.status !== "resolved" && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={isPending}
                        className="rounded-full border border-green-500/40 px-2 py-0.5 text-[0.6rem] text-green-400 transition-colors hover:bg-green-500/10 disabled:opacity-30"
                      >
                        Résoudre
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {maintenanceAlerts.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune alerte de maintenance.
          </p>
        )}
      </section>

      {/* Social proof events */}
      <section>
        <h2 className="font-display text-2xl text-shell">
          Événements de preuve sociale
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Données</th>
                <th className="px-4 py-3 text-right">Créé</th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {socialProofEvents.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-deep/50 transition-colors hover:bg-deep/40"
                >
                  <td className="px-4 py-3 text-shell">{event.type}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-xs text-shell-dim">
                    {typeof event.payload === "object"
                      ? JSON.stringify(event.payload).slice(0, 80)
                      : String(event.payload)}
                  </td>
                  <td className="px-4 py-3 text-right text-shell-dim">
                    {new Date(event.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${
                        event.active
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-shell/20 text-shell-dim"
                      }`}
                    >
                      {event.active ? "actif" : "inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleSocialProof(event.id)}
                      disabled={isPending}
                      className="rounded-full border border-shell/20 px-2 py-0.5 text-[0.6rem] text-shell-dim transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
                    >
                      {event.active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {socialProofEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucun événement de preuve sociale.
          </p>
        )}
      </section>
    </div>
  );
}
