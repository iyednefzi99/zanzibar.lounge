import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { menu } from "@/content/menu";
import { site } from "@/content/site";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticPages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/reserver", changeFrequency: "weekly", priority: 0.9 },
  { path: "/carte", changeFrequency: "weekly", priority: 0.9 },
  { path: "/commander", changeFrequency: "weekly", priority: 0.8 },
  { path: "/fidelite", changeFrequency: "monthly", priority: 0.7 },
  { path: "/avis", changeFrequency: "weekly", priority: 0.8 },
  { path: "/galerie", changeFrequency: "monthly", priority: 0.6 },
];

const dayNames = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export default function dynamicSitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${page.path}`]),
        ),
      },
    })),
  );

  const menuEntries = locales.flatMap((locale) =>
    menu.flatMap((category) =>
      category.items.map((item) => ({
        url: `${baseUrl}/${locale}/carte#${item.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/carte#${item.id}`]),
          ),
        },
      })),
    ),
  );

  const scheduleEntries = site.hours.map((h) => ({
    url: `${baseUrl}/schedule/${dayNames[h.day]}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/schedule/${dayNames[h.day]}`]),
      ),
    },
  }));

  return [...staticEntries, ...menuEntries, ...scheduleEntries];
}
