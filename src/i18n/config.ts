export const locales = ["fr", "ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  fr: "ltr",
  ar: "rtl",
  en: "ltr",
};

/** Intitulé de chaque langue dans sa propre langue, pour le sélecteur. */
export const localeLabel: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

/** Étiquette courte du sélecteur — visible dans la barre de navigation. */
export const localeShortLabel: Record<Locale, string> = {
  fr: "FR",
  ar: "ع",
  en: "EN",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Choisit la meilleure langue à partir de l'en-tête Accept-Language. */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
