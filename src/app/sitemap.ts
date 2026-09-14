import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticPages = [
  "",
  "/reserver",
  "/carte",
  "/commander",
  "/fidelite",
  "/avis",
  "/galerie",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: (page === "" ? "daily" : "weekly") as
        | "daily"
        | "weekly",
      priority: page === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${page}`]),
        ),
      },
    })),
  );
}
