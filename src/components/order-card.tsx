"use client";

import type { OrderSummary } from "@/lib/orders";

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "border-shell/30 text-shell-dim",
  PREPARING: "border-lagoon/50 text-lagoon",
  READY: "border-brass/60 text-brass",
  COMPLETED: "border-shell/20 text-shell-dim",
  CANCELLED: "border-coral/50 text-coral",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
};

function getNextStatus(current: string): string | null {
  const transitions: Record<string, string> = {
    PENDING: "PREPARING",
    PREPARING: "READY",
    READY: "COMPLETED",
  };
  return transitions[current] ?? null;
}

function getElapsed(createdAt: Date): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${remaining > 0 ? String(remaining).padStart(2, "0") : ""}`;
}

export function OrderCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: OrderSummary;
  onAdvance?: (orderId: string, nextStatus: string) => void;
  onCancel?: (orderId: string) => void;
}) {
  const elapsed = getElapsed(order.createdAt);
  const nextStatus = getNextStatus(order.status);
  const cancelable =
    order.status === "PENDING" || order.status === "PREPARING";

  const advanceLabels: Record<string, string> = {
    PREPARING: "Commencer",
    READY: "Prête",
    COMPLETED: "Récupérée",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-shell/10 border-l-[3px] border-l-lagoon/50 bg-deep/40 px-4 pb-4 pt-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-sm tabular-nums text-shell">
          {order.reference}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest ${
            ORDER_STATUS_STYLES[order.status] ?? ""
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
        <span className="ms-auto font-mono text-xs text-shell-dim">
          {elapsed}
        </span>
      </div>

      <div className="mt-2 space-y-0.5 text-sm text-shell">
        {order.guestName && <p>{order.guestName}</p>}
        {order.pickupTime && (
          <p className="text-xs text-shell-dim">
            Récupération :{" "}
            <span className="font-mono" dir="ltr">
              {order.pickupTime}
            </span>
          </p>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between border-t border-shell/10 pt-2">
        <span className="text-xs text-shell-dim">
          {order.itemCount} article{order.itemCount > 1 ? "s" : ""}
        </span>
        <span
          className="font-mono text-sm tabular-nums text-brass"
          dir="ltr"
        >
          {(order.total / 1000).toFixed(3)} DT
        </span>
      </div>

      {order.notes && (
        <p className="mt-2 text-xs text-shell-dim italic">
          « {order.notes} »
        </p>
      )}

      {order.status !== "COMPLETED" &&
        order.status !== "CANCELLED" &&
        (nextStatus || cancelable) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {nextStatus && onAdvance && (
              <button
                onClick={() => onAdvance(order.id, nextStatus)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-brass/50 px-4 text-sm text-brass transition-colors hover:bg-brass/10"
              >
                {advanceLabels[nextStatus]}
              </button>
            )}
            {cancelable && onCancel && (
              <button
                onClick={() => onCancel(order.id)}
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
