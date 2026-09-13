"use client";

import { useState } from "react";

/**
 * Formulaire d'export CSV des réservations.
 *
 * Deux champs date (du/au) et un bouton de téléchargement. Le fichier est
 * généré côté serveur via /api/admin/export et téléchargé côté client.
 */
export function ExportForm() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState(() => toInputValue(firstOfMonth));
  const [to, setTo] = useState(() => toInputValue(today));
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const url = `/api/admin/export?from=${from}&to=${to}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        `reservations-${from}_${to}.csv`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
          Du
        </span>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 block rounded-full border border-shell/25 bg-transparent px-4 py-2 font-mono text-sm text-shell focus:border-brass focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
          Au
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 block rounded-full border border-shell/25 bg-transparent px-4 py-2 font-mono text-sm text-shell focus:border-brass focus:outline-none"
        />
      </label>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-shell/25 px-5 text-sm text-shell transition-colors hover:border-brass hover:text-brass disabled:opacity-40"
      >
        {loading ? "Export…" : "Exporter CSV"}
      </button>
    </div>
  );
}

function toInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
