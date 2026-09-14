"use client";

import { useState } from "react";

type Props = {
  depositRequired: boolean;
  depositAmount: number;
  preAuthRequired: boolean;
  preAuthAmount: number;
  noShowFeeAmount: number;
  cancellationHours: number;
};

export function PaymentConfigForm({ config }: { config: Props }) {
  const [depositRequired, setDepositRequired] = useState(config.depositRequired);
  const [depositAmount, setDepositAmount] = useState(config.depositAmount);
  const [preAuthRequired, setPreAuthRequired] = useState(config.preAuthRequired);
  const [preAuthAmount, setPreAuthAmount] = useState(config.preAuthAmount);
  const [noShowFeeAmount, setNoShowFeeAmount] = useState(config.noShowFeeAmount);
  const [cancellationHours, setCancellationHours] = useState(config.cancellationHours);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/payments/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositRequired,
          depositAmount,
          preAuthRequired,
          preAuthAmount,
          noShowFeeAmount,
          cancellationHours,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Dépôt de réservation
        </h3>
        <label className="mt-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={depositRequired}
            onChange={(e) => setDepositRequired(e.target.checked)}
            className="size-4 rounded border-shell/30 bg-deep/60 accent-lagoon"
          />
          <span className="text-sm text-shell">Exiger un dépôt</span>
        </label>
        {depositRequired && (
          <div className="mt-3">
            <label className="block text-sm text-shell-dim">Montant par personne (millimes)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="mt-1 w-48 rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Pré-autorisation carte
        </h3>
        <label className="mt-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={preAuthRequired}
            onChange={(e) => setPreAuthRequired(e.target.checked)}
            className="size-4 rounded border-shell/30 bg-deep/60 accent-lagoon"
          />
          <span className="text-sm text-shell">Exiger une pré-autorisation</span>
        </label>
        {preAuthRequired && (
          <div className="mt-3">
            <label className="block text-sm text-shell-dim">Montant par personne (millimes)</label>
            <input
              type="number"
              value={preAuthAmount}
              onChange={(e) => setPreAuthAmount(Number(e.target.value))}
              className="mt-1 w-48 rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Frais d&apos;annulation
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-shell-dim">Frais no-show (millimes)</label>
            <input
              type="number"
              value={noShowFeeAmount}
              onChange={(e) => setNoShowFeeAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-shell-dim">Annulation gratuite (heures avant)</label>
            <input
              type="number"
              value={cancellationHours}
              onChange={(e) => setCancellationHours(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/60 px-3 py-2 text-shell focus:border-brass focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brass px-6 py-2 text-sm font-medium text-deep transition-colors hover:bg-brass/90 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
