"use client";

import { useEffect, useState } from "react";

import type { LoyaltyAccountInfo, LoyaltyTransactionInfo } from "@/lib/loyalty";

type LoyaltyCardProps = {
  phone: string;
  dictionary: {
    title: string;
    points: string;
    tier: string;
    discount: string;
    nextTier: string;
    pointsToNext: string;
    history: string;
    earned: string;
    redeemed: string;
    reservationCompleted: string;
    review: string;
    referral: string;
    bonus: string;
  };
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-gray-300",
  gold: "text-yellow-400",
};

const REASON_LABELS: Record<string, string> = {
  reservation_completed: "Réservation",
  review: "Avis",
  referral: "Parrainage",
  redeemed: "Réclamé",
  bonus: "Bonus",
};

export function LoyaltyCard({ phone, dictionary: dict }: LoyaltyCardProps) {
  const [account, setAccount] = useState<LoyaltyAccountInfo | null>(null);
  const [history, setHistory] = useState<LoyaltyTransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/loyalty?phone=${encodeURIComponent(phone)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAccount(data.account);
          setHistory(data.history);
        }
      })
      .finally(() => setLoading(false));
  }, [phone]);

  if (loading) {
    return (
      <div className="rounded-xl border border-shell/12 bg-deep/40 p-6 animate-pulse">
        <div className="h-8 w-32 rounded bg-shell/10" />
        <div className="mt-4 h-4 w-48 rounded bg-shell/10" />
      </div>
    );
  }

  if (!account) return null;

  const progress =
    account.pointsToNext !== null
      ? Math.min(1, account.points / (account.points + account.pointsToNext))
      : 1;

  return (
    <div className="rounded-xl border border-brass/30 bg-deep/60 p-6">
      {/* En-tête */}
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-2xl text-shell">{dict.title}</h3>
        <span
          className={`font-mono text-sm uppercase tracking-widest ${TIER_COLORS[account.tier]}`}
        >
          {TIER_LABELS[account.tier]}
        </span>
      </div>

      {/* Points */}
      <div className="mt-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
          {dict.points}
        </p>
        <p
          className="mt-1 font-mono text-4xl leading-none tabular-nums text-shell"
          dir="ltr"
        >
          {account.points}
        </p>
      </div>

      {/* Réduction */}
      {account.discount > 0 && (
        <p className="mt-2 text-sm text-brass">
          {dict.discount} : {account.discount}%
        </p>
      )}

      {/* Progression vers le palier suivant */}
      {account.nextTier && account.pointsToNext !== null && (
        <div className="mt-4">
          <p className="text-xs text-shell-dim">
            {account.pointsToNext} {dict.pointsToNext}{" "}
            {TIER_LABELS[account.nextTier]}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-shell/10">
            <div
              className="h-full rounded-full bg-brass transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div className="mt-6 border-t border-shell/10 pt-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
            {dict.history}
          </h4>
          <ul className="mt-3 space-y-2">
            {history.slice(0, 10).map((tx) => (
              <li key={tx.id} className="flex items-baseline justify-between text-sm">
                <span className="text-shell-dim">
                  {REASON_LABELS[tx.reason] ?? tx.reason}
                </span>
                <span
                  className={`font-mono tabular-nums ${tx.points > 0 ? "text-lagoon" : "text-coral"}`}
                  dir="ltr"
                >
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
