"use client";

import { useEffect, useMemo, useState } from "react";

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

type BookingWidgetProps = {
  todayISO: string;
  dictionary: {
    title: string;
    name: string;
    phone: string;
    date: string;
    time: string;
    partySize: string;
    submit: string;
    submitting: string;
    success: {
      title: string;
      body: string;
    };
    errors: {
      name: string;
      phone: string;
      time: string;
      generic: string;
    };
  };
};

export function BookingWidget({
  todayISO,
  dictionary: dict,
}: BookingWidgetProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(todayISO);
  const [partySize, setPartySize] = useState(2);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const [cache, setCache] = useState<
    Record<string, { closed: boolean; failed: boolean; slots: Slot[] }>
  >({});

  const key = `${date}|${partySize}`;
  const entry = cache[key];
  const loading = entry === undefined;

  const maxDate = useMemo(() => {
    const [y, m, d] = todayISO.split("-").map(Number);
    const shifted = new Date(Date.UTC(y, m - 1, d + 60));
    return shifted.toISOString().slice(0, 10);
  }, [todayISO]);

  useEffect(() => {
    if (cache[key]) return;

    const controller = new AbortController();

    fetch(`/api/availability?date=${date}&party=${partySize}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then((data) => {
        setCache((prev) => ({
          ...prev,
          [key]: {
            closed: Boolean(data?.closed),
            failed: false,
            slots: data?.slots ?? [],
          },
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCache((prev) => ({
          ...prev,
          [key]: { closed: false, failed: true, slots: [] },
        }));
      });

    return () => controller.abort();
  }, [cache, key, date, partySize]);

  const slots = entry?.slots ?? null;
  const closed = entry?.closed ?? false;
  const failed = entry?.failed ?? false;

  const selected =
    minutes !== null && slots?.some((s) => s.minutes === minutes)
      ? minutes
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;

    if (name.trim().length < 2) {
      return setStatus({ kind: "error", message: dict.errors.name });
    }
    if (phone.trim().length < 6) {
      return setStatus({ kind: "error", message: dict.errors.phone });
    }
    if (selected === null) {
      return setStatus({ kind: "error", message: dict.errors.time });
    }

    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          date,
          minutes: selected,
          partySize,
          locale: "fr",
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus({
          kind: "done",
          reference: data.reference,
          date: data.date,
          time: data.time,
          partySize: data.partySize,
        });
        return;
      }

      setStatus({
        kind: "error",
        message: data.code
          ? `Erreur: ${data.code}`
          : dict.errors.generic,
      });
    } catch {
      setStatus({ kind: "error", message: dict.errors.generic });
    }
  }

  if (status.kind === "done") {
    return (
      <div className="rounded-2xl border border-brass/40 bg-deep/60 p-8 text-center">
        <p className="font-display text-2xl text-brass">{dict.success.title}</p>
        <p className="mt-3 text-shell">{dict.success.body}</p>
        <p className="mt-4 font-mono text-sm tracking-widest text-shell-dim">
          {status.reference}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus({ kind: "idle" });
            setMinutes(null);
          }}
          className="mt-6 text-sm text-lagoon underline underline-offset-4 hover:text-brass"
        >
          Faire une autre reservation
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <div className="rounded-2xl border border-shell/10 bg-deep/60 p-6">
      <h3 className="font-display text-2xl text-brass">{dict.title}</h3>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-shell-dim">
              {dict.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell transition-colors placeholder:text-shell-dim/80 focus:border-brass"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-shell-dim">
              {dict.phone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              dir="ltr"
              placeholder="+216 20 123 456"
              className="mt-2 min-h-11 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell transition-colors placeholder:text-shell-dim/80 focus:border-brass"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-shell-dim">
              {dict.date}
            </label>
            <input
              type="date"
              value={date}
              min={todayISO}
              max={maxDate}
              onChange={(e) => {
                setDate(e.target.value);
                setMinutes(null);
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell transition-colors focus:border-brass"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-shell-dim">
              {dict.partySize}
            </label>
            <select
              value={partySize}
              onChange={(e) => {
                setPartySize(Number(e.target.value));
                setMinutes(null);
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell transition-colors focus:border-brass"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Creneaux */}
        <fieldset>
          <legend className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-shell-dim">
            {dict.time}
          </legend>
          <div className="mt-3 min-h-12">
            {loading || slots === null ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    key={i}
                    className="h-10 w-[4.5rem] animate-pulse rounded-full bg-shell/8"
                  />
                ))}
              </div>
            ) : failed ? (
              <p className="text-sm text-coral">
                Les creneaux ne sont pas disponibles pour l&apos;instant.
              </p>
            ) : closed || slots.length === 0 ? (
              <p className="text-sm text-coral">
                L&apos;etablissement est ferme a cette date.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.minutes}
                    type="button"
                    disabled={!slot.available}
                    aria-pressed={selected === slot.minutes}
                    onClick={() => setMinutes(slot.minutes)}
                    className={`inline-flex h-10 items-center justify-center rounded-full border px-3 font-mono text-sm tabular-nums transition-colors ${
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

        {status.kind === "error" && (
          <p role="alert" className="text-sm text-coral">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || selected === null}
          className="w-full rounded-full bg-brass px-6 py-3 font-medium text-deep transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60"
        >
          {sending ? dict.submitting : dict.submit}
        </button>
      </form>
    </div>
  );
}
