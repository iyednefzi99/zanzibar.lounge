"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BookingData } from "@/components/booking/booking-wizard";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n";
import { maskPhone } from "@/lib/phone";

type SuccessResult = {
  ok: true;
  reference: string;
  date: string;
  time: string;
  partySize: number;
  zone: string | null;
};

export function StepConfirmation({
  locale,
  dictionary,
  data,
  onBack,
}: {
  locale: Locale;
  dictionary: Dictionary;
  data: BookingData;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          date: data.date,
          minutes: data.minutes,
          partySize: data.partySize,
          zone: data.zone,
          notes: data.notes || undefined,
          locale,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        setResult(json);
      } else {
        const code = json.code ?? json.error;
        const msg = mapError(code, dictionary, json);
        setError(msg);
      }
    } catch {
      setError(dictionary.booking.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-lagoon/40 bg-lagoon/15">
          <svg className="h-8 w-8 text-lagoon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="font-display text-3xl text-shell">{dictionary.booking.success.title}</h2>

        <div className="glass-card mx-auto mt-6 max-w-sm rounded-xl p-6">
          <p className="font-mono text-2xl text-brass">{result.reference}</p>
          <div className="mt-4 space-y-2 text-sm text-shell-dim">
            <p>{fill(dictionary.booking.success.body, {
              date: result.date,
              time: result.time,
              count: String(result.partySize),
              phone: maskPhone(data.phone),
            })}</p>
          </div>
          {result.zone && (
            <p className="mt-3 text-sm text-shell-dim">
              Zone: <span className="text-brass">{dictionary.booking.zones[result.zone as keyof typeof dictionary.booking.zones]}</span>
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={`/${locale}/reserver`}
            className="inline-flex min-h-11 items-center rounded-sm border border-shell/25 px-6 text-sm text-shell transition-all hover:border-brass hover:text-brass"
          >
            {dictionary.booking.success.again}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center text-sm text-shell-dim transition-colors hover:text-shell"
          >
            {dictionary.notFound.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="glass-card rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-shell-dim">{dictionary.booking.fields.date}</span>
          <span className="text-sm text-shell">{data.date} {data.timeLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-shell-dim">{dictionary.booking.fields.partySize}</span>
          <span className="text-sm text-shell">{data.partySize}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-shell-dim">{dictionary.booking.fields.name}</span>
          <span className="text-sm text-shell">{data.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-shell-dim">{dictionary.booking.fields.phone}</span>
          <span className="text-sm text-shell" dir="ltr">{maskPhone(data.phone)}</span>
        </div>
        {data.zone && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-shell-dim">{dictionary.booking.fields.zone}</span>
            <span className="text-sm text-brass">{dictionary.booking.zones[data.zone]}</span>
          </div>
        )}
        {data.notes && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-shell-dim">{dictionary.booking.fields.notes}</span>
            <span className="text-right text-sm text-shell">{data.notes}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-4 text-center text-sm text-coral">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Button>
        <Button onClick={submit} loading={loading} className="flex-1">
          {dictionary.booking.submit}
        </Button>
      </div>
    </div>
  );
}

function mapError(code: string, d: Dictionary, json: Record<string, unknown>): string {
  switch (code) {
    case "INVALID_PHONE": return d.booking.errors.phone;
    case "INVALID_NAME": return d.booking.errors.name;
    case "CLOSED": return d.booking.errors.closed;
    case "TOO_SOON": return fill(d.booking.errors.tooSoon, { minutes: 60 });
    case "TOO_FAR": return fill(d.booking.errors.tooFar, { days: 60 });
    case "PARTY_TOO_LARGE": return fill(d.booking.errors.partyTooLarge, { max: 12 });
    case "FULL": {
      const alts = (json.alternatives as string[]) ?? [];
      return fill(d.booking.errors.full, { alternatives: alts.join(", ") });
    }
    case "rate_limited": return d.booking.errors.rateLimited;
    default: return d.booking.errors.generic;
  }
}
