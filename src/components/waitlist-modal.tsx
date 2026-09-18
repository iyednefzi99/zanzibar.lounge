"use client";

import { useState } from "react";

import { fill, type Dictionary } from "@/i18n";

type WaitlistModalProps = {
  dictionary: Dictionary;
  date: string;
  time: string;
  minutes: number;
  partySize: number;
  onClose: () => void;
};

type Status = "idle" | "joining" | "joined" | "error";

export function WaitlistModal({
  dictionary,
  date,
  time,
  minutes,
  partySize,
  onClose,
}: WaitlistModalProps) {
  const t = dictionary.waitlist;
  const [status, setStatus] = useState<Status>("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setStatus("joining");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, minutes, partySize }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setPosition(data.position);
        setStatus("joined");
      } else {
        setError(data.error === "ALREADY_JOINED" ? t.alreadyJoined : t.error);
        setStatus("error");
      }
    } catch {
      setError(t.error);
      setStatus("error");
    }
  }

  if (status === "joined") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 p-4">
        <div className="w-full max-w-md rounded-2xl border border-brass/40 bg-deep p-8 text-center">
          <p className="font-display text-2xl text-brass">{t.successTitle}</p>
          <p className="mt-3 text-shell">{t.successBody}</p>
          {position !== null && (
            <p className="mt-4 font-mono text-sm text-shell-dim">
              {fill(t.position, { position })}
            </p>
          )}
          <p className="mt-2 text-sm text-shell-dim/80">{t.notificationHint}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 text-sm text-lagoon underline underline-offset-4 hover:text-brass"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-shell/20 bg-deep p-8">
        <p className="font-display text-2xl text-brass">{t.title}</p>
        <p className="mt-3 text-shell">
          {fill(t.body, { date, time, count: partySize })}
        </p>

        {status === "error" && error && (
          <p role="alert" className="mt-3 text-sm text-coral">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-shell/25 px-4 py-2.5 text-sm text-shell-dim transition-colors hover:border-shell/50 hover:text-shell"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={join}
            disabled={status === "joining"}
            className="flex-1 rounded-full bg-brass px-4 py-2.5 font-medium text-deep transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60"
          >
            {status === "joining" ? t.joining : t.join}
          </button>
        </div>
      </div>
    </div>
  );
}
