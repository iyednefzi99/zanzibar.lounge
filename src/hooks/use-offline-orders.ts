"use client";

import { useState, useCallback } from "react";

type OfflineOrder = {
  id: string;
  items: Array<{ menuItemId: string; name: string; quantity: number; price: number }>;
  total: number;
  createdAt: string;
};

const STORAGE_KEY = "e_coffee_offline_orders";

export function useOfflineOrders() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const getOfflineOrders = useCallback((): OfflineOrder[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  }, []);

  const saveOfflineOrder = useCallback((order: Omit<OfflineOrder, "id" | "createdAt">) => {
    const orders = getOfflineOrders();
    const newOrder: OfflineOrder = {
      ...order,
      id: `offline_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return newOrder;
  }, [getOfflineOrders]);

  const syncOrders = useCallback(async () => {
    if (!navigator.onLine) return;

    const orders = getOfflineOrders();
    if (orders.length === 0) return;

    for (const order of orders) {
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
      } catch {
        // Will retry on next sync
        continue;
      }
    }

    // Clear synced orders
    localStorage.removeItem(STORAGE_KEY);
  }, [getOfflineOrders]);

  const clearOfflineOrders = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isOnline,
    offlineOrders: getOfflineOrders(),
    saveOfflineOrder,
    syncOrders,
    clearOfflineOrders,
  };
}
