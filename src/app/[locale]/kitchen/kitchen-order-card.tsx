"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type KitchenOrder = {
  id: string;
  reference: string;
  status: string;
  notes: string | null;
  total: number;
  pickupMinutes: number | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-coral/60 bg-coral/10",
  PREPARING: "border-brass/60 bg-brass/10",
  READY: "border-lagoon/60 bg-lagoon/10",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PREPARING: "En préparation",
  READY: "Prête",
};

function elapsedMinutes(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

function timerColor(minutes: number): string {
  if (minutes < 10) return "text-lagoon";
  if (minutes < 20) return "text-brass";
  return "text-coral";
}

export function KitchenOrderCard({
  order,
  isNew,
  onAdvance,
}: {
  order: KitchenOrder;
  isNew: boolean;
  onAdvance: (id: string) => void;
}) {
  const [mins, setMins] = useState(() => elapsedMinutes(order.createdAt));

  useEffect(() => {
    const tick = () => setMins(elapsedMinutes(order.createdAt));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  const borderColor = STATUS_STYLES[order.status] ?? "border-shell/10";
  const actionLabel =
    order.status === "PENDING"
      ? "Commencer"
      : order.status === "PREPARING"
        ? "Terminer"
        : "Récupérée";

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  const elapsed = hrs > 0 ? `${hrs}h${String(rem).padStart(2, "0")}` : `${rem}min`;

  return (
    <button
      type="button"
      onClick={() => onAdvance(order.id)}
      className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.98] ${borderColor} ${isNew ? "animate-bounce" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-3xl font-bold tracking-tight text-shell">
          {order.reference}
        </span>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest ${
            order.status === "PENDING"
              ? "border-coral/50 text-coral"
              : order.status === "PREPARING"
                ? "border-brass/50 text-brass"
                : "border-lagoon/50 text-lagoon"
          }`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <p className={`mt-3 font-mono text-2xl tabular-nums ${timerColor(mins)}`}>
        {elapsed}
      </p>

      <ul className="mt-4 space-y-2">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-2 text-lg text-shell"
          >
            <span className="truncate">
              <span className="font-bold">{item.quantity}</span>{" "}
              {item.name}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="mt-4 rounded-lg border border-brass/30 bg-brass/5 px-3 py-2">
          <p className="text-sm font-medium text-brass">
            ⚠ {order.notes}
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <span
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            order.status === "PENDING"
              ? "border-brass/50 text-brass hover:bg-brass/10"
              : order.status === "PREPARING"
                ? "border-lagoon/50 text-lagoon hover:bg-lagoon/10"
                : "border-shell/20 text-shell-dim"
          }`}
        >
          {actionLabel} →
        </span>
      </div>
    </button>
  );
}
