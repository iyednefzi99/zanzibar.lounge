"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { minutes: number; label: string; remaining: number; available: boolean };

type Config = {
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  logoUrl: string | null;
  brandColor: string | null;
  hours: Array<{ day: number; open: string; close: string }>;
  zones: Array<{ id: string; capacity: number }>;
  booking: {
    maxPartySize: number;
    slotMinutes: number;
    minLeadMinutes: number;
    maxDaysAhead: number;
  };
};

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

const ZONE_LABELS: Record<string, string> = {
  terrasse: "Terrasse",
  salle: "Salle",
  salon: "Salon",
};

function todayISO(tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

type Period = "morning" | "afternoon" | "evening" | "late";
const PERIODS: Period[] = ["morning", "afternoon", "evening", "late"];
const PERIOD_LABELS: Record<Period, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
  late: "Nuit",
};

function periodOf(minutes: number): Period {
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  if (minutes < 22 * 60) return "evening";
  return "late";
}

function groupByPeriod(slots: Slot[]): Array<{ period: Period; slots: Slot[] }> {
  return PERIODS.map((period) => ({
    period,
    slots: slots.filter((slot) => periodOf(slot.minutes) === period),
  })).filter((group) => group.slots.length > 0);
}

export default function WidgetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>("");
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [zone, setZone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const [cache, setCache] = useState<
    Record<string, { closed: boolean; failed: boolean; slots: Slot[] }>
  >({});

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setDate(todayISO("Africa/Tunis"));
    });
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/widget/config/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setConfig(data.data);
          setPartySize(Math.min(2, data.data.booking.maxPartySize));
        } else {
          setConfigError(true);
        }
      })
      .catch(() => setConfigError(true));
  }, [slug]);

  const tz = config?.timezone ?? "Africa/Tunis";
  const maxDate = useMemo(
    () => addDaysISO(todayISO(tz), config?.booking.maxDaysAhead ?? 60),
    [tz, config],
  );

  const slotKey = `${date}|${partySize}`;
  const entry = cache[slotKey];
  const loading = entry === undefined;

  useEffect(() => {
    if (!slug || !date) return;
    if (cache[slotKey]) return;

    const controller = new AbortController();
    fetch(
      `/api/widget/availability?slug=${encodeURIComponent(slug)}&date=${date}&party=${partySize}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setCache((prev) => ({
            ...prev,
            [slotKey]: {
              closed: Boolean(data.data?.closed),
              failed: false,
              slots: data.data?.slots ?? [],
            },
          }));
        } else {
          setCache((prev) => ({
            ...prev,
            [slotKey]: { closed: false, failed: true, slots: [] },
          }));
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCache((prev) => ({
          ...prev,
          [slotKey]: { closed: false, failed: true, slots: [] },
        }));
      });

    return () => controller.abort();
  }, [slug, date, partySize, cache, slotKey]);

  const slots = entry?.slots ?? null;
  const closed = entry?.closed ?? false;
  const failed = entry?.failed ?? false;

  const selected =
    minutes !== null && slots?.some((s) => s.minutes === minutes)
      ? minutes
      : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status.kind === "sending") return;

    if (name.trim().length < 2) {
      return setStatus({ kind: "error", message: "Veuillez saisir votre nom." });
    }
    if (phone.trim().length < 6) {
      return setStatus({ kind: "error", message: "Numéro de téléphone invalide." });
    }
    if (selected === null) {
      return setStatus({ kind: "error", message: "Choisissez un créneau." });
    }

    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/widget/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          phone,
          date,
          minutes: selected,
          partySize,
          zone: zone || null,
          notes: notes || null,
          locale: config?.locale ?? "fr",
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

      setStatus({
        kind: "error",
        message: translateError(data),
      });
    } catch {
      setStatus({ kind: "error", message: "Erreur réseau. Réessayez." });
    }
  }

  const brandColor = config?.brandColor ?? "#c9922e";

  if (configError) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#efe3d0", backgroundColor: "#0e2e30" }}
      >
        <p>Restaurant introuvable.</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#efe3d0", backgroundColor: "#0e2e30" }}
      >
        <div style={{ width: 24, height: 24, border: "3px solid rgba(207,146,46,0.3)", borderTopColor: brandColor, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const fontDisplay = config.locale === "ar"
    ? "var(--font-display-ar), 'Aref Ruqaa', serif"
    : "'Bodoni Moda', Georgia, serif";
  const fontBody = "'Readex Pro', system-ui, sans-serif";
  const fontMono = "'DM Mono', ui-monospace, monospace";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;700&family=Readex+Pro:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div
        dir={config.locale === "ar" ? "rtl" : "ltr"}
        style={{
          minHeight: "100vh",
          backgroundColor: "#0e2e30",
          color: "#efe3d0",
          fontFamily: fontBody,
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
          <header style={{ textAlign: "center", marginBottom: 28 }}>
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.name}
                style={{ height: 48, margin: "0 auto 12px", display: "block", objectFit: "contain" }}
              />
            ) : null}
            <h1
              style={{
                fontFamily: fontDisplay,
                fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
                fontWeight: 500,
                color: "#efe3d0",
                lineHeight: 1.2,
              }}
            >
              {config.name}
            </h1>
          </header>

          {status.kind === "done" ? (
            <div
              style={{
                border: `1px solid ${brandColor}66`,
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                backgroundColor: "rgba(7,27,28,0.6)",
              }}
            >
              <p style={{ fontFamily: fontDisplay, fontSize: "1.5rem", color: brandColor, marginBottom: 12 }}>
                Réservation confirmée
              </p>
              <p style={{ marginBottom: 12 }}>
                {status.date} à {status.time} pour {status.partySize} personne{status.partySize > 1 ? "s" : ""}
              </p>
              <p style={{ fontFamily: fontMono, fontSize: "0.85rem", letterSpacing: "0.12em", color: "#b9ad9c" }}>
                {status.reference}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus({ kind: "idle" });
                  setMinutes(null);
                  setNotes("");
                }}
                style={{
                  marginTop: 20,
                  background: "none",
                  border: "none",
                  color: "#3fa89b",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Nouvelle réservation
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelStyle}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={todayISO(tz)}
                  max={maxDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setMinutes(null);
                  }}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Nombre de personnes
                </label>
                <select
                  value={partySize}
                  onChange={(e) => {
                    setPartySize(Number(e.target.value));
                    setMinutes(null);
                  }}
                  style={inputStyle}
                >
                  {Array.from(
                    { length: config.booking.maxPartySize },
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <fieldset style={{ border: "none" }}>
                <legend style={labelStyle}>
                  Heure
                </legend>
                <div style={{ marginTop: 10, minHeight: 56 }}>
                  {loading || slots === null ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            height: 40,
                            width: 72,
                            borderRadius: 9999,
                            backgroundColor: "rgba(239,227,208,0.05)",
                            display: "inline-block",
                          }}
                        />
                      ))}
                    </div>
                  ) : failed ? (
                    <p style={{ fontSize: 14, color: "#e7765e" }}>
                      Les créneaux ne sont pas disponibles pour le moment.
                    </p>
                  ) : closed || slots.length === 0 ? (
                    <p style={{ fontSize: 14, color: "#e7765e" }}>
                      Fermé ce jour-là.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {groupByPeriod(slots).map((group) => (
                        <div key={group.period}>
                          <p
                            style={{
                              fontFamily: fontMono,
                              fontSize: "0.6rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.18em",
                              color: "rgba(185,173,156,0.7)",
                              marginBottom: 6,
                            }}
                          >
                            {PERIOD_LABELS[group.period]}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {group.slots.map((slot) => (
                              <button
                                key={slot.minutes}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setMinutes(slot.minutes)}
                                style={{
                                  minHeight: 40,
                                  padding: "0 14px",
                                  borderRadius: 9999,
                                  border: `1px solid ${
                                    selected === slot.minutes
                                      ? brandColor
                                      : slot.available
                                        ? "rgba(239,227,208,0.25)"
                                        : "rgba(239,227,208,0.1)"
                                  }`,
                                  backgroundColor:
                                    selected === slot.minutes
                                      ? brandColor
                                      : "transparent",
                                  color:
                                    selected === slot.minutes
                                      ? "#071b1c"
                                      : slot.available
                                        ? "#efe3d0"
                                        : "rgba(185,173,156,0.4)",
                                  fontFamily: fontMono,
                                  fontSize: "0.85rem",
                                  fontVariantNumeric: "tabular-nums",
                                  cursor: slot.available ? "pointer" : "default",
                                  textDecoration: slot.available ? "none" : "line-through",
                                  transition: "all 0.15s ease",
                                }}
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
              </fieldset>

              {config.zones.length > 0 && (
                <fieldset style={{ border: "none" }}>
                  <legend style={labelStyle}>
                    Zone
                  </legend>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setZone("")}
                      style={{
                        ...zoneChipStyle,
                        borderColor: zone === "" ? "#3fa89b" : "rgba(239,227,208,0.2)",
                        backgroundColor: zone === "" ? "rgba(63,168,155,0.15)" : "transparent",
                        color: zone === "" ? "#3fa89b" : "#b9ad9c",
                      }}
                    >
                      Toute
                    </button>
                    {config.zones.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setZone(z.id)}
                        style={{
                          ...zoneChipStyle,
                          borderColor: zone === z.id ? "#3fa89b" : "rgba(239,227,208,0.2)",
                          backgroundColor: zone === z.id ? "rgba(63,168,155,0.15)" : "transparent",
                          color: zone === z.id ? "#3fa89b" : "#b9ad9c",
                        }}
                      >
                        {ZONE_LABELS[z.id] ?? z.id}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div>
                <label style={labelStyle}>
                  Nom
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="+216 20 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Notes <span style={{ color: "#b9ad9c", fontSize: 12 }}>(optionnel)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {status.kind === "error" && (
                <p role="alert" style={{ fontSize: 14, color: "#e7765e" }}>
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={status.kind === "sending"}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 9999,
                  border: "none",
                  backgroundColor: brandColor,
                  color: "#071b1c",
                  fontFamily: fontBody,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: status.kind === "sending" ? "default" : "pointer",
                  opacity: status.kind === "sending" ? 0.6 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                {status.kind === "sending" ? "Envoi…" : "Réserver"}
              </button>
            </form>
          )}

          <p
            style={{
              textAlign: "center",
              marginTop: 28,
              fontSize: 11,
              color: "rgba(185,173,156,0.5)",
            }}
        >
          Propulsé par E-Coffee Node
        </p>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'DM Mono', ui-monospace, monospace",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#b9ad9c",
};

const inputStyle: React.CSSProperties = {
  marginTop: 6,
  width: "100%",
  minHeight: 44,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(239,227,208,0.2)",
  backgroundColor: "rgba(7,27,28,0.6)",
  color: "#efe3d0",
  fontFamily: "'Readex Pro', system-ui, sans-serif",
  fontSize: 15,
  outline: "none",
  transition: "border-color 0.15s ease",
};

const zoneChipStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "0 16px",
  borderRadius: 9999,
  border: "1px solid",
  backgroundColor: "transparent",
  fontFamily: "'Readex Pro', system-ui, sans-serif",
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

function translateError(data: {
  error?: string;
  code?: string;
  minutes?: number;
  days?: number;
  max?: number;
  alternatives?: string[];
}): string {
  if (data.error === "rate_limited") return "Trop de demandes. Réessayez dans un moment.";

  switch (data.code) {
    case "CLOSED":
      return "Le restaurant est fermé à cette date.";
    case "TOO_SOON":
      return `Créneau trop proche. Réservez au moins ${data.minutes ?? 60} minutes à l'avance.`;
    case "TOO_FAR":
      return `Réservation trop lointaine. Maximum ${data.days ?? 60} jours à l'avance.`;
    case "PARTY_TOO_LARGE":
      return `Groupe trop grand. Maximum ${data.max ?? 12} personnes.`;
    case "FULL":
      return `Complet. Essayer : ${(data.alternatives ?? []).join(", ")}.`;
    case "INVALID_PHONE":
      return "Numéro de téléphone invalide.";
    case "INVALID_NAME":
      return "Veuillez saisir votre nom.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}
