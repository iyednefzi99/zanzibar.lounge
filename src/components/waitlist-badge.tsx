"use client";

import { useEffect, useState } from "react";

import { fill, type Dictionary } from "@/i18n";

type WaitlistBadgeProps = {
  dictionary: Dictionary;
  status: "WAITING" | "NOTIFIED" | "BOOKED" | "EXPIRED" | "CANCELLED";
  position?: number;
  expiresAt?: string | null;
};

export function WaitlistBadge({
  dictionary,
  status,
  position,
  expiresAt,
}: WaitlistBadgeProps) {
  const t = dictionary.waitlist;
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "NOTIFIED" || !expiresAt) return;

    const target = new Date(expiresAt).getTime();

    function tick() {
      const ms = target - Date.now();
      if (ms <= 0) {
        setRemaining(null);
        return;
      }
      const min = Math.floor(ms / 60_000);
      const sec = Math.floor((ms % 60_000) / 1000);
      setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, expiresAt]);

  if (status === "WAITING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 font-mono text-xs text-amber">
        <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
        {fill(t.badgeWaiting, { position: position ?? "?" })}
      </span>
    );
  }

  if (status === "NOTIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-0.5 font-mono text-xs text-emerald">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
        {t.badgeNotified}
        {remaining && (
          <span className="ml-1 text-emerald/70">{remaining}</span>
        )}
      </span>
    );
  }

  if (status === "BOOKED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-lagoon/30 bg-lagoon/10 px-2.5 py-0.5 font-mono text-xs text-lagoon">
        {t.badgeBooked}
      </span>
    );
  }

  return null;
}
