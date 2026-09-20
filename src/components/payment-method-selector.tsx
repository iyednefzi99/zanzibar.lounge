"use client";

import { useState } from "react";

type PaymentMethod = "flouci" | "d17" | "stripe" | "onsite";

type PaymentMethodSelectorProps = {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  amount: number;
};

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}> = [
  {
    id: "flouci",
    name: "Flouci",
    description: "CB, Visa, Mastercard",
    icon: "💳",
    available: true,
  },
  {
    id: "d17",
    name: "D17",
    description: "Paiement mobile",
    icon: "📱",
    available: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Cartes internationales",
    icon: "🌐",
    available: true,
  },
  {
    id: "onsite",
    name: "Sur place",
    description: "Paiement au restaurant",
    icon: "🏪",
    available: true,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  amount,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-shell-dim">
        Montant : <span className="font-mono text-brass">{amount} DT</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            disabled={!method.available}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              selected === method.id
                ? "border-brass bg-brass/10"
                : "border-shell/20 hover:border-shell/40"
            } ${!method.available ? "opacity-50" : ""}`}
          >
            <span className="text-2xl">{method.icon}</span>
            <div>
              <p className="font-medium text-shell">{method.name}</p>
              <p className="text-xs text-shell-dim">{method.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
