"use client";

import type { ReservationSummary } from "@/lib/reservations";
import { formatPhone } from "@/lib/phone";

const STATUS_STYLES: Record<string, { badge: string; border: string }> = {
  PENDING: { badge: "border-shell/30 text-shell-dim", border: "border-l-shell/25" },
  CONFIRMED: { badge: "border-lagoon/50 text-lagoon", border: "border-l-lagoon/50" },
  SEATED: { badge: "border-brass/60 text-brass", border: "border-l-brass" },
  COMPLETED: { badge: "border-shell/20 text-shell-dim", border: "border-l-shell/15" },
  CANCELLED: { badge: "border-coral/50 text-coral", border: "border-l-coral/50" },
  NO_SHOW: { badge: "border-coral/50 text-coral", border: "border-l-coral" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SEATED: "À table",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW: "Non venu",
};

export function ReservationCard({
  reservation,
  onSeat,
  onComplete,
  onCancel,
}: {
  reservation: ReservationSummary;
  onSeat?: (reference: string) => void;
  onComplete?: (reference: string) => void;
  onCancel?: (reference: string) => void;
}) {
  const style = STATUS_STYLES[reservation.status] ?? STATUS_STYLES.PENDING;
  const isActionable = ["PENDING", "CONFIRMED", "SEATED"].includes(
    reservation.status,
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-shell/10 bg-deep/40 pe-4 ps-5 pb-4 pt-3 border-l-[3px] ${style.border}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className="font-mono text-lg tabular-nums text-shell"
          dir="ltr"
        >
          {reservation.time}
        </span>
        <span className="text-sm text-shell">
          {reservation.name ?? "—"} · {reservation.partySize} pers.
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest ${style.badge}`}
        >
          {STATUS_LABELS[reservation.status] ?? reservation.status}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-shell-dim">
        <span className="font-mono">{reservation.reference}</span>
        {reservation.table && <span>Table {reservation.table}</span>}
        {reservation.zone && (
          <span className="capitalize">{reservation.zone}</span>
        )}
      </div>

      <p className="mt-1 font-mono text-xs text-shell-dim" dir="ltr">
        <a href={`tel:${reservation.phone}`} className="hover:text-brass">
          {formatPhone(reservation.phone)}
        </a>
      </p>

      {reservation.notes && (
        <p className="mt-2 text-xs text-shell-dim italic">
          « {reservation.notes} »
        </p>
      )}

      {isActionable && (
        <div className="mt-3 flex flex-wrap gap-2">
          {reservation.status !== "SEATED" && onSeat && (
            <button
              onClick={() => onSeat(reservation.reference)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-shell/25 px-4 text-sm text-shell transition-colors hover:border-brass hover:text-brass"
            >
              Installer
            </button>
          )}
          {reservation.status === "SEATED" && onComplete && (
            <button
              onClick={() => onComplete(reservation.reference)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-shell/25 px-4 text-sm text-shell transition-colors hover:border-brass hover:text-brass"
            >
              Libérer
            </button>
          )}
          {reservation.status !== "SEATED" && onCancel && (
            <button
              onClick={() => onCancel(reservation.reference)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-coral/40 px-4 text-sm text-coral transition-colors hover:bg-coral/10"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  );
}
