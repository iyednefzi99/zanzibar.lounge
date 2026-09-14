import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

const SESSION_COOKIE = "zl_guest_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type GuestSession = {
  guestId: string;
  phone: string;
  name: string | null;
  locale: string;
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getSecret(): string {
  const secret =
    process.env.GUEST_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "GUEST_SESSION_SECRET or ADMIN_PASSWORD required for guest sessions",
    );
  }
  return secret;
}

async function signToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  const sigHex = Array.from(new Uint8Array(sig), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `${token}.${sigHex}`;
}

async function verifySigned(
  signed: string,
  secret: string,
): Promise<string | null> {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex < 0) return null;

  const token = signed.slice(0, dotIndex);
  const sigHex = signed.slice(dotIndex + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = new Uint8Array(
    sigHex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [],
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(token),
  );

  return valid ? token : null;
}

export async function createGuestSession(
  phone: string,
): Promise<string> {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("INVALID_PHONE");

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const rawToken = generateToken();
  const secret = getSecret();
  const signed = await signToken(rawToken, secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return signed;
}

export async function getGuestSession(): Promise<GuestSession | null> {
  try {
    const cookieStore = await cookies();
    const signed = cookieStore.get(SESSION_COOKIE)?.value;
    if (!signed) return null;

    const secret = getSecret();
    const token = await verifySigned(signed, secret);
    if (!token) return null;

    const guest = await db.guest.findFirst({
      where: { reservations: { some: { id: { not: "" } } } },
      include: {
        reservations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!guest) return null;

    return {
      guestId: guest.id,
      phone: guest.phone,
      name: guest.name,
      locale: guest.locale,
    };
  } catch {
    return null;
  }
}

/**
 * Récupère la session à partir du cookie, en lookupant le guest
 * par le token signé stocké dans le cookie.
 */
export async function getGuestSessionFromCookie(): Promise<GuestSession | null> {
  try {
    const cookieStore = await cookies();
    const signed = cookieStore.get(SESSION_COOKIE)?.value;
    if (!signed) return null;

    const secret = getSecret();
    const token = await verifySigned(signed, secret);
    if (!token) return null;

    // Le token brut (avant signature) est l'identifiant de session.
    // On cherche le guest via le cookie en utilisant un lookup simple :
    // on stocke le guestId dans un cookie séparé pour éviter une table de sessions.
    const guestIdCookie = cookieStore.get("zl_guest_id")?.value;
    if (!guestIdCookie) return null;

    const guest = await db.guest.findUnique({
      where: { id: guestIdCookie },
    });
    if (!guest) return null;

    return {
      guestId: guest.id,
      phone: guest.phone,
      name: guest.name,
      locale: guest.locale,
    };
  } catch {
    return null;
  }
}

/**
 * Crée la session complète (token + guestId cookie).
 */
export async function createGuestSessionFull(
  phone: string,
): Promise<GuestSession> {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("INVALID_PHONE");

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const rawToken = generateToken();
  const secret = getSecret();
  const signed = await signToken(rawToken, secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  cookieStore.set("zl_guest_id", guest.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return {
    guestId: guest.id,
    phone: guest.phone,
    name: guest.name,
    locale: guest.locale,
  };
}

export async function destroyGuestSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete("zl_guest_id");
  } catch {
    // Best effort cleanup
  }
}

export async function requireGuestSession(): Promise<GuestSession> {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    throw new Error("GUEST_SESSION_REQUIRED");
  }
  return session;
}
