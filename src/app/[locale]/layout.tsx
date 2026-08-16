import type { Metadata } from "next";
import { Aref_Ruqaa, Bodoni_Moda, DM_Mono, Readex_Pro } from "next/font/google";
import { notFound } from "next/navigation";

import "@/app/globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { isLocale, locales, localeDirection, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

/**
 * Le titrage prend une didone à fort contraste ; l'arabe passe à une ruqaa
 * calligraphique, qui tient la même intention sans imiter le latin. Le corps
 * de texte est une seule famille couvrant latin et arabe, pour que les trois
 * versions du site aient la même couleur de texte.
 */
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
  weight: ["400", "500", "700"],
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  variable: "--font-aref",
  display: "swap",
  weight: ["400", "700"],
});

const readex = Readex_Pro({
  subsets: ["latin", "arabic"],
  variable: "--font-readex",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
  weight: ["400", "500"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Rendu à la demande, et non pré-rendu.
 *
 * C'est le prix de la CSP à nonce (voir src/proxy.ts) : le nonce change à chaque
 * requête, une page servie depuis un cache statique porterait donc un nonce
 * périmé et ses scripts seraient bloqués. Effet de bord bienvenu : l'état
 * « ouvert / fermé » de l'en-tête est toujours exact.
 *
 * Pour revenir au statique, retirer cette ligne, remettre `export const
 * revalidate = 60`, et remplacer le `script-src` à nonce du proxy par
 * `'self' 'unsafe-inline'`.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dictionary.meta.title,
      description: dictionary.meta.description,
      type: "website",
      locale,
      siteName: site.name,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale: Locale = locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <html
      lang={typedLocale}
      dir={localeDirection[typedLocale]}
      className={`${bodoni.variable} ${arefRuqaa.variable} ${readex.variable} ${dmMono.variable}`}
    >
      <body className="min-h-dvh bg-night text-shell antialiased">
        <a className="skip-link" href="#contenu">
          {dictionary.nav.skipToContent}
        </a>
        <SiteHeader locale={typedLocale} dictionary={dictionary} />
        <main id="contenu">{children}</main>
        <SiteFooter locale={typedLocale} dictionary={dictionary} />
      </body>
    </html>
  );
}
