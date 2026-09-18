"use client";

import { useEffect, useState, useCallback } from "react";
import type { Dictionary } from "@/i18n";

type WaitlistReward = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  minWaitMinutes: number;
};

type WaitlistGamifiedProps = {
  dictionary: Dictionary;
  entryId: string;
  onClose: () => void;
};

type WaitlistStatus = {
  entry: {
    id: string;
    status: string;
    position: number;
    partySize: number;
    date: string;
    minutes: number;
    estimatedWaitMinutes: number | null;
    actualWaitMinutes: number | null;
    checkedInAt: string | null;
    seatedAt: string | null;
    rewardEarned: string | null;
    rewardPoints: number;
  };
  estimatedWait: number;
  rewards: WaitlistReward[];
};

export function WaitlistGamified({
  dictionary,
  entryId,
  onClose,
}: WaitlistGamifiedProps) {
  const t = dictionary.waitlist;
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/waitlist/status?entryId=${encodeURIComponent(entryId)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      // Silent fail for background refresh
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchStatus();
    }, 30000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  async function handleCheckIn() {
    setCheckingIn(true);
    setError(null);
    try {
      const response = await fetch("/api/waitlist/check-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      if (response.ok) {
        fetchStatus();
      } else {
        const data = await response.json();
        setError(data.error === "ALREADY_CHECKED_IN" ? "D\u00e9j\u00e0 enregistr\u00e9" : "Erreur");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setCheckingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 p-4">
        <div className="w-full max-w-md rounded-2xl border border-brass/40 bg-deep p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { entry, estimatedWait, rewards } = status;
  const progress = entry.estimatedWaitMinutes
    ? Math.min(((entry.estimatedWaitMinutes - estimatedWait) / entry.estimatedWaitMinutes) * 100, 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-brass/40 bg-deep p-8">
        {/* Header */}
        <div className="text-center">
          <p className="font-display text-2xl text-brass">Liste d&apos;attente</p>
          <p className="mt-2 text-shell-dim">
            {entry.date} \u00e0 {entry.minutes} min \u2022 {entry.partySize} personne(s)
          </p>
        </div>

        {/* Position & Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-shell-dim">Position</span>
            <span className="font-mono text-brass">#{entry.position}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-shell/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brass to-lagoon transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-shell-dim">
            <span>{estimatedWait} min restantes</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Status */}
        {entry.status === "NOTIFIED" && (
          <div className="mt-4 rounded-lg border border-emerald/30 bg-emerald/10 p-3 text-center">
            <p className="font-medium text-emerald">Table disponible !</p>
            <p className="mt-1 text-sm text-emerald/80">
              Confirmez rapidement pour r\u00e9server votre table.
            </p>
          </div>
        )}

        {entry.status === "WAITING" && !entry.checkedInAt && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="mt-4 w-full rounded-full border border-lagoon/40 px-4 py-2.5 text-sm font-medium text-lagoon transition-colors hover:bg-lagoon/10 disabled:opacity-60"
          >
            {checkingIn ? "Enregistrement..." : "Enregistrement sur place (QR)"}
          </button>
        )}

        {entry.checkedInAt && !entry.seatedAt && (
          <div className="mt-4 rounded-lg border border-lagoon/30 bg-lagoon/10 p-3 text-center">
            <p className="text-sm text-lagoon">Enregistr\u00e9 sur place</p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-coral">{error}</p>
        )}

        {/* Reward */}
        {entry.rewardEarned && (
          <div className="mt-4 rounded-lg border border-brass/30 bg-brass/10 p-3 text-center">
            <p className="font-medium text-brass">R\u00e9compense gagn\u00e9e !</p>
            <p className="mt-1 text-sm text-brass/80">
              +{entry.rewardPoints} points
            </p>
          </div>
        )}

        {/* Available Rewards */}
        {rewards.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-shell-dim">R\u00e9compenses disponibles :</p>
            <div className="mt-2 space-y-2">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between rounded-lg border border-shell/10 px-3 py-2"
                >
                  <span className="text-sm text-shell">{reward.name}</span>
                  <span className="text-xs text-brass">
                    {reward.minWaitMinutes}+ min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full text-center text-sm text-lagoon underline underline-offset-4 hover:text-brass"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
