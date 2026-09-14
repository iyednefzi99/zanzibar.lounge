"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type WidgetProps = {
  slug: string;
  theme?: string;
  lang?: "fr" | "ar" | "en";
  baseUrl?: string;
};

const ZONE_LABELS: Record<string, Record<string, string>> = {
  fr: { terrasse: "Terrasse", salle: "Salle", salon: "Salon" },
  en: { terrasse: "Terrace", salle: "Dining room", salon: "Lounge" },
  ar: { terrasse: "تراس", salle: "قاعة", salon: "صالون" },
};

const PERIOD_LABELS: Record<string, Record<string, string>> = {
  fr: { morning: "Matin", afternoon: "Après-midi", evening: "Soir", late: "Nuit" },
  en: { morning: "Morning", afternoon: "Afternoon", evening: "Evening", late: "Night" },
  ar: { morning: "صباحاً", afternoon: "بعد الظهر", evening: "مساءً", late: "ليلاً" },
};

type Period = "morning" | "afternoon" | "evening" | "late";
const PERIODS: Period[] = ["morning", "afternoon", "evening", "late"];

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

function translateError(data: {
  error?: string;
  code?: string;
  minutes?: number;
  days?: number;
  max?: number;
  alternatives?: string[];
}, lang: string): string {
  const t =
    lang === "ar"
      ? {
          rateLimited: "طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.",
          closed: "المطعم مغلق في هذا التاريخ.",
          tooSoon: "الموعد قريب جداً. احجز على الأقل {minutes} دقيقة مسبقاً.",
          tooFar: "الحجز بعيد جداً. الحد الأقصى {days} أيام مسبقاً.",
          partyTooLarge: "المجموعة كبيرة جداً. الحد الأقصى {max} أشخاص.",
          full: "مكتمل. جرّب: {alternatives}.",
          invalidPhone: "رقم الهاتف غير صالح.",
          invalidName: "يرجى إدخال اسمك.",
          generic: "حدث خطأ. حاول مرة أخرى.",
          sending: "جارٍ الإرسال…",
          submit: "احجز",
          name: "الاسم",
          phone: "الهاتف",
          date: "التاريخ",
          partySize: "عدد الأشخاص",
          time: "الوقت",
          zone: "المنطقة",
          anyZone: "أي منطقة",
          notes: "ملاحظات",
          notesOptional: "(اختياري)",
          confirmed: "تم تأكيد الحجز",
          newBooking: "حجز جديد",
          poweredBy: "بدعم من",
        }
      : lang === "en"
        ? {
            rateLimited: "Too many requests. Try again shortly.",
            closed: "Restaurant closed on this date.",
            tooSoon: "Too soon. Book at least {minutes} minutes in advance.",
            tooFar: "Too far ahead. Maximum {days} days in advance.",
            partyTooLarge: "Group too large. Maximum {max} people.",
            full: "Full. Try: {alternatives}.",
            invalidPhone: "Invalid phone number.",
            invalidName: "Please enter your name.",
            generic: "An error occurred. Please try again.",
            sending: "Sending…",
            submit: "Book",
            name: "Name",
            phone: "Phone",
            date: "Date",
            partySize: "Party size",
            time: "Time",
            zone: "Zone",
            anyZone: "Any",
            notes: "Notes",
            notesOptional: "(optional)",
            confirmed: "Reservation confirmed",
            newBooking: "New reservation",
            poweredBy: "Powered by",
          }
        : {
            rateLimited: "Trop de demandes. Réessayez dans un moment.",
            closed: "Le restaurant est fermé à cette date.",
            tooSoon: "Créneau trop proche. Réservez au moins {minutes} minutes à l'avance.",
            tooFar: "Réservation trop lointaine. Maximum {days} jours à l'avance.",
            partyTooLarge: "Groupe trop grand. Maximum {max} personnes.",
            full: "Complet. Essayer : {alternatives}.",
            invalidPhone: "Numéro de téléphone invalide.",
            invalidName: "Veuillez saisir votre nom.",
            generic: "Une erreur est survenue. Réessayez.",
            sending: "Envoi…",
            submit: "Réserver",
            name: "Nom",
            phone: "Téléphone",
            date: "Date",
            partySize: "Personnes",
            time: "Heure",
            zone: "Zone",
            anyZone: "Toute",
            notes: "Notes",
            notesOptional: "(optionnel)",
            confirmed: "Réservation confirmée",
            newBooking: "Nouvelle réservation",
            poweredBy: "Propulsé par",
          };

  if (data.error === "rate_limited") return t.rateLimited;

  switch (data.code) {
    case "CLOSED":
      return t.closed;
    case "TOO_SOON":
      return t.tooSoon.replace("{minutes}", String(data.minutes ?? 60));
    case "TOO_FAR":
      return t.tooFar.replace("{days}", String(data.days ?? 60));
    case "PARTY_TOO_LARGE":
      return t.partyTooLarge.replace("{max}", String(data.max ?? 12));
    case "FULL":
      return t.full.replace("{alternatives}", (data.alternatives ?? []).join(", "));
    case "INVALID_PHONE":
      return t.invalidPhone;
    case "INVALID_NAME":
      return t.invalidName;
    default:
      return t.generic;
  }
}

