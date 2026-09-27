import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale, localeDirection, type Locale } from "@/i18n/config";
import { fontVariables } from "@/lib/fonts";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "E-Coffee Node | Lounge & Restaurant",
  description: "Café, restaurant et lounge à Medjez el Bab, Tunisie",
  openGraph: {
    title: "E-Coffee Node | Lounge & Restaurant",
    description: "Café, restaurant et lounge à Medjez el Bab, Tunisie",
    type: "website",
    locale: "fr_TN",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: site.name,
  description: site.tagline,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    postalCode: site.address.postalCode,
    addressCountry: "TN",
  },
  servesCuisine: ["Cafe", "Restaurant", "Tunisian"],
  url: process.env.NEXT_PUBLIC_SITE_URL,
  telephone: site.contact.phone,
};

export async function generateStaticParams() {
  return [{ locale: "fr" }, { locale: "ar" }, { locale: "en" }];
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <html
      lang={typedLocale}
      dir={localeDirection[typedLocale]}
      className={fontVariables}
    >
      <body className="min-h-dvh bg-deep font-sans text-shell antialiased selection:bg-brass/20 selection:text-brass">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="skip-link fixed start-4 top-4 z-50 -translate-y-full rounded-full bg-brass px-4 py-2 text-sm font-medium text-deep opacity-0 transition-all duration-300 focus:translate-y-0 focus:opacity-100"
        >
          {dictionary.nav.skipToContent}
        </a>
        <SiteHeader locale={typedLocale} dictionary={dictionary} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={typedLocale} dictionary={dictionary} />
      </body>
    </html>
  );
}
