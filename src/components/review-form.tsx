"use client";

import { useState } from "react";

import type { Locale } from "@/i18n/config";

type ReviewFormProps = {
  locale: Locale;
  reservationRef?: string;
  dictionary: {
    title: string;
    rating: string;
    comment: string;
    submit: string;
    success: string;
    error: string;
    namePlaceholder: string;
  };
};

type Status = "idle" | "sending" | "success" | "error";

/**
 * Formulaire de soumission d'avis.
 *
 * Les champs sont minimisés : note (étoiles), titre optionnel, commentaire
 * optionnel, et un champ téléphone pour identifier le client.
 */
export function ReviewForm({ locale, reservationRef, dictionary: dict }: ReviewFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || !phone.trim()) return;

    setStatus("sending");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
          phone: phone.trim(),
          locale,
          reservationRef: reservationRef || undefined,
        }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-lagoon/30 bg-lagoon/5 p-6 text-center">
        <p className="font-display text-xl text-shell">{dict.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Étoiles */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
          {dict.rating} *
        </label>
        <div className="mt-2 flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl transition-colors hover:text-brass"
              aria-label={`${star}/5`}
            >
              {(hovered || rating) >= star ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
          Téléphone *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+216..."
          required
          className="mt-2 w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
      </div>

      {/* Titre */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
          {dict.title}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="mt-2 w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
      </div>

      {/* Commentaire */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
          {dict.comment}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          className="mt-2 w-full rounded-xl border border-shell/25 bg-transparent px-4 py-3 text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-coral">{dict.error}</p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || !phone.trim() || status === "sending"}
        className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
      >
        {status === "sending" ? "…" : dict.submit}
      </button>
    </form>
  );
}
