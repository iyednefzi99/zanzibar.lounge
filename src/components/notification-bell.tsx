"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { NotificationItem } from "@/components/notification-item";

type NotificationType =
  | "RESERVATION_REMINDER"
  | "ORDER_READY"
  | "FLASH_OFFER"
  | "BIRTHDAY"
  | "SYSTEM"
  | "ANNOUNCEMENT";

type NotificationData = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationData[];
  unreadCount: number;
};

export function NotificationBell({
  locale,
  staffId,
}: {
  locale: string;
  staffId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (staffId) params.set("staffId", staffId);
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent fail on poll
    }
  }, [staffId]);

  // Fetch on open — setTimeout defers setState outside the effect body
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(fetchNotifications, 0);
    return () => clearTimeout(timer);
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        className="relative inline-flex size-11 items-center justify-center rounded-full border border-shell/15 text-shell-dim transition-colors hover:border-brass hover:text-brass"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex size-5 items-center justify-center rounded-full bg-coral text-[0.6rem] font-bold text-deep">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute end-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-shell/15 bg-deep shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-shell/10 px-4 py-3">
            <h2 className="font-display text-sm text-shell">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/notifications/read-all", {
                      method: "POST",
                    });
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: true })),
                    );
                    setUnreadCount(0);
                  } catch {
                    // Silent fail
                  }
                }}
                className="text-xs text-brass hover:text-brass/80"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-shell-dim">
              Aucune notification
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}

          <div className="border-t border-shell/10 px-4 py-2">
            <Link
              href={`/${locale}/admin/notifications`}
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-brass hover:text-brass/80"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
