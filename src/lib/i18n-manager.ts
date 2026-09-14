import {
  locales,
  type Locale,
  localeDirection,
  localeLabel,
  localeShortLabel,
  defaultLocale,
} from "@/i18n/config";

export interface LocaleInfo {
  code: Locale;
  name: string;
  dir: "ltr" | "rtl";
  flag: string;
  shortLabel: string;
}

const FLAGS: Record<Locale, string> = {
  fr: "\u{1F1EB}\u{1F1F7}",
  ar: "\u{1F1F8}\u{1F1E6}",
  en: "\u{1F1EC}\u{1F1E7}",
  de: "\u{1F1E9}\u{1F1EA}",
  es: "\u{1F1EA}\u{1F1F8}",
  it: "\u{1F1EE}\u{1F1F9}",
  pt: "\u{1F1F5}\u{1F1F9}",
  ru: "\u{1F1F7}\u{1F1FA}",
  zh: "\u{1F1E8}\u{1F1F3}",
  ja: "\u{1F1EF}\u{1F1F5}",
};

const RTL_LOCALES: Locale[] = locales.filter(
  (locale) => localeDirection[locale] === "rtl",
);

export function getSupportedLocales(): readonly Locale[] {
  return locales;
}

export function getLocaleInfo(locale: Locale): LocaleInfo {
  return {
    code: locale,
    name: localeLabel[locale],
    dir: localeDirection[locale],
    flag: FLAGS[locale],
    shortLabel: localeShortLabel[locale],
  };
}

export function getRTL_LOCALES(): readonly Locale[] {
  return RTL_LOCALES;
}

export function detectBrowserLocale(acceptLanguage: string | null): Locale {
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
    if ((locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }
  return defaultLocale;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  try {
    return new Intl.NumberFormat(getIntlCode(locale), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d =
    typeof date === "string"
      ? new Date(date)
      : typeof date === "number"
        ? new Date(date)
        : date;

  try {
    return new Intl.DateTimeFormat(getIntlCode(locale), {
      dateStyle: "medium",
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatNumber(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(getIntlCode(locale), options).format(number);
  } catch {
    return String(number);
  }
}

function getIntlCode(locale: Locale): string {
  const mapping: Record<Locale, string> = {
    fr: "fr-FR",
    ar: "ar-TN",
    en: "en-US",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    pt: "pt-BR",
    ru: "ru-RU",
    zh: "zh-CN",
    ja: "ja-JP",
  };
  return mapping[locale] ?? locale;
}
