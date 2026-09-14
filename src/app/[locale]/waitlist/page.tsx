"use client";

import { useEffect, useState } from "react";

type WaitlistEntry = {
  id: string;
  date: string;
  partySize: number;
  status: "waiting" | "notified" | "expired";
  position: number;
  ahead: number;
};

type Dict = {
  title: string;
  lead: string;
  date: string;
  partySize: string;
  join: string;
  joining: string;
  success: string;
  error: string;
  position: string;
  ahead: string;
  status: string;
  waiting: string;
  notified: string;
  expired: string;
  cancel: string;
  cancelled: string;
  yourEntries: string;
  noEntries: string;
  notifyMessage: string;
};

const DICTS: Record<string, Dict> = {
  fr: {
    title: "File d'attente",
    lead: "Inscrivez-vous pour une date donnée et soyez notifié dès qu'une table se libère.",
    date: "Date (AAAA-MM-JJ)",
    partySize: "Nombre de personnes",
    join: "Rejoindre la file",
    joining: "Inscription…",
    success: "Vous êtes inscrit ! Nous vous notifierons dès qu'une table sera disponible.",
    error: "Une erreur est survenue. Veuillez réessayer.",
    position: "Votre position",
    ahead: "personne(s) avant vous",
    status: "Statut",
    waiting: "En attente",
    notified: "Notifié(e)",
    expired: "Expiré",
    cancel: "Annuler",
    cancelled: "Inscription annulée.",
    yourEntries: "Vos inscriptions",
    noEntries: "Vous n'avez aucune inscription en cours.",
    notifyMessage: "Une table est disponible ! Réservez maintenant.",
  },
  ar: {
    title: "قائمة الانتظار",
    lead: "سجل بتاريخ محدد واحصل على إشعار عندما تتوفر طاولة.",
    date: "التاريخ (AAAA-MM-JJ)",
    partySize: "عدد الأشخاص",
    join: "الانضمام إلى القائمة",
    joining: "جارٍ الانضمام…",
    success: "تم التسجيل! سن notifyingك عندما تتوفر طاولة.",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    position: "موقعك",
    ahead: "شخص(أشخاص) أمامك",
    status: "الحالة",
    waiting: "في الانتظار",
    notified: "تم الإشعار",
    expired: "منتهي الصلاحية",
    cancel: "إلغاء",
    cancelled: "تم إلغاء التسجيل.",
    yourEntries: "تسجيلاتك",
    noEntries: "ليس لديك تسجيلات نشطة.",
    notifyMessage: "طاولة متاحة! احجز الآن.",
  },
  en: {
    title: "Waitlist",
    lead: "Sign up for a specific date and get notified when a table opens up.",
    date: "Date (YYYY-MM-DD)",
    partySize: "Party size",
    join: "Join waitlist",
    joining: "Joining…",
    success: "You're on the list! We'll notify you when a table becomes available.",
    error: "Something went wrong. Please try again.",
    position: "Your position",
    ahead: "people ahead of you",
    status: "Status",
    waiting: "Waiting",
    notified: "Notified",
    expired: "Expired",
    cancel: "Cancel",
    cancelled: "Entry cancelled.",
    yourEntries: "Your entries",
    noEntries: "You have no active entries.",
    notifyMessage: "A table is available! Book now.",
  },
};

export default function WaitlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState<string>("fr");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.entries) setEntries(data.entries);
      })
      .catch(() => {});
  }, []);

  const dict = DICTS[locale] ?? DICTS.fr;

  async function loadEntries() {
    try {
      const res = await fetch("/api/waitlist");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {}
  }

  async function handleJoin() {
    if (!date.trim()) return;
    setJoining(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date.trim(), partySize }),
      });
      if (res.ok) {
        setStatus("success");
        setDate("");
        loadEntries();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setJoining(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await fetch(`/api/waitlist/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <header>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dict.title}
        </h1>
        <p className="mt-4 max-w-xl text-shell-dim">{dict.lead}</p>
      </header>

      {/* Formulaire */}
      <section className="mt-10 rounded-xl border border-shell/10 bg-deep/40 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
              {dict.date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-shell-dim">
              {dict.partySize}
            </label>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="mt-2 w-full rounded-full border border-shell/25 bg-deep px-4 py-2.5 text-shell focus:border-brass focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === "success" && (
          <p className="mt-4 text-sm text-lagoon">{dict.success}</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm text-coral">{dict.error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={!date.trim() || joining}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-brass bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
        >
          {joining ? dict.joining : dict.join}
        </button>
      </section>

      {/* Entrées existantes */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {dict.yourEntries}
        </h2>

        {entries.length === 0 ? (
          <p className="mt-4 text-shell-dim">{dict.noEntries}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 p-4"
              >
                <div>
                  <p className="text-shell">
                    {entry.date} — {entry.partySize}{" "}
                    {entry.partySize > 1 ? "personnes" : "personne"}
                  </p>
                  <div className="mt-1 flex items-baseline gap-3 text-sm text-shell-dim">
                    <span>
                      {dict.position} : <strong className="text-brass">{entry.position}</strong>
                    </span>
                    {entry.ahead > 0 && <span>({entry.ahead} {dict.ahead})</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        entry.status === "waiting"
                          ? "bg-brass/20 text-brass"
                          : entry.status === "notified"
                            ? "bg-lagoon/20 text-lagoon"
                            : "bg-shell/10 text-shell-dim"
                      }`}
                    >
                      {entry.status === "waiting"
                        ? dict.waiting
                        : entry.status === "notified"
                          ? dict.notified
                          : dict.expired}
                    </span>
                  </div>
                  {entry.status === "notified" && (
                    <p className="mt-2 text-sm text-lagoon">{dict.notifyMessage}</p>
                  )}
                </div>
                {entry.status === "waiting" && (
                  <button
                    onClick={() => handleCancel(entry.id)}
                    className="text-sm text-coral hover:underline"
                  >
                    {dict.cancel}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
