"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  orderId?: string;
  reservationId?: string;
  amount: number;
  currency?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function CheckoutButton({
  orderId,
  reservationId,
  amount,
  currency = "TND",
  label,
  className = "",
  disabled = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const type = orderId ? "order" : "deposit";

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          orderId,
          reservationId,
          amount,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Erreur de paiement");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = (amount / 1000).toFixed(3);
  const defaultLabel = `Payer ${displayAmount} ${currency}`;

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`rounded bg-brass px-6 py-3 font-medium text-night transition hover:bg-brass/80 disabled:opacity-50 ${className}`}
      >
        {loading ? "Redirection…" : (label ?? defaultLabel)}
      </button>
      {error && (
        <p className="mt-2 text-sm text-coral">{error}</p>
      )}
    </div>
  );
}
