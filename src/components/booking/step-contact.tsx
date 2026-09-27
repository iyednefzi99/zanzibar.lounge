"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookingData } from "@/components/booking/booking-wizard";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { normalizePhone } from "@/lib/phone";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export function StepContact({
  locale,
  dictionary,
  data,
  onUpdate,
  onNext,
  onBack,
}: {
  locale: Locale;
  dictionary: Dictionary;
  data: BookingData;
  onUpdate: (partial: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(data.name);
  const [phone, setPhone] = useState(data.phone);
  const [notes, setNotes] = useState(data.notes);
  const [zone, setZone] = useState<"terrasse" | "salle" | "salon" | null>(data.zone);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [showSummary, setShowSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const validateName = (value: string) =>
    value.trim().length < 2 ? dictionary.booking.errors.name : undefined;
  const validatePhone = (value: string) =>
    !normalizePhone(value) ? dictionary.booking.errors.phone : undefined;

  const validateAll = () => {
    const next = {
      name: validateName(name),
      phone: validatePhone(phone),
    };
    setErrors(next);
    return !next.name && !next.phone;
  };

  const handleSubmit = () => {
    if (!validateAll()) {
      setShowSummary(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setShowSummary(false);
    onUpdate({ name: name.trim(), phone: normalizePhone(phone)!, notes, zone });
    onNext();
  };

  const invalidCount = [errors.name, errors.phone].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {showSummary && invalidCount > 0 && (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby="booking-error-title"
          className="rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm"
        >
          <p id="booking-error-title" className="mb-2 font-medium text-coral">
            {dictionary.booking.errors.summary}
          </p>
          <ul className="list-inside list-disc space-y-1 text-shell">
            {errors.name && (
              <li>
                <a href="#booking-name" className="underline hover:text-brass">
                  {errors.name}
                </a>
              </li>
            )}
            {errors.phone && (
              <li>
                <a href="#booking-phone" className="underline hover:text-brass">
                  {errors.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Summary of step 1 */}
      <div className="glass-card rounded-xl p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-shell">{formatDisplayDate(data.date, locale)}</p>
            <p className="text-brass font-mono">{data.timeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-shell">{data.partySize} {data.partySize > 1 ? "personnes" : "personne"}</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <Input
        ref={nameRef}
        id="booking-name"
        label={dictionary.booking.fields.name}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (errors.name) setErrors((p) => ({ ...p, name: validateName(e.target.value) }));
        }}
        onBlur={() => setErrors((p) => ({ ...p, name: validateName(name) }))}
        error={errors.name}
        placeholder="Ahmed"
        autoComplete="name"
      />

      {/* Phone */}
      <Input
        ref={phoneRef}
        id="booking-phone"
        label={dictionary.booking.fields.phone}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (errors.phone) setErrors((p) => ({ ...p, phone: validatePhone(e.target.value) }));
        }}
        onBlur={() => setErrors((p) => ({ ...p, phone: validatePhone(phone) }))}
        error={errors.phone}
        helper={dictionary.booking.fields.phoneHint}
        placeholder="+216 20 123 456"
        autoComplete="tel"
        dir="ltr"
      />

      {/* Zone */}
      <fieldset>
        <legend className="mb-3 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
          {dictionary.booking.fields.zone}
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setZone(null)}
            aria-pressed={zone === null}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm transition-all",
              zone === null
                ? "border-brass bg-brass/10 text-brass"
                : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass",
            )}
          >
            {dictionary.booking.fields.zoneAny}
          </button>
          {site.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZone(z.id)}
              aria-pressed={zone === z.id}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm transition-all",
                zone === z.id
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass",
              )}
            >
              {dictionary.booking.zones[z.id]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Notes */}
      <div>
        <label
          htmlFor="booking-notes"
          className="mb-3 block font-mono text-xs uppercase tracking-[0.16em] text-brass"
        >
          {dictionary.booking.fields.notes}
        </label>
        <textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 400))}
          placeholder={dictionary.booking.fields.notesPlaceholder}
          rows={3}
          className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          aria-label={dictionary.discover.pagination.previous}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {dictionary.booking.submit}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

function formatDisplayDate(iso: string, locale: Locale) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}
