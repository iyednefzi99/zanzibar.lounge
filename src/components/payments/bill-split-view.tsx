"use client";

import { useState } from "react";

type SplitItem = {
  id: string;
  amount: number;
  guestId?: string | null;
};

type Props = {
  totalAmount: number;
  tipAmount: number;
  items: SplitItem[];
  onSplitEvenly: (count: number) => Promise<void>;
  onAddTip: (amount: number) => Promise<void>;
};

export function BillSplitView({ totalAmount, tipAmount, items, onSplitEvenly, onAddTip }: Props) {
  const [guestCount, setGuestCount] = useState(2);
  const [tipPercent, setTipPercent] = useState(15);
  const [splitting, setSplitting] = useState(false);

  const totalWithTip = totalAmount + tipAmount;
  const perPerson = items.length > 0 ? Math.floor(totalWithTip / items.length) : 0;
  const tipSuggested = Math.round(totalAmount * 0.15);

  async function handleSplitEvenly() {
    setSplitting(true);
    try {
      await onSplitEvenly(guestCount);
    } finally {
      setSplitting(false);
    }
  }

  async function handleAddTip(percent: number) {
    setTipPercent(percent);
    const tip = Math.round(totalAmount * (percent / 100));
    await onAddTip(tip);
  }

  return (
    <div className="space-y-6">
      {/* Total */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-shell-dim">Total</span>
          <span className="font-display text-2xl text-shell">{(totalAmount / 1000).toFixed(3)} DT</span>
        </div>
        {tipAmount > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-shell-dim">Pourboire</span>
            <span className="text-sm text-brass">{(tipAmount / 1000).toFixed(3)} DT</span>
          </div>
        )}
        <div className="mt-2 border-t border-shell/10 pt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-shell">Total avec pourboire</span>
          <span className="font-display text-xl text-brass">{(totalWithTip / 1000).toFixed(3)} DT</span>
        </div>
      </div>

      {/* Split evenly */}
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Diviser l&apos;addition
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-shell-dim">Nombre de personnes :</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuestCount(Math.max(2, guestCount - 1))}
              className="size-8 rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
            >
              -
            </button>
            <span className="w-8 text-center font-mono text-shell">{guestCount}</span>
            <button
              onClick={() => setGuestCount(guestCount + 1)}
              className="size-8 rounded-full border border-shell/20 text-shell-dim transition-colors hover:border-brass hover:text-brass"
            >
              +
            </button>
          </div>
          <button
            onClick={handleSplitEvenly}
            disabled={splitting}
            className="rounded-lg bg-brass/10 px-4 py-1.5 text-sm text-brass transition-colors hover:bg-brass/20 disabled:opacity-50"
          >
            {splitting ? "Division..." : "Diviser égal"}
          </button>
        </div>
        {items.length > 0 && (
          <p className="mt-2 text-sm text-shell-dim">
            {(totalWithTip / items.length / 1000).toFixed(3)} DT par personne
          </p>
        )}
      </div>

      {/* Tip */}
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Pourboire
        </h3>
        <div className="mt-3 flex gap-2">
          {[10, 15, 18, 20].map((pct) => (
            <button
              key={pct}
              onClick={() => handleAddTip(pct)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                tipPercent === pct
                  ? "border-brass bg-brass text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
