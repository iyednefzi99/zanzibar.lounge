import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";

const dictionaries = {
  fr: () => import("./dictionaries/fr").then((m) => m.default),
  ar: () => import("./dictionaries/ar").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
  de: () => import("./dictionaries/de").then((m) => m.default),
  es: () => import("./dictionaries/es").then((m) => m.default),
  it: () => import("./dictionaries/it").then((m) => m.default),
  pt: () => import("./dictionaries/pt").then((m) => m.default),
  ru: () => import("./dictionaries/ru").then((m) => m.default),
  zh: () => import("./dictionaries/zh").then((m) => m.default),
  ja: () => import("./dictionaries/ja").then((m) => m.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

export type { Dictionary };

/** Remplace les jetons `{clé}` d'une chaîne traduite. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
