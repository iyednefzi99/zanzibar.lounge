"use client";

import { useState, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { BookingData } from "@/components/booking/booking-wizard";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Slot = { minutes: number; label: string; available: boolean };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const periodOrder = ["morning", "afternoon", "evening", "late"] as const;

function getPeriod(minutes: number): string {
  if (minutes < 720) return "morning";
  if (minutes < 1020) return "afternoon";
  if (minutes < 1320) return "evening";
  return "late";
}

export function StepDate({
  dictionary,
  data,
  onUpdate,
  onNext,
}: {
  locale: Locale;
  dictionary: Dictionary;
  data: BookingData;
  onUpdate: (partial: Partial<BookingData>) => void;
  onNext: () => void;
}) {
  const today = todayISO();
  const maxDate = addDays(today, 60);
  const [selectedDate, setSelectedDate] = useState(data.date || today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();

    const fetchSlots = async () => {
      setLoading(true);
      setClosed(false);

      try {
        const res = await fetch(
          `/api/availability?date=${selectedDate}&party=${data.partySize}`,
          { signal: controller.signal },
        );
        const json = await res.json();

        if (!cancelled) {
          if (json.closed) {
            setClosed(true);
            setSlots([]);
          } else {
            setSlots(json.slots ?? []);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
          setLoading(false);
        }
      }
    };

    fetchSlots();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedDate, data.partySize]);

  const grouped = periodOrder.reduce(
    (acc, period) => {
      const periodSlots = slots.filter((s) => getPeriod(s.minutes) === period);
      if (periodSlots.length > 0) acc.push({ period, slots: periodSlots });
      return acc;
    },
    [] as Array<{ period: string; slots: Slot[] }>,
  );

  return (
    <div>
      {/* Date picker */}
      <div className="mb-8">
        <label className="mb-3 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
          {dictionary.booking.fields.date}
        </label>
        <input
          type="date"
          value={selectedDate}
          min={today}
          max={maxDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
        />
      </div>

      {/* Party size */}
      <div className="mb-8">
        <label className="mb-3 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
          {dictionary.booking.fields.partySize}
        </label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onUpdate({ partySize: n })}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                data.partySize === n
                  ? "bg-brass text-deep"
                  : "border border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Slots */}
      <div>
        <label className="mb-3 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
          {dictionary.booking.fields.time}
        </label>

        {loading && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && closed && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-center text-coral">
            {dictionary.booking.errors.closed}
          </div>
        )}

        {!loading && !closed && slots.length === 0 && (
          <div className="rounded-xl border border-shell/20 bg-deep/50 p-4 text-center text-shell-dim">
            {dictionary.booking.errors.slotsUnavailable}
          </div>
        )}

        {!loading && !closed && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map(({ period, slots: periodSlots }) => (
              <div key={period}>
                <p className="mb-2 text-sm text-shell-dim">
                  {dictionary.booking.periods[period as keyof typeof dictionary.booking.periods]}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {periodSlots.map((slot) => (
                    <button
                      key={slot.minutes}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => {
                        onUpdate({ minutes: slot.minutes, timeLabel: slot.label, date: selectedDate });
                        onNext();
                      }}
                      className={`flex h-11 items-center justify-center rounded-xl font-mono text-sm transition-all ${
                        data.minutes === slot.minutes
                          ? "bg-brass text-deep"
                          : slot.available
                            ? "border border-shell/20 text-shell hover:border-brass hover:text-brass"
                            : "cursor-not-allowed border border-shell/10 text-shell-dim/40 line-through"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
