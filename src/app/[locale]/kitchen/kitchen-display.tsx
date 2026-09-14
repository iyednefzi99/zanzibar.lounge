"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { KitchenOrderCard } from "./kitchen-order-card";

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

type FilterTab = "ALL" | "PENDING" | "PREPARING" | "READY";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "PENDING", label: "En attente" },
  { key: "PREPARING", label: "En préparation" },
  { key: "READY", label: "Prêtes" },
];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

export function KitchenDisplay({
  initialOrders,
}: {
  initialOrders: KitchenOrder[];
}) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen/orders");
      if (!res.ok) return;
      const data: KitchenOrder[] = await res.json();

      const currentIds = new Set(data.map((o) => o.id));
      const brandNew = new Set<string>();
      for (const id of currentIds) {
        if (!prevIds.current.has(id)) brandNew.add(id);
      }
      prevIds.current = currentIds;

      if (brandNew.size > 0) {
        playBeep();
        setNewIds((prev) => new Set([...prev, ...brandNew]));
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            for (const id of brandNew) next.delete(id);
            return next;
          });
        }, 30_000);
      }

      setOrders(data);
    } catch {
      // silently ignore poll errors
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleAdvance(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status:
                o.status === "PENDING"
                  ? "PREPARING"
                  : o.status === "PREPARING"
                    ? "READY"
                    : "COMPLETED",
            }
          : o,
      ),
    );

    try {
      await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
      });
    } catch {
      fetchOrders();
    }
  }

  const filtered =
    filter === "ALL"
      ? orders
      : orders.filter((o) => o.status === filter);

  const counts = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    READY: orders.filter((o) => o.status === "READY").length,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-night">
      <nav className="sticky top-0 z-10 flex gap-2 border-b border-shell/10 bg-deep/95 px-4 py-3 backdrop-blur">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          const count =
            tab.key === "ALL"
              ? orders.length
              : counts[tab.key as keyof typeof counts] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full border px-4 py-2 font-mono text-sm font-semibold transition-colors ${
                active
                  ? "border-brass bg-brass text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ms-2 inline-flex size-6 items-center justify-center rounded-full bg-shell/15 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 p-4">
        {filtered.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-xl text-shell-dim">
              {filter === "ALL"
                ? "Aucune commande en cours"
                : `Aucune commande ${filter === "PENDING" ? "en attente" : filter === "PREPARING" ? "en préparation" : "prête"}`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                isNew={newIds.has(order.id)}
                onAdvance={handleAdvance}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