export function EmbedWidget({
  slug,
  theme,
  lang = "fr",
  baseUrl,
}: WidgetProps) {
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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const base = baseUrl ?? "";

  const postMessage = useCallback(
    (data: Record<string, unknown>) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "e-coffee-widget", ...data },
          "*",
        );
      } catch {}
    },
    [],
  );

  useEffect(() => {
    fetch(`${base}/api/widget/config/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setConfig(data.data);
          setDate(todayISO(data.data.timezone));
          setPartySize(Math.min(2, data.data.booking.maxPartySize));
        } else {
          setConfigError(true);
        }
      })
      .catch(() => setConfigError(true));
  }, [slug, base]);

  const tz = config?.timezone ?? "Africa/Tunis";
  const maxDate = useMemo(
    () => addDaysISO(todayISO(tz), config?.booking.maxDaysAhead ?? 60),
    [tz, config],
  );

  const slotKey = `${date}|${partySize}`;
  const entry = cache[slotKey];
  const loading = entry === undefined;

  useEffect(() => {
    if (!date) return;
    if (cache[slotKey]) return;

    const controller = new AbortController();
    fetch(
      `${base}/api/widget/availability?slug=${encodeURIComponent(slug)}&date=${date}&party=${partySize}`,
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
  }, [slug, date, partySize, cache, slotKey, base]);

  const slots = entry?.slots ?? null;
  const closed = entry?.closed ?? false;
  const failed = entry?.failed ?? false;

  const selected =
    minutes !== null && slots?.some((s) => s.minutes === minutes)
      ? minutes
      : null;

  const t = {
    fr: {
      rateLimited: "Trop de demandes. Réessayez dans un moment.",
      closed: "Le restaurant est fermé à cette date.",
      tooSoon: "Créneau trop proche. Réservez au moins {minutes} minutes à l'avance.",
      tooFar: "Réservation trop lointaine. Maximum {days} jours à l'avance.",
      partyTooLarge: "Groupe trop grand. Maximum {max} personnes.",
      full: "Complet. Essayer : {alternatives}.",
      invalidPhone: "Numéro de téléphone invalide.",
      invalidName: "Veuillez saisir votre nom.",
      generic: "Une erreur est survenue. Réessayez.",
      sending: "Envoi…",
      submit: "Réserver",
      name: "Nom",
      phone: "Téléphone",
      date: "Date",
      partySize: "Personnes",
      time: "Heure",
      zone: "Zone",
      anyZone: "Toute",
      notes: "Notes",
      notesOptional: "(optionnel)",
      confirmed: "Réservation confirmée",
      newBooking: "Nouvelle réservation",
      poweredBy: "Propulsé par",
    },
    en: {
      rateLimited: "Too many requests. Try again shortly.",
      closed: "Restaurant closed on this date.",
      tooSoon: "Too soon. Book at least {minutes} minutes in advance.",
      tooFar: "Too far ahead. Maximum {days} days in advance.",
      partyTooLarge: "Group too large. Maximum {max} people.",
      full: "Full. Try: {alternatives}.",
      invalidPhone: "Invalid phone number.",
      invalidName: "Please enter your name.",
      generic: "An error occurred. Please try again.",
      sending: "Sending…",
      submit: "Book",
      name: "Name",
      phone: "Phone",
      date: "Date",
      partySize: "Party size",
      time: "Time",
      zone: "Zone",
      anyZone: "Any",
      notes: "Notes",
      notesOptional: "(optional)",
      confirmed: "Reservation confirmed",
      newBooking: "New reservation",
      poweredBy: "Powered by",
    },
    ar: {
      rateLimited: "طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.",
      closed: "المطعم مغلق في هذا التاريخ.",
      tooSoon: "الموعد قريب جداً. احجز على الأقل {minutes} دقيقة مسبقاً.",
      tooFar: "الحجز بعيد جداً. الحد الأقصى {days} أيام مسبقاً.",
      partyTooLarge: "المجموعة كبيرة جداً. الحد الأقصى {max} أشخاص.",
      full: "مكتمل. جرّب: {alternatives}.",
      invalidPhone: "رقم الهاتف غير صالح.",
      invalidName: "يرجى إدخال اسمك.",
      generic: "حدث خطأ. حاول مرة أخرى.",
      sending: "جارٍ الإرسال…",
      submit: "احجز",
      name: "الاسم",
      phone: "الهاتف",
      date: "التاريخ",
      partySize: "عدد الأشخاص",
      time: "الوقت",
      zone: "المنطقة",
      anyZone: "أي منطقة",
      notes: "ملاحظات",
      notesOptional: "(اختياري)",
      confirmed: "تم تأكيد الحجز",
      newBooking: "حجز جديد",
      poweredBy: "بدعم من",
    },
  }[lang];

  const brandColor = theme ?? config?.brandColor ?? "#c9922e";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status.kind === "sending") return;

    if (name.trim().length < 2) {
      return setStatus({ kind: "error", message: t.invalidName });
    }
    if (phone.trim().length < 6) {
      return setStatus({ kind: "error", message: t.invalidPhone });
    }
    if (selected === null) {
      return setStatus({ kind: "error", message: t.generic });
    }

    setStatus({ kind: "sending" });

    try {
      const response = await fetch(`${base}/api/widget/reserve`, {
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
          locale: lang,
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
        postMessage({
          event: "reserved",
          reference: data.reference,
          date: data.date,
          time: data.time,
          partySize: data.partySize,
        });
        return;
      }

      setStatus({ kind: "error", message: translateError(data, lang) });
    } catch {
      setStatus({ kind: "error", message: t.generic });
    }
  }

  const isRtl = lang === "ar";
  const fontDisplay = isRtl
    ? "'Aref Ruqaa', serif"
    : "'Bodoni Moda', Georgia, serif";
  const fontBody = "'Readex Pro', system-ui, sans-serif";
  const fontMono = "'DM Mono', ui-monospace, monospace";

  if (configError) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#e7765e", fontSize: 14, textAlign: "center" }}>
          Restaurant introuvable.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            width: 24,
            height: 24,
            border: "3px solid rgba(207,146,46,0.3)",
            borderTopColor: brandColor,
            borderRadius: "50%",
            animation: "zspin 0.6s linear infinite",
          }}
        />
        <style>{`@keyframes zspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      ref={iframeRef}
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        fontFamily: fontBody,
        fontSize: 14,
        lineHeight: 1.5,
        color: "#efe3d0",
        backgroundColor: "#0e2e30",
        minHeight: 400,
        padding: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;700&family=Aref+Ruqaa:wght@400;700&family=Readex+Pro:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes zspin { to { transform: rotate(360deg); } }
        .zw * { box-sizing: border-box; }
        .zw input:focus, .zw select:focus, .zw textarea:focus { border-color: ${brandColor} !important; outline: none; }
      `}</style>

      <div className="zw" style={{ padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.name}
              style={{ height: 36, margin: "0 auto 8px", display: "block", objectFit: "contain" }}
            />
          ) : null}
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: "1.4rem",
              fontWeight: 500,
              color: "#efe3d0",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {config.name}
          </h2>
        </div>

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
            <p style={{ fontFamily: fontDisplay, fontSize: "1.3rem", color: brandColor, marginBottom: 10 }}>
              {t.confirmed}
            </p>
            <p style={{ marginBottom: 8 }}>
              {status.date} à {status.time} · {status.partySize} pers.
            </p>
            <p style={{ fontFamily: fontMono, fontSize: "0.8rem", letterSpacing: "0.12em", color: "#b9ad9c" }}>
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
                marginTop: 16,
                background: "none",
                border: "none",
                color: "#3fa89b",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: fontBody,
              }}
            >
              {t.newBooking}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>{t.date}</label>
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
              <label style={labelStyle}>{t.partySize}</label>
              <select
                value={partySize}
                onChange={(e) => {
                  setPartySize(Number(e.target.value));
                  setMinutes(null);
                }}
                style={inputStyle}
              >
                {Array.from({ length: config.booking.maxPartySize }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={labelStyle}>{t.time}</legend>
              <div style={{ marginTop: 8, minHeight: 48 }}>
                {loading || slots === null ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          height: 36,
                          width: 64,
                          borderRadius: 9999,
                          backgroundColor: "rgba(239,227,208,0.05)",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                ) : failed ? (
                  <p style={{ fontSize: 13, color: "#e7765e" }}>{t.generic}</p>
                ) : closed || slots.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#e7765e" }}>{t.closed}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {groupByPeriod(slots).map((group) => (
                      <div key={group.period}>
                        <p
                          style={{
                            fontFamily: fontMono,
                            fontSize: "0.55rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.18em",
                            color: "rgba(185,173,156,0.6)",
                            marginBottom: 4,
                          }}
                        >
                          {PERIOD_LABELS[lang]?.[group.period] ?? group.period}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {group.slots.map((slot) => (
                            <button
                              key={slot.minutes}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setMinutes(slot.minutes)}
                              style={{
                                minHeight: 36,
                                padding: "0 12px",
                                borderRadius: 9999,
                                border: `1px solid ${
                                  selected === slot.minutes
                                    ? brandColor
                                    : slot.available
                                      ? "rgba(239,227,208,0.2)"
                                      : "rgba(239,227,208,0.08)"
                                }`,
                                backgroundColor:
                                  selected === slot.minutes ? brandColor : "transparent",
                                color:
                                  selected === slot.minutes
                                    ? "#071b1c"
                                    : slot.available
                                      ? "#efe3d0"
                                      : "rgba(185,173,156,0.35)",
                                fontFamily: fontMono,
                                fontSize: "0.8rem",
                                fontVariantNumeric: "tabular-nums",
                                cursor: slot.available ? "pointer" : "default",
                                textDecoration: slot.available ? "none" : "line-through",
                                transition: "all 0.12s ease",
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
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={labelStyle}>{t.zone}</legend>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setZone("")}
                    style={{
                      ...chipStyle,
                      borderColor: zone === "" ? "#3fa89b" : "rgba(239,227,208,0.15)",
                      backgroundColor: zone === "" ? "rgba(63,168,155,0.12)" : "transparent",
                      color: zone === "" ? "#3fa89b" : "#b9ad9c",
                    }}
                  >
                    {t.anyZone}
                  </button>
                  {config.zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZone(z.id)}
                      style={{
                        ...chipStyle,
                        borderColor: zone === z.id ? "#3fa89b" : "rgba(239,227,208,0.15)",
                        backgroundColor: zone === z.id ? "rgba(63,168,155,0.12)" : "transparent",
                        color: zone === z.id ? "#3fa89b" : "#b9ad9c",
                      }}
                    >
                      {ZONE_LABELS[lang]?.[z.id] ?? z.id}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label style={labelStyle}>{t.name}</label>
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
              <label style={labelStyle}>{t.phone}</label>
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
                {t.notes} <span style={{ color: "#b9ad9c", fontSize: 11 }}>{t.notesOptional}</span>
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
              <p role="alert" style={{ fontSize: 13, color: "#e7765e", margin: 0 }}>
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={status.kind === "sending"}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 9999,
                border: "none",
                backgroundColor: brandColor,
                color: "#071b1c",
                fontFamily: fontBody,
                fontWeight: 600,
                fontSize: 14,
                cursor: status.kind === "sending" ? "default" : "pointer",
                opacity: status.kind === "sending" ? 0.6 : 1,
                transition: "opacity 0.12s ease",
              }}
            >
              {status.kind === "sending" ? t.sending : t.submit}
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 10,
            color: "rgba(185,173,156,0.4)",
          }}
        >
          {t.poweredBy} {config.name}
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0e2e30",
  color: "#efe3d0",
  fontFamily: "'Readex Pro', system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'DM Mono', ui-monospace, monospace",
  fontSize: "0.65rem",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#b9ad9c",
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  marginTop: 4,
  width: "100%",
  minHeight: 40,
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid rgba(239,227,208,0.18)",
  backgroundColor: "rgba(7,27,28,0.6)",
  color: "#efe3d0",
  fontFamily: "'Readex Pro', system-ui, sans-serif",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.12s ease",
};

const chipStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 14px",
  borderRadius: 9999,
  border: "1px solid",
  backgroundColor: "transparent",
  fontFamily: "'Readex Pro', system-ui, sans-serif",
  fontSize: 13,
  cursor: "pointer",
  transition: "all 0.12s ease",
};
