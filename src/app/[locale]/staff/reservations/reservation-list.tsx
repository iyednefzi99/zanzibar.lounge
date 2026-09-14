"use client";

import { useState } from "react";

import { ReservationCard } from "@/components/reservation-card";
import type { ReservationSummary } from "@/lib/reservations";
import { reservationAction } from "../actions";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmées" },
  { key: "seated", label: "À table" },
  { key: "completed", label: "Terminées" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const FILTER_MAP: Record<FilterKey, string[]> = {
  all: ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"],
  pending: ["PENDING"],
  confirmed: ["CONFIRMED"],
  seated: ["SEATED"],
  completed: ["COMPLETED"],
};

export function StaffReservationList({
  reservations,
}: {
  reservations: ReservationSummary[];
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered = reservations.filter((r) =>
    FILTER_MAP[activeFilter].includes(r.status),
  );

  const counts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === "PENDING").length,
    confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
    seated: reservations.filter((r) => r.status === "SEATED").length,
    completed: reservations.filter((r) => r.status === "COMPLETED").length,
  };

  const handleAction = async (reference: string, action: string) => {
    const formData = new FormData();
    formData.set("reference", reference);
    formData.set("action", action);
    await reservationAction(null, formData);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors ${
                active
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-shell/20 text-shell-dim hover:border-shell/40"
              }`}
            >
              {filter.label}
              {counts[filter.key] > 0 && (
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                    active
                      ? "bg-brass text-deep"
                      : "bg-shell/10 text-shell-dim"
                  }`}
                >
                  {counts[filter.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-shell-dim">
          {activeFilter === "all"
            ? "Aucune réservation aujourd'hui."
            : "Aucune réservation dans cette catégorie."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((reservation) => (
            <ReservationCard
              key={reservation.reference}
              reservation={reservation}
              onSeat={(ref) => handleAction(ref, "seat")}
              onComplete={(ref) => handleAction(ref, "complete")}
              onCancel={(ref) => handleAction(ref, "cancel")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
