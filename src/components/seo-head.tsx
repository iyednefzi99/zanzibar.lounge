import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { site } from "@/content/site";

type SeoHeadProps = {
  locale: Locale;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  slug?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Renders a full set of SEO <meta> tags, Open Graph, Twitter Card, canonical
 * links, alternate language links, and preconnect hints. Designed to be placed
 * inside a Next.js `<head>`.
 *
 * Next.js already handles basic metadata via `generateMetadata`; this component
 * adds advanced, page-level SEO control when needed.
 */
export function SeoHead({
  locale,
  title,
  description,
  keywords,
  image,
  slug = "",
  type = "website",
  noindex = false,
}: SeoHeadProps) {
  const pageTitle = title
    ? `${title} — ${site.name}`
    : site.name;
  const pageDescription = description ?? site.tagline;
  const ogImage = image ?? `${baseUrl}/opengraph-image`;
  const canonical = `${baseUrl}/${locale}${slug ? `/${slug}` : ""}`;

  const alternateLanguages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}${slug ? `/${slug}` : ""}`]),
  );

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={canonical} />

      {locales.map((l) => (
        <link
          key={l}
          rel="alternate"
          hrefLang={l}
          href={`${baseUrl}/${l}${slug ? `/${slug}` : ""}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/${slug ? `/${slug}` : ""}`} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content={locale} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={site.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.instagram.com" />
      <meta name="theme-color" content="#0a0f1a" />

      {Object.entries(alternateLanguages).map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
    </>
  );
}
