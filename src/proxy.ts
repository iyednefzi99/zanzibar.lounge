import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale, locales, matchLocale } from "@/i18n/config";
import { clearRateLimit, clientIp, isRateLimited, rateLimit } from "@/lib/rate-limit";

/**
 * Trois rôles : router vers la bonne langue, fermer le back-office, et produire
 * le nonce de la politique de sécurité du contenu.
 *
 * Le proxy (l'ancien « middleware » de Next) s'exécute sur l'Edge : il n'a accès
 * ni à Prisma ni à Node, d'où l'authentification HTTP Basic plutôt qu'une
 * session en base — et une comparaison à durée constante écrite à la main.
 *
 * ⚠️ Ce filtre est la première barrière du back-office, pas la seule : les
 * actions serveur revérifient l'identité elles-mêmes (voir lib/admin-auth.ts).
 */

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$/;

/** Dix échecs d'authentification par adresse et par quart d'heure. */
const ADMIN_MAX_FAILURES = 10;
const ADMIN_WINDOW_MS = 15 * 60_000;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Le back-office vit sous /fr/admin, /ar/admin… : on le protège quelle que
  // soit la langue, avant toute autre décision de routage.
  if (/^\/(?:[a-z]{2}\/)?(?:admin|owner)(?:\/|$)/.test(pathname)) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
  }

  // Staff PWA routes are protected by Basic auth as the first barrier.
  // Session-based auth is verified server-side in each page/action.
  if (/^\/(?:[a-z]{2}\/)?staff(?:\/|$)/.test(pathname)) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
  }

  // Les routes d'API, les fichiers statiques et les internes de Next ne sont
  // pas localisés.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return withSecurityHeaders(NextResponse.next(), null);
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    // On respecte la langue du navigateur, avec le français par défaut :
    // l'essentiel du public est local.
    const preferred = matchLocale(request.headers.get("accept-language"));
    const locale = isLocale(preferred) ? preferred : defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Un nonce par requête : c'est ce qui permet à la CSP de se passer de
  // `unsafe-inline`. Next le récupère dans l'en-tête et l'applique à ses
  // propres balises <script>.
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);

  return withSecurityHeaders(
    NextResponse.next({ request: { headers } }),
    nonce,
  );
}

/**
 * Politique de sécurité du contenu.
 *
 * `script-src` n'accepte que les scripts portant le nonce du jour ; c'est ce
 * qui fait qu'un script injecté ne s'exécute pas. Contrepartie assumée : le
 * nonce changeant à chaque requête, les pages ne peuvent plus être servies
 * depuis un cache statique — voir le README, section « Décisions ».
 */
function withSecurityHeaders(
  response: NextResponse,
  nonce: string | null,
): NextResponse {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self'`;

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      // Next et Tailwind produisent des styles en ligne au rendu serveur ;
      // un style injecté ne s'exécute pas, il défigure au pire.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  return response;
}

/**
 * Back-office : authentification HTTP Basic, avec blocage après échecs répétés.
 *
 * Le blocage est consulté **avant** la comparaison : sans cela, l'attaquant
 * garderait un nombre illimité d'essais, chacun simplement refusé.
 */
async function requireAdmin(
  request: NextRequest,
): Promise<NextResponse | null> {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse("Back-office non configuré", { status: 503 });
  }

  const key = `admin:${clientIp(request)}`;
  const blocked = await isRateLimited(key, ADMIN_MAX_FAILURES);
  if (blocked.blocked) {
    return new NextResponse("Trop de tentatives", {
      status: 429,
      headers: { "retry-after": String(blocked.retryAfter) },
    });
  }

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    const given = decoded.slice(0, separator);
    const secret = decoded.slice(separator + 1);

    if (timingSafeEqual(given, user) && timingSafeEqual(secret, password)) {
      await clearRateLimit(key);
      return null;
    }
  }

  // Un échec — y compris l'absence d'en-tête, qui est la forme que prend une
  // tentative automatisée — consomme un jeton.
  await rateLimit(key, ADMIN_MAX_FAILURES, ADMIN_WINDOW_MS);

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="Zanzibar Lounge", charset="UTF-8"',
    },
  });
}

/** Comparaison à durée constante : `crypto.timingSafeEqual` n'existe pas sur l'Edge. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
