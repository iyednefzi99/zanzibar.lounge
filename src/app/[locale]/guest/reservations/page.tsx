"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import { ReservationStatus } from "@/generated/prisma/enums";

type Reservation = {
  id: string;
  reference: string;
  serviceDate: string;
  time: string;
  partySize: number;
  zone: string | null;
  table: string | null;
  status: ReservationStatus;
  startsAt: string;
  hasReview: boolean;
  rating: number | null;
};

type Tab = "upcoming" | "past";

function statusColor(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.CONFIRMED:
      return "bg-lagoon/20 text-lagoon";
    case ReservationStatus.PENDING:
      return "bg-brass/20 text-brass";
    case ReservationStatus.SEATED:
      return "bg-lagoon text-deep";
    case ReservationStatus.COMPLETED:
      return "bg-shell/10 text-shell-dim";
    case ReservationStatus.CANCELLED:
    case ReservationStatus.NO_SHOW:
      return "bg-coral/20 text-coral";
    default:
      return "bg-shell/10 text-shell-dim";
  }
}

function statusLabel(status: ReservationStatus, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    CONFIRMED: { fr: "Confirmée", ar: "مؤكدة", en: "Confirmed" },
    PENDING: { fr: "En attente", ar: "في الانتظار", en: "Pending" },
    SEATED: { fr: "Installé", ar: "تم الجلوس", en: "Seated" },
    COMPLETED: { fr: "Terminée", ar: "مكتملة", en: "Completed" },
    CANCELLED: { fr: "Annulée", ar: "ملغاة", en: "Cancelled" },
    NO_SHOW: { fr: "Absente", ar: "لم يحضر", en: "No show" },
  };
  return labels[status]?.[locale] ?? status;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-brass">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "" : "opacity-30"}>★</span>
      ))}
    </span>
  );
}

