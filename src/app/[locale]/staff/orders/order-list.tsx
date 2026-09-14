"use client";

import { useState, useEffect, useRef } from "react";

import { OrderCard } from "@/components/order-card";
import type { OrderSummary } from "@/lib/orders";
import { orderStatusAction, cancelOrderAction } from "../actions";

const ORDER_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "preparing", label: "En cours" },
  { key: "ready", label: "Prêtes" },
] as const;

type FilterKey = (typeof ORDER_FILTERS)[number]["key"];

const ORDER_FILTER_MAP: Record<FilterKey, string[]> = {
  all: ["PENDING", "PREPARING", "READY"],
  pending: ["PENDING"],
  preparing: ["PREPARING"],
  ready: ["READY"],
};

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

export function StaffOrderList({ orders }: { orders: OrderSummary[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const prevCountRef = useRef(orders.length);

  useEffect(() => {
    if (orders.length > prevCountRef.current) {
      playNotificationSound();
    }
    prevCountRef.current = orders.length;
  }, [orders.length]);

  const filtered = orders.filter((o) =>
    ORDER_FILTER_MAP[activeFilter].includes(o.status),
  );

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    preparing: orders.filter((o) => o.status === "PREPARING").length,
    ready: orders.filter((o) => o.status === "READY").length,
  };

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("nextStatus", nextStatus);
    await orderStatusAction(null, formData);
  };

  const handleCancel = async (orderId: string) => {
    const formData = new FormData();
    formData.set("orderId", orderId);
    await cancelOrderAction(null, formData);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {ORDER_FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors ${
                active
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-shell/20 text-shell-dim hover:border-shell/40"
              }`}
            >
              {filter.label}
              {counts[filter.key] > 0 && (
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                    active
                      ? "bg-brass text-deep"
                      : "bg-shell/10 text-shell-dim"
                  }`}
                >
                  {counts[filter.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-shell-dim">
          {activeFilter === "all"
            ? "Aucune commande active."
            : "Aucune commande dans cette catégorie."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
