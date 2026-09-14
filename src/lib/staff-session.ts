import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const SESSION_COOKIE = "zl_staff_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type StaffSession = {
  id: string;
  staffId: string;
  restaurantId: string;
  name: string;
  email: string;
  role: string;
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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

function getSecret(): string {
  const secret =
    process.env.STAFF_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "STAFF_SESSION_SECRET or ADMIN_PASSWORD required for staff sessions",
    );
  }
  return secret;
}

export async function createStaffSession(
  staffId: string,
  restaurantId: string,
): Promise<string> {
  const rawToken = generateToken();
  const secret = getSecret();
  const signed = await signToken(rawToken, secret);

  await db.staffSession.create({
    data: {
      token: rawToken,
      staffId,
      restaurantId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  logger.info("staff.session_created", { staffId, restaurantId });

  return signed;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const cookieStore = await cookies();
    const signed = cookieStore.get(SESSION_COOKIE)?.value;
    if (!signed) return null;

    const secret = getSecret();
    const token = await verifySigned(signed, secret);
    if (!token) return null;

    const session = await db.staffSession.findUnique({
      where: { token },
      include: { staff: true },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.staffSession.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    if (!session.staff.active) {
      await db.staffSession.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      id: session.id,
      staffId: session.staffId,
      restaurantId: session.restaurantId,
      name: session.staff.name,
      email: session.staff.email,
      role: session.staff.role,
    };
  } catch {
    return null;
  }
}

export async function destroyStaffSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const signed = cookieStore.get(SESSION_COOKIE)?.value;
    if (!signed) return;

    const secret = getSecret();
    const token = await verifySigned(signed, secret);
    if (token) {
      await db.staffSession.deleteMany({ where: { token } }).catch(() => {});
    }

    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Best effort cleanup
  }
}

export async function requireStaffSession(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) {
    throw new Error("STAFF_SESSION_REQUIRED");
  }
  return session;
}