export default function GuestReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cancelled) {
        await fetchReservations();
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchReservations]);

  const upcoming = reservations.filter(
    (r) =>
      r.status === ReservationStatus.CONFIRMED ||
      r.status === ReservationStatus.PENDING ||
      r.status === ReservationStatus.SEATED,
  );
  const past = reservations.filter(
    (r) =>
      r.status === ReservationStatus.COMPLETED ||
      r.status === ReservationStatus.CANCELLED ||
      r.status === ReservationStatus.NO_SHOW,
  );

  const filtered = tab === "upcoming" ? upcoming : past;

  async function handleCancel(reference: string) {
    if (!confirm(locale === "fr" ? "Annuler cette réservation ?" : locale === "ar" ? "إلغاء هذا الحجز؟" : "Cancel this reservation?")) return;
    setCancelling(reference);
    try {
      const res = await fetch("/api/guest/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      if (res.ok) {
        fetchReservations();
      }
    } finally {
      setCancelling(null);
    }
  }

  async function handleSubmitReview(reservationId: string) {
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/guest/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          rating: reviewRating,
          body: reviewBody || undefined,
        }),
      });
      if (res.ok) {
        setShowReviewFor(null);
        setReviewBody("");
        setReviewRating(5);
        fetchReservations();
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-shell">
        {locale === "fr" ? "Mes réservations" : locale === "ar" ? "حجوزاتي" : "My reservations"}
      </h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-deep/60 p-1">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            tab === "upcoming"
              ? "bg-brass/20 text-brass"
              : "text-shell-dim hover:text-shell"
          }`}
        >
          {locale === "fr" ? `À venir (${upcoming.length})` : locale === "ar" ? `قادمة (${upcoming.length})` : `Upcoming (${upcoming.length})`}
        </button>
        <button
          onClick={() => setTab("past")}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            tab === "past"
              ? "bg-brass/20 text-brass"
              : "text-shell-dim hover:text-shell"
          }`}
        >
          {locale === "fr" ? `Passées (${past.length})` : locale === "ar" ? `الماضية (${past.length})` : `Past (${past.length})`}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-12 text-center text-shell-dim">
          {locale === "fr" ? "Chargement..." : locale === "ar" ? "جاري التحميل..." : "Loading..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-shell-dim">
            {locale === "fr"
              ? tab === "upcoming"
                ? "Aucune réservation à venir."
                : "Aucune réservation passée."
              : locale === "ar"
                ? tab === "upcoming"
                  ? "لا توجد حجوزات قادمة."
                  : "لا توجد حجوزات سابقة."
                : tab === "upcoming"
                  ? "No upcoming reservations."
                  : "No past reservations."}
          </p>
          <Link
            href={`/${locale}/reserver`}
            className="mt-4 inline-block rounded-full bg-brass px-6 py-2.5 text-sm font-medium text-deep"
          >
            {locale === "fr" ? "Réserver" : locale === "ar" ? "حجز" : "Book now"}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-shell/10 bg-deep/40 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-shell">
                      {r.reference}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${statusColor(r.status)}`}>
                      {statusLabel(r.status, locale)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-shell-dim">
                    {r.serviceDate} · {r.time}
                  </p>
                  <p className="text-xs text-shell-dim/70">
                    {r.partySize}{" "}
                    {locale === "fr" ? "pers." : locale === "ar" ? "شخص" : "pers."}
                    {r.zone && ` · ${r.zone}`}
                    {r.table && ` · ${r.table}`}
                  </p>
                </div>

                {tab === "upcoming" &&
                  (r.status === ReservationStatus.CONFIRMED ||
                    r.status === ReservationStatus.PENDING) && (
                    <button
                      onClick={() => handleCancel(r.reference)}
                      disabled={cancelling === r.reference}
                      className="min-h-[44px] min-w-[44px] rounded-lg bg-coral/10 px-3 py-2 text-xs font-medium text-coral transition-colors hover:bg-coral/20 disabled:opacity-50"
                    >
                      {cancelling === r.reference
                        ? "..."
                        : locale === "fr"
                          ? "Annuler"
                          : locale === "ar"
                            ? "إلغاء"
                            : "Cancel"}
                    </button>
                  )}
              </div>

              {tab === "past" && r.status === ReservationStatus.COMPLETED && (
                <div className="mt-3 border-t border-shell/10 pt-3">
                  {r.hasReview ? (
                    <div className="flex items-center gap-2 text-xs text-shell-dim">
                      <StarRating rating={r.rating ?? 0} />
                      <span>{locale === "fr" ? "Avis laissé" : locale === "ar" ? "تم التقييم" : "Reviewed"}</span>
                    </div>
                  ) : showReviewFor === r.id ? (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className={`min-h-[44px] min-w-[44px] text-2xl ${
                              s <= reviewRating ? "text-brass" : "text-shell/20"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder={
                          locale === "fr"
                            ? "Votre avis (optionnel)..."
                            : locale === "ar"
                              ? "تعليقك (اختياري)..."
                              : "Your review (optional)..."
                        }
                        className="w-full rounded-lg border border-shell/20 bg-night px-3 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none min-h-[80px]"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReview(r.id)}
                          disabled={submittingReview}
                          className="flex-1 rounded-lg bg-brass py-2.5 text-sm font-medium text-deep min-h-[44px] disabled:opacity-50"
                        >
                          {submittingReview
                            ? "..."
                            : locale === "fr"
                              ? "Envoyer"
                              : locale === "ar"
                                ? "إرسال"
                                : "Submit"}
                        </button>
                        <button
                          onClick={() => {
                            setShowReviewFor(null);
                            setReviewBody("");
                          }}
                          className="rounded-lg border border-shell/20 px-4 py-2.5 text-sm text-shell-dim min-h-[44px]"
                        >
                          {locale === "fr" ? "Annuler" : locale === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReviewFor(r.id)}
                      className="text-xs text-brass underline underline-offset-2 hover:text-lagoon"
                    >
                      {locale === "fr"
                        ? "Laisser un avis"
                        : locale === "ar"
                          ? "كتابة تقييم"
                          : "Write a review"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
