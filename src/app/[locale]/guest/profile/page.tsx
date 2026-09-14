"use client";

import { use, useCallback, useEffect, useState } from "react";

type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  birthday: string | null;
  favoriteZone: string | null;
  defaultPartySize: number;
  language: string;
  pushEnabled: boolean;
  emailOptIn: boolean;
};

const ZONES = [
  { value: "TERRASSE", label: { fr: "Terrasse", ar: "تراس", en: "Terrace" } },
  { value: "SALLE", label: { fr: "Salle", ar: "قاعة", en: "Hall" } },
  { value: "SALON", label: { fr: "Salon", ar: "صالة", en: "Lounge" } },
] as const;

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
] as const;

export default function GuestProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favoriteZone, setFavoriteZone] = useState<string>("");
  const [defaultPartySize, setDefaultPartySize] = useState(2);
  const [language, setLanguage] = useState(locale);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/profile");
      if (res.ok) {
        const data = await res.json();
        const p = data.profile as Profile | null;
        if (p) {
          setDisplayName(p.displayName ?? "");
          setBirthday(p.birthday ? p.birthday.split("T")[0] : "");
          setFavoriteZone(p.favoriteZone ?? "");
          setDefaultPartySize(p.defaultPartySize);
          setLanguage(p.language);
          setPushEnabled(p.pushEnabled);
          setEmailOptIn(p.emailOptIn);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cancelled) {
        await fetchProfile();
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/guest/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          birthday: birthday || null,
          favoriteZone: favoriteZone || null,
          defaultPartySize,
          language,
          pushEnabled,
          emailOptIn,
        }),
      });
      if (res.ok) {
        setSaved(true);
        fetchProfile();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <p className="text-center text-shell-dim">
          {locale === "fr" ? "Chargement..." : locale === "ar" ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-shell">
        {locale === "fr" ? "Mon profil" : locale === "ar" ? "ملفي الشخصي" : "My profile"}
      </h1>

      <div className="mt-8 space-y-6">
        {/* Display name */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-shell-dim">
            {locale === "fr" ? "Nom affiché" : locale === "ar" ? "الاسم المعروض" : "Display name"}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={
              locale === "fr"
                ? "Votre nom"
                : locale === "ar"
                  ? "اسمك"
                  : "Your name"
            }
            className="mt-2 w-full rounded-lg border border-shell/20 bg-deep/60 px-4 py-3 text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-shell-dim">
            {locale === "fr" ? "Date de naissance" : locale === "ar" ? "تاريخ الميلاد" : "Birthday"}
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-2 w-full rounded-lg border border-shell/20 bg-deep/60 px-4 py-3 text-shell focus:border-brass focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Favorite zone */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-shell-dim">
            {locale === "fr" ? "Zone préférée" : locale === "ar" ? "المنطقة المفضلة" : "Favorite zone"}
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ZONES.map((zone) => (
              <button
                key={zone.value}
                onClick={() => setFavoriteZone(favoriteZone === zone.value ? "" : zone.value)}
                className={`min-h-[44px] rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  favoriteZone === zone.value
                    ? "border-brass bg-brass/20 text-brass"
                    : "border-shell/20 bg-deep/40 text-shell-dim hover:border-shell/40"
                }`}
              >
                {zone.label[locale as keyof typeof zone.label]}
              </button>
            ))}
          </div>
        </div>

        {/* Default party size */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-shell-dim">
            {locale === "fr" ? "Taille par défaut" : locale === "ar" ? "الحجم الافتراضي" : "Default party size"}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setDefaultPartySize(Math.max(1, defaultPartySize - 1))}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-shell/20 bg-deep/40 text-shell text-xl font-bold"
            >
              -
            </button>
            <span className="min-w-[3rem] text-center font-mono text-2xl tabular-nums text-shell">
              {defaultPartySize}
            </span>
            <button
              onClick={() => setDefaultPartySize(Math.min(12, defaultPartySize + 1))}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-shell/20 bg-deep/40 text-shell text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-shell-dim">
            {locale === "fr" ? "Langue" : locale === "ar" ? "اللغة" : "Language"}
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`min-h-[44px] rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  language === lang.value
                    ? "border-brass bg-brass/20 text-brass"
                    : "border-shell/20 bg-deep/40 text-shell-dim hover:border-shell/40"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <ToggleRow
            label={
              locale === "fr"
                ? "Notifications push"
                : locale === "ar"
                  ? "إشعارات الدفع"
                  : "Push notifications"
            }
            description={
              locale === "fr"
                ? "Recevoir les rappels et offres"
                : locale === "ar"
                  ? "تذكيرات وعروض"
                  : "Reminders and offers"
            }
            checked={pushEnabled}
            onChange={setPushEnabled}
          />
          <ToggleRow
            label={
              locale === "fr"
                ? "Offres par email"
                : locale === "ar"
                  ? "عروض عبر البريد الإلكتروني"
                  : "Email offers"
            }
            description={
              locale === "fr"
                ? "Promotions et nouveautés"
                : locale === "ar"
                  ? "الترويج والعروض الجديدة"
                  : "Promotions and news"
            }
            checked={emailOptIn}
            onChange={setEmailOptIn}
          />
        </div>

        {/* Save button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-colors min-h-[44px] ${
              saved
                ? "bg-lagoon text-deep"
                : "bg-brass text-deep hover:bg-brass/90"
            } disabled:opacity-50`}
          >
            {saving
              ? "..."
              : saved
                ? locale === "fr"
                  ? "✓ Sauvegardé"
                  : locale === "ar"
                    ? "✓ تم الحفظ"
                    : "✓ Saved"
                : locale === "fr"
                  ? "Sauvegarder"
                  : locale === "ar"
                    ? "حفظ"
                    : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-4 py-3.5">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium text-shell">{label}</p>
        <p className="text-xs text-shell-dim">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brass" : "bg-shell/20"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block size-5 rounded-full bg-shell shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
