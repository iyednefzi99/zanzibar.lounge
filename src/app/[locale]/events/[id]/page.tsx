"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { EventData } from "@/lib/events";

type Availability = { total: number; booked: number; spotsLeft: number };

type Dict = {
  back: string;
  date: string;
  capacity: string;
  spotsLeft: string;
  price: string;
  free: string;
  description: string;
  book: string;
  full: string;
  quantity: string;
  booking: string;
  success: string;
  error: string;
  alreadyBooked: string;
};

const DICTS: Record<string, Dict> = {
  fr: {
    back: "← Retour aux événements",
    date: "Date et heure",
    capacity: "Capacité",
    spotsLeft: "places restantes",
    price: "Prix",
    free: "Gratuit",
    description: "Description",
    book: "Réserver ma place",
    full: "Complet — plus de places disponibles",
    quantity: "Nombre de places",
    booking: "Réservation en cours…",
    success: "Votre réservation est confirmée !",
    error: "Une erreur est survenue. Veuillez réessayer.",
    alreadyBooked: "Vous avez déjà réservé pour cet événement.",
  },
  ar: {
    back: "← العودة إلى الأحداث",
    date: "التاريخ والوقت",
    capacity: "السعة",
    spotsLeft: "أماكن متبقية",
    price: "السعر",
    free: "مجاني",
    description: "الوصف",
    book: "حجز مقعدي",
    full: "مكتمل — لا توجد أماكن متبقية",
    quantity: "عدد الأماكن",
    booking: "جارٍ الحجز…",
    success: "تم تأكيد حجزك!",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    alreadyBooked: "لقد قمت بالحجز بالفعل لهذا الحدث.",
  },
  en: {
    back: "← Back to events",
    date: "Date & time",
    capacity: "Capacity",
    spotsLeft: "spots left",
    price: "Price",
    free: "Free",
    description: "Description",
    book: "Book my spot",
    full: "Sold out — no spots available",
    quantity: "Number of spots",
    booking: "Booking…",
    success: "Your booking is confirmed!",
    error: "Something went wrong. Please try again.",
    alreadyBooked: "You already have a booking for this event.",
  },
};

function formatDate(isoDate: string, startTime: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, h, min));
  return new Intl.DateTimeFormat("fr-TN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Tunis",
  }).format(date);
}

function formatPrice(price: number, freeLabel: string): string {
  if (price === 0) return freeLabel;
  return `${(price / 1000).toFixed(3)} DT`;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "fr";
  const eventId = params.id as string;
  const dict = DICTS[locale] ?? DICTS.fr;

  const [event, setEvent] = useState<EventData | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "already">("idle");

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${eventId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/events/${eventId}/availability`).then((r) =>
        r.ok ? r.json() : null,
      ),
    ]).then(([ev, avail]) => {
      setEvent(ev);
      setAvailability(avail);
      setLoading(false);
    });
  }, [eventId]);

  async function handleBook() {
    setBooking(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/events/${eventId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setAvailability((prev) =>
          prev ? { ...prev, booked: prev.booked + quantity, spotsLeft: prev.spotsLeft - quantity } : prev,
        );
      } else if (data.error === "ALREADY_BOOKED") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded bg-shell/10" />
          <div className="h-6 w-48 rounded bg-shell/10" />
          <div className="h-48 rounded-xl bg-shell/10" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 text-center">
        <p className="text-shell-dim">Event not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-brass underline"
        >
          {dict.back}
        </button>
      </div>
    );
  }

  const isFull = event.status === "full" || (availability?.spotsLeft ?? 0) <= 0;
  const capacityPercent = availability
    ? Math.round(((availability.total - availability.spotsLeft) / availability.total) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <a href={`/${locale}/events`} className="text-sm text-brass hover:underline">
        {dict.back}
      </a>

      <header className="mt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none text-shell">
          {event.title}
        </h1>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <InfoBlock label={dict.date} value={formatDate(event.date, event.startTime)} />
        <InfoBlock
          label={dict.capacity}
          value={`${availability?.booked ?? 0} / ${availability?.total ?? event.capacity}`}
        />
        <InfoBlock
          label={dict.price}
          value={formatPrice(event.price, dict.free)}
          accent
        />
      </div>

      {/* Capacité visuelle */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-shell-dim">
          <span>{availability?.spotsLeft ?? 0} {dict.spotsLeft}</span>
          <span>{capacityPercent}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-shell/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${capacityPercent}%`,
              backgroundColor: isFull
                ? "var(--color-coral)"
                : capacityPercent > 80
                  ? "var(--color-brass)"
                  : "var(--color-lagoon)",
            }}
          />
        </div>
      </div>

      {event.description && (
        <div className="mt-8">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            {dict.description}
          </h2>
          <p className="mt-3 leading-relaxed text-shell-dim whitespace-pre-line">
            {event.description}
          </p>
        </div>
      )}

      {event.imageUrl && (
        <div className="mt-8 overflow-hidden rounded-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Formulaire de réservation */}
      <div className="mt-10 rounded-xl border border-shell/10 bg-deep/40 p-6">
        {status === "success" ? (
          <div className="text-center">
            <p className="font-display text-xl text-lagoon">{dict.success}</p>
          </div>
        ) : status === "already" ? (
          <div className="text-center">
            <p className="text-shell-dim">{dict.alreadyBooked}</p>
          </div>
        ) : isFull ? (
          <p className="text-center text-coral">{dict.full}</p>
        ) : (
          <>
            <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
              {dict.quantity}
            </label>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-shell/20">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-shell-dim hover:text-shell"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center font-mono text-shell" dir="ltr">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(availability?.spotsLeft ?? 10, q + 1),
                    )
                  }
                  className="px-4 py-2 text-shell-dim hover:text-shell"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleBook}
                disabled={booking || isFull}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-brass bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
              >
                {booking ? dict.booking : dict.book}
              </button>
            </div>

            {status === "error" && (
              <p className="mt-3 text-sm text-coral">{dict.error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-shell-dim/80">
        {label}
      </p>
      <p className={`mt-2 text-lg ${accent ? "font-mono text-brass" : "text-shell"}`}>
        {value}
      </p>
    </div>
  );
}
