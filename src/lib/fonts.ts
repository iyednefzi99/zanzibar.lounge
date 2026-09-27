import { Aref_Ruqaa, DM_Mono, Fraunces, Inter } from "next/font/google";

/**
 * Charcoal & gold luxe typography — self-hosted via next/font so the
 * `font-src 'self'` CSP (src/proxy.ts) stays satisfied. Each loader exposes a
 * CSS custom property consumed by the tokens in src/app/globals.css.
 */

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fraunces",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-dm-mono",
});

export const arefRuqaa = Aref_Ruqaa({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-aref",
});

/** Class to apply to <html> — loads all four families as CSS variables. */
export const fontVariables = [
  fraunces.variable,
  inter.variable,
  dmMono.variable,
  arefRuqaa.variable,
].join(" ");
