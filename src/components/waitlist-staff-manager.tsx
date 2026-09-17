"use client";

import { useEffect, useState, useCallback } from "react";

type WaitlistEntry = {
  id: string;
  name: string | null;
  phone: string;
  date: string;
  minutes: number;
  partySize: number;
  status: string;
  position: number;
  estimatedWaitMinutes: number | null;
  checkedInAt: string | null;
  seatedAt: string | null;
  rewardPoints: number;
  createdAt: string;
};

type WaitlistStaffManagerProps = {
  restaurantId: string;
  date: string;
};

export function WaitlistStaffManager({
  restaurantId,
  date,
}: WaitlistStaffManagerProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/waitlist?restaurantId=${encodeURIComponent(restaurantId)}&date=${encodeURIComponent(date)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [restaurantId, date]);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchEntries]);

  async function handleSeat(entryId: string) {
    try {
      await fetch("/api/waitlist/seat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      fetchEntries();
    } catch {
      // Silent fail
    }
  }

  async function handleNotify(entryId: string) {
    try {
      await fetch("/api/waitlist/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      fetchEntries();
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  const waiting = entries.filter((e) => e.status === "WAITING");
  const notified = entries.filter((e) => e.status === "NOTIFIED");
  const seated = entries.filter((e) => e.status === "SEATED");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-amber/30 bg-amber/10 p-4 text-center">
          <p className="font-mono text-2xl text-amber">{waiting.length}</p>
          <p className="text-xs text-amber/80">En attente</p>
        </div>
        <div className="rounded-lg border border-emerald/30 bg-emerald/10 p-4 text-center">
          <p className="font-mono text-2xl text-emerald">{notified.length}</p>
          <p className="text-xs text-emerald/80">Notifi\u00e9s</p>
        </div>
        <div className="rounded-lg border border-lagoon/30 bg-lagoon/10 p-4 text-center">
          <p className="font-mono text-2xl text-lagoon">{seated.length}</p>
          <p className="text-xs text-lagoon/80">Assis</p>
        </div>
      </div>

      {/* Waiting List */}
      {waiting.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-lg text-shell">
            File d&apos;attente ({waiting.length})
          </h3>
          <div className="space-y-2">
            {waiting.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-shell/10 bg-shell/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20 font-mono text-sm text-amber">
                    #{entry.position}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-shell">
                      {entry.name ?? "Anonyme"}
                    </p>
                    <p className="text-xs text-shell-dim">
                      {entry.partySize}p \u2022 {entry.minutes} min
                      {entry.estimatedWaitMinutes
                        ? ` \u2022 ~${entry.estimatedWaitMinutes} min d'attente`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.checkedInAt && (
                    <span className="rounded-full bg-lagoon/20 px-2 py-0.5 text-xs text-lagoon">
                      Pr\u00e9sent
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNotify(entry.id)}
                    className="rounded-full border border-emerald/40 px-3 py-1 text-xs text-emerald transition-colors hover:bg-emerald/10"
                  >
                    Notifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notified */}
      {notified.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-lg text-shell">
            En attente de r\u00e9ponse ({notified.length})
          </h3>
          <div className="space-y-2">
            {notified.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-emerald/20 bg-emerald/5 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-shell">
                    {entry.name ?? "Anonyme"}
                  </p>
                  <p className="text-xs text-shell-dim">
                    {entry.partySize}p \u2022 Notifi\u00e9
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSeat(entry.id)}
                  className="rounded-full bg-brass px-3 py-1 text-xs font-medium text-deep transition-transform hover:scale-[1.02] active:scale-100"
                >
                  Asseoir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="rounded-lg border border-shell/10 p-8 text-center">
          <p className="text-shell-dim">Aucune attente pour ce cr\u00e9neau</p>
        </div>
      )}
    </div>
  );
}
