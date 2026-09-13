"use client";

import { useState } from "react";

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type Props = {
  locale: string;
  cart: CartItem[];
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
};

const DICTS: Record<string, { cart: string; empty: string; total: string; send: string; phone: string; pickup: string; notes: string; placeOrder: string; success: string; reference: string }> = {
  fr: { cart: "Panier", empty: "Votre panier est vide.", total: "Total", send: "Envoyer", phone: "Téléphone", pickup: "Heure de récupération (HH:MM)", notes: "Notes (optionnel)", placeOrder: "Passer la commande", success: "Commande passée !", reference: "Référence" },
  ar: { cart: "سلة التسوق", empty: "سلة التسوق فارغة.", total: "المجموع", send: "إرسال", phone: "الهاتف", pickup: "وقت الاستلام (HH:MM)", notes: "ملاحظات (اختياري)", placeOrder: "تأكيد الطلب", success: "تم الطلب !", reference: "المرجع" },
  en: { cart: "Cart", empty: "Your cart is empty.", total: "Total", send: "Send", phone: "Phone", pickup: "Pickup time (HH:MM)", notes: "Notes (optional)", placeOrder: "Place order", success: "Order placed!", reference: "Reference" },
};

export function CartPanel({ locale, cart, onUpdateQuantity, onRemove }: Props) {
  const [phone, setPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);

  const dict = DICTS[locale] ?? DICTS.fr;
  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || cart.length === 0) return;

    setLoading(true);
    try {
      const pickupMinutes = pickupTime
        ? (() => {
            const [h, m] = pickupTime.split(":").map(Number);
            return h * 60 + m;
          })()
        : null;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          cart: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
          pickupMinutes,
          notes: notes.trim() || null,
          locale,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-green-300">{dict.success}</p>
        <p className="mt-2 font-mono text-sm text-shell">
          {dict.reference} : <span className="text-brass">{result.reference}</span>
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-shell/15 py-8 text-center">
        <p className="text-sm text-shell-dim">{dict.empty}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-shell/12 bg-deep/40 p-4">
      <h2 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
        {dict.cart} ({cart.length})
      </h2>

      <ul className="mt-3 space-y-2">
        {cart.map((item) => (
          <li
            key={item.menuItemId}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex-1">
              <span className="text-sm text-shell">{item.name}</span>
              <span className="ml-2 font-mono text-xs text-shell-dim">
                {(item.price / 1000).toFixed(3)} DT × {item.quantity}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-shell/20 text-shell-dim hover:text-shell"
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-xs text-shell">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-shell/20 text-shell-dim hover:text-shell"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.menuItemId)}
                className="ml-2 text-xs text-coral/60 hover:text-coral"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-shell/10 pt-3 text-right font-mono text-sm text-brass">
        {dict.total} : {(total / 1000).toFixed(3)} DT
      </p>

      <form onSubmit={handleOrder} className="mt-4 space-y-3">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={dict.phone + " (+216…)"}
          required
          className="w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
        <input
          type="time"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          placeholder={dict.pickup}
          className="w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={dict.notes}
          className="w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
        <button
          type="submit"
          disabled={!phone.trim() || loading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
        >
          {loading ? "…" : dict.placeOrder}
        </button>
      </form>
    </div>
  );
}
