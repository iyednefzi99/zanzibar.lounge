"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { site } from "@/content/site";
import { fill, type Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Slot = { minutes: number; label: string; available: boolean };

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string }
  | {
      kind: "done";
      reference: string;
      date: string;
      time: string;
      partySize: number;
    };

const ZONES = ["terrasse", "salle", "salon"] as const;

export function BookingForm({
  locale,
  dictionary,
  todayISO,
  requireCode = false,
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** Date du jour dans le fuseau de l'établissement, calculée côté serveur. */
  todayISO: string;
  /** Reflète BOOKING_REQUIRE_OTP : impose un code avant de réserver. */
  requireCode?: boolean;
}) {
  const t = dictionary.booking;
  const ids = useId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(todayISO);
  const [partySize, setPartySize] = useState(2);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [zone, setZone] = useState<(typeof ZONES)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Les créneaux dépendent de la date ET de la taille du groupe : une table de
  // huit ne se place pas aux mêmes heures qu'une table de deux. On les garde
  // en cache par couple date/effectif, ce qui évite de rappeler l'API quand le
  // client revient sur un choix qu'il vient de faire.
  const [cache, setCache] = useState<
    Record<string, { closed: boolean; slots: Slot[] }>
  >({});

  const key = `${date}|${partySize}`;
  const entry = cache[key];
  const loading = entry === undefined;

  const maxDate = useMemo(
    () => addDays(todayISO, site.booking.maxDaysAhead),
    [todayISO],
  );

  useEffect(() => {
    if (cache[key]) return;

    const controller = new AbortController();

    fetch(`/api/availability?date=${date}&party=${partySize}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setCache((previous) => ({
          ...previous,
          [key]: {
            closed: Boolean(data?.closed),
            slots: data?.slots ?? [],
          },
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCache((previous) => ({
          ...previous,
          [key]: { closed: false, slots: [] },
        }));
      });

    return () => controller.abort();
  }, [cache, key, date, partySize]);

  const slots = entry?.slots ?? null;
  const closed = entry?.closed ?? false;

  // Un créneau choisi puis rendu caduc par un changement de date ou d'effectif
  // ne compte plus : on le déduit plutôt que de le remettre à zéro par effet.
  const selected =
    minutes !== null && slots?.some((slot) => slot.minutes === minutes)
      ? minutes
      : null;

  async function sendCode() {
    if (otp === "sending") return;
    if (phone.trim().length < 6) {
      return setStatus({ kind: "error", message: t.errors.phone });
    }

    setOtp("sending");
    try {
      const response = await fetch("/api/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, locale }),
      });
      setOtp(response.ok ? "sent" : "failed");
    } catch {
      setOtp("failed");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status.kind === "sending") return;

    if (name.trim().length < 2) {
      return setStatus({ kind: "error", message: t.errors.name });
    }
    if (phone.trim().length < 6) {
      return setStatus({ kind: "error", message: t.errors.phone });
    }
    if (selected === null) {
      return setStatus({ kind: "error", message: t.errors.time });
    }
    if (requireCode && !/^\d{6}$/.test(code.trim())) {
      return setStatus({ kind: "error", message: t.otp.missing });
    }

    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          date,
          minutes: selected,
          partySize,
          zone: zone || null,
          notes: notes || null,
          locale,
          ...(requireCode ? { code: code.trim() } : {}),
          website: honeypot,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setStatus({
          kind: "done",
          reference: data.reference,
          date: data.date,
          time: data.time,
          partySize: data.partySize,
        });
        return;
      }

      setStatus({ kind: "error", message: messageFor(data, t) });
    } catch {
      setStatus({ kind: "error", message: t.errors.generic });
    }
  }

  if (status.kind === "done") {
    return (
      <div className="rounded-2xl border border-brass/40 bg-deep/60 p-8">
        <p className="font-display text-3xl text-brass">{t.success.title}</p>
        <p className="mt-3 text-shell">
          {fill(t.success.body, {
            date: status.date,
            time: status.time,
            count: status.partySize,
            phone: phone,
          })}
        </p>
        <p className="mt-4 font-mono text-sm tracking-widest text-shell-dim">
          {status.reference}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus({ kind: "idle" });
            setMinutes(null);
            setNotes("");
          }}
          className="mt-6 text-sm text-lagoon underline underline-offset-4 hover:text-brass"
        >
          {t.success.again}
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.fields.name} htmlFor={`${ids}-name`}>
          <input
            id={`${ids}-name`}
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label={t.fields.phone}
          htmlFor={`${ids}-phone`}
          hint={t.fields.phoneHint}
        >
          <input
            id={`${ids}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            dir="ltr"
            placeholder="+216 20 123 456"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={t.fields.date} htmlFor={`${ids}-date`}>
          <input
            id={`${ids}-date`}
            name="date"
            type="date"
            required
            min={todayISO}
            max={maxDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={t.fields.partySize} htmlFor={`${ids}-party`}>
          <select
            id={`${ids}-party`}
            name="partySize"
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            className={inputClass}
          >
            {Array.from({ length: site.booking.maxPartySize }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
          {t.fields.time}
        </legend>

        <div className="mt-3 min-h-14">
          {loading || slots === null ? (
            <p className="text-sm text-shell-dim">…</p>
          ) : closed || slots.length === 0 ? (
            <p className="text-sm text-coral">{t.errors.closed}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.minutes}
                  type="button"
                  disabled={!slot.available}
                  aria-pressed={selected === slot.minutes}
                  onClick={() => setMinutes(slot.minutes)}
                  className={`rounded-full border px-3.5 py-2 font-mono text-sm transition-colors ${
                    selected === slot.minutes
                      ? "border-brass bg-brass text-deep"
                      : slot.available
                        ? "border-shell/25 text-shell hover:border-brass hover:text-brass"
                        : "border-shell/10 text-shell-dim/40 line-through"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
          {t.fields.zone}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <ZoneChip
            active={zone === ""}
            onClick={() => setZone("")}
            label={t.fields.zoneAny}
          />
          {ZONES.map((id) => (
            <ZoneChip
              key={id}
              active={zone === id}
              onClick={() => setZone(id)}
              label={t.zones[id]}
            />
          ))}
        </div>
      </fieldset>

      {requireCode && (
        <div>
          <Field
            label={t.otp.label}
            htmlFor={`${ids}-code`}
            hint={otp === "sent" ? t.otp.sent : t.otp.hint}
          >
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                id={`${ids}-code`}
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                dir="ltr"
                placeholder="000000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-32 rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-center font-mono tracking-[0.4em] text-shell outline-none transition-colors focus:border-brass"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={otp === "sending"}
                className="rounded-full border border-lagoon/50 px-4 py-2.5 text-sm text-lagoon transition-colors hover:bg-lagoon/10 disabled:opacity-50"
              >
                {otp === "sending"
                  ? t.otp.sending
                  : otp === "sent"
                    ? t.otp.resend
                    : t.otp.send}
              </button>
            </div>
          </Field>
          {otp === "failed" && (
            <p role="alert" className="mt-2 text-sm text-coral">
              {t.otp.failed}
            </p>
          )}
        </div>
      )}

      <Field label={t.fields.notes} htmlFor={`${ids}-notes`}>
        <textarea
          id={`${ids}-notes`}
          name="notes"
          rows={2}
          maxLength={400}
          placeholder={t.fields.notesPlaceholder}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Piège à robots : invisible, jamais rempli par un humain. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor={`${ids}-website`}>Website</label>
        <input
          id={`${ids}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {status.kind === "error" && (
        <p role="alert" className="text-sm text-coral">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-brass px-6 py-3.5 font-medium text-deep transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {sending ? t.submitting : t.submit}
      </button>
    </form>
  );
}

const inputClass =
  "mt-2 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell outline-none transition-colors placeholder:text-shell-dim/50 focus:border-brass";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-shell-dim/70">{hint}</p>}
    </div>
  );
}

function ZoneChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-lagoon bg-lagoon/15 text-lagoon"
          : "border-shell/20 text-shell-dim hover:border-shell/50 hover:text-shell"
      }`}
    >
      {label}
    </button>
  );
}

/** Traduit le code d'erreur de l'API en phrase pour le client. */
function messageFor(data: unknown, t: Dictionary["booking"]): string {
  const payload = data as {
    error?: string;
    code?: string;
    minutes?: number;
    days?: number;
    max?: number;
    alternatives?: string[];
    reason?: string;
  };

  if (payload.error === "rate_limited") return t.errors.rateLimited;

  if (payload.code === "INVALID_CODE") {
    if (payload.reason === "expired") return t.otp.expired;
    if (payload.reason === "too_many_attempts") return t.otp.tooMany;
    return t.otp.invalid;
  }

  switch (payload.code) {
    case "CLOSED":
      return t.errors.closed;
    case "TOO_SOON":
      return fill(t.errors.tooSoon, { minutes: payload.minutes ?? 0 });
    case "TOO_FAR":
      return fill(t.errors.tooFar, { days: payload.days ?? 0 });
    case "PARTY_TOO_LARGE":
      return fill(t.errors.partyTooLarge, { max: payload.max ?? 0 });
    case "FULL":
      return fill(t.errors.full, {
        alternatives: (payload.alternatives ?? []).join(", "),
      });
    case "INVALID_PHONE":
      return t.errors.phone;
    case "INVALID_NAME":
      return t.errors.name;
    default:
      return t.errors.generic;
  }
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}
