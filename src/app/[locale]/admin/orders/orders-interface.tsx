"use client";

import { useState } from "react";

import { advanceStatusAction, cancelOrderAction } from "./actions";

type Order = {
  id: string;
  reference: string;
  guestName: string | null;
  guestPhone: string;
  status: string;
  pickupTime: string | null;
  total: number;
  itemCount: number;
  notes: string | null;
  createdAt: Date;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  PREPARING: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  READY: "border-green-500/40 bg-green-500/10 text-green-300",
  COMPLETED: "border-shell/20 bg-shell/5 text-shell-dim",
  CANCELLED: "border-coral/30 bg-coral/10 text-coral",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

type Props = { initialOrders: Order[] };

export function OrdersInterface({ initialOrders }: Props) {
  const [orders] = useState(initialOrders);

  // Polling via refresh de page côté serveur

  function formatPrice(millimes: number): string {
    return `${(millimes / 1000).toFixed(3)} DT`;
  }

  return (
    <div className="mt-8 space-y-4">
      {orders.length === 0 ? (
        <p className="py-12 text-center text-sm text-shell-dim">
          Aucune commande en cours.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <div
                key={order.id}
                className={`rounded-xl border p-4 ${STATUS_STYLES[order.status] ?? "border-shell/10"}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {order.reference}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-shell">
                  {order.guestName ?? order.guestPhone}
                </p>
                {order.pickupTime && (
                  <p className="mt-1 font-mono text-xs text-shell-dim">
                    Récupération : {order.pickupTime}
                  </p>
                )}
                {order.notes && (
                  <p className="mt-1 text-xs text-shell-dim italic">
                    « {order.notes} »
                  </p>
                )}

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-xs text-shell-dim">
                    {order.itemCount} article{order.itemCount > 1 ? "s" : ""}
                  </span>
                  <span className="font-mono text-sm font-semibold text-brass">
                    {formatPrice(order.total)}
                  </span>
                </div>

                {next && (
                  <div className="mt-3 flex gap-2">
                    <form>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="nextStatus" value={next} />
                      <button
                        formAction={advanceStatusAction}
                        className="rounded-full border border-brass/40 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
                      >
                        → {STATUS_LABELS[next]}
                      </button>
                    </form>
                    <form>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        formAction={cancelOrderAction}
                        className="rounded-full border border-coral/30 px-3 py-1.5 text-xs text-coral transition-colors hover:bg-coral/10"
                      >
                        Annuler
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
