"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WidgetTheme } from "@/lib/widget-config";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n";
import { normalizePhone } from "@/lib/phone";

type Slot = { minutes: number; label: string; available: boolean };

type Step = "date" | "contact" | "done";

const ZONE_LABELS: Record<string, string> = {
  terrasse: "Terrasse",
  salle: "Salle",
  salon: "Salon",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function WidgetFrame({
  slug,
  name,
  theme,
  zones,
  simplifiedForm,
  locale,
  dictionary,
}: {
  slug: string;
  name: string;
  theme: WidgetTheme;
  zones: string[];
  simplifiedForm: boolean;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const primary = `#${theme.primaryColor}`;
  const bg = `#${theme.backgroundColor}`;
  const text = `#${theme.textColor}`;

  const [step, setStep] = useState<Step>("date");
  const [date, setDate] = useState(todayISO());
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [timeLabel, setTimeLabel] = useState("");
  const [name_, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(
      `/api/widget/availability?slug=${encodeURIComponent(slug)}&date=${date}&party=${partySize}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.data?.closed) {
          setClosed(true);
          setSlots([]);
        } else {
          setClosed(false);
          setSlots(json?.data?.slots ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug, date, partySize]);

  const submit = useCallback(async () => {
    const next: typeof errors = {};
    if (name_.trim().length < 2) next.name = dictionary.booking.errors.name;
    if (!normalizePhone(phone)) next.phone = dictionary.booking.errors.phone;
    setErrors(next);
    if (Object.keys(next).length > 0 || minutes === null) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/widget/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name_.trim(),
          phone,
          date,
          minutes,
          partySize,
          zone: simplifiedForm ? null : zone,
          notes: simplifiedForm ? null : notes || null,
          locale,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReference(json.reference);
        setStep("done");
      } else if (json.code === "FULL") {
        const alts = (json.alternatives as string[]) ?? [];
        setError(
          fill(dictionary.booking.errors.full, { alternatives: alts.join(", ") }),
        );
      } else if (json.code === "INVALID_PHONE") {
        setErrors({ phone: dictionary.booking.errors.phone });
      } else if (json.code === "rate_limited") {
        setError(dictionary.booking.errors.rateLimited);
      } else {
        setError(dictionary.booking.errors.generic);
      }
    } catch {
      setError(dictionary.booking.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }, [
    name_,
    phone,
    minutes,
    slug,
    date,
    partySize,
    zone,
    notes,
    locale,
    simplifiedForm,
    dictionary,
  ]);

  if (step === "done" && reference) {
    return (
      <div
        className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center"
        style={{ background: bg, color: text, fontFamily: theme.fontFamily }}
      >
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: `${primary}33`, color: primary }}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">{dictionary.booking.success.title}</h2>
        <p
          className="mt-3 font-mono text-2xl"
          style={{ color: primary }}
        >
          {reference}
        </p>
        <p className="mt-3 text-sm opacity-70">
          {fill(dictionary.booking.success.body, {
            date,
            time: timeLabel,
            count: String(partySize),
            phone: phone.replace(/(\d{3})\d+(\d{3})/, "$1••$2"),
          })}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-[420px] p-5"
      style={{ background: bg, color: text, fontFamily: theme.fontFamily }}
    >
      <header className="mb-5 text-center">
        {theme.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logoUrl} alt="" className="mx-auto mb-2 h-10 rounded" />
        )}
        <h1 className="text-lg font-semibold" style={{ color: primary }}>
          {theme.title}
        </h1>
        <p className="text-sm opacity-70">{theme.subtitle || name}</p>
      </header>

      {/* Progress */}
      <div className="mb-5 flex items-center justify-center gap-2">
        {(["date", "contact"] as const).map((s, i) => {
          const active = step === s || (step === "done" && i === 1);
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                style={{
                  background: active ? primary : "transparent",
                  color: active ? bg : text,
                  border: `1px solid ${active ? primary : `${text}44`}`,
                }}
              >
                {i + 1}
              </span>
              {i === 0 && (
                <span className="h-px w-8" style={{ background: `${text}44` }} />
              )}
            </div>
          );
        })}
      </div>

      {step === "date" && (
        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-wider opacity-70">
            {dictionary.booking.fields.date}
          </label>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => {
              setLoading(true);
              setDate(e.target.value);
            }}
            className="w-full rounded-xl border px-3 py-2.5 outline-none"
            style={{ borderColor: `${text}33`, background: "transparent", color: text }}
          />

          <label className="block text-xs uppercase tracking-wider opacity-70">
            {dictionary.booking.fields.partySize}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setLoading(true);
                  setPartySize(n);
                }}
                className="h-9 w-9 rounded-lg text-sm transition-all"
                style={{
                  background: partySize === n ? primary : "transparent",
                  color: partySize === n ? bg : text,
                  border: `1px solid ${partySize === n ? primary : `${text}33`}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <label className="block text-xs uppercase tracking-wider opacity-70">
            {dictionary.booking.fields.time}
          </label>
          {loading && <p className="text-sm opacity-50">…</p>}
          {!loading && closed && (
            <p className="text-sm" style={{ color: "#E07060" }}>
              {dictionary.booking.errors.closed}
            </p>
          )}
          {!loading && !closed && slots.length === 0 && (
            <p className="text-sm opacity-60">
              {dictionary.booking.errors.slotsUnavailable}
            </p>
          )}
          <div className="grid grid-cols-3 gap-1.5">
            {slots.map((slot) => (
              <button
                key={slot.minutes}
                type="button"
                disabled={!slot.available}
                onClick={() => {
                  setMinutes(slot.minutes);
                  setTimeLabel(slot.label);
                  setStep("contact");
                }}
                className="h-10 rounded-lg font-mono text-sm transition-all disabled:opacity-30"
                style={{
                  border: `1px solid ${slot.available ? `${text}33` : `${text}11`}`,
                  color: text,
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "contact" && (
        <div className="space-y-4">
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: `${primary}15`, border: `1px solid ${primary}33` }}
          >
            {date} · {timeLabel} · {partySize}{" "}
            {partySize > 1 ? "personnes" : "personne"}
          </div>

          <Input
            id="w-name"
            label={dictionary.booking.fields.name}
            value={name_}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="Ahmed"
            autoComplete="name"
          />
          <Input
            id="w-phone"
            label={dictionary.booking.fields.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            helper={dictionary.booking.fields.phoneHint}
            placeholder="+216 20 123 456"
            autoComplete="tel"
            dir="ltr"
          />

          {!simplifiedForm && (
            <>
              <div>
                <span className="mb-2 block text-xs uppercase tracking-wider opacity-70">
                  {dictionary.booking.fields.zone}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZone(null)}
                    className="rounded-lg px-3 py-1.5 text-sm"
                    style={{
                      border: `1px solid ${zone === null ? primary : `${text}33`}`,
                      color: zone === null ? primary : text,
                    }}
                  >
                    {dictionary.booking.fields.zoneAny}
                  </button>
                  {zones.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZone(z)}
                      className="rounded-lg px-3 py-1.5 text-sm"
                      style={{
                        border: `1px solid ${zone === z ? primary : `${text}33`}`,
                        color: zone === z ? primary : text,
                      }}
                    >
                      {ZONE_LABELS[z] ?? z}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs uppercase tracking-wider opacity-70">
                  {dictionary.booking.fields.notes}
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 400))}
                  rows={2}
                  placeholder={dictionary.booking.fields.notesPlaceholder}
                  className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: `${text}33`, background: "transparent", color: text }}
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "#E0706022", color: "#E07060" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("date")}
              className="rounded-full px-4 py-2.5 text-sm"
              style={{ border: `1px solid ${text}33`, color: text }}
            >
              ←
            </button>
            <Button
              onClick={submit}
              loading={submitting}
              className="flex-1 rounded-full"
              style={{ background: primary, color: bg }}
            >
              {dictionary.booking.submit}
            </Button>
          </div>
        </div>
      )}

      <footer className="mt-6 text-center text-[0.65rem] opacity-40">
        {name}
      </footer>
    </div>
  );
}
