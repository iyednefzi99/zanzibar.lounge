import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── TOTP (Web Crypto API) ───────────────────────────────────────────

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ISSUER = "Zanzibar Lounge";

function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.replace(/[=\s]/g, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const val = alphabet.indexOf(char);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

function generateOTP(secret: string, timeStep: number): Promise<string> {
  const key = base32Decode(secret);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, timeStep, false);

  return crypto.subtle
    .importKey("raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    .then((cryptoKey) => crypto.subtle.sign("HMAC", cryptoKey, timeBuffer))
    .then((signature) => {
      const hash = new Uint8Array(signature);
      const offset = hash[hash.length - 1]! & 0x0f;
      const code =
        ((hash[offset]! & 0x7f) << 24) |
        ((hash[offset + 1]! & 0xff) << 16) |
        ((hash[offset + 2]! & 0xff) << 8) |
        (hash[offset + 3]! & 0xff);
      return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
    });
}

function getTimeStep(): number {
  return Math.floor(Date.now() / 1000 / TOTP_PERIOD);
}

/**
 * Générer un secret TOTP pour la configuration 2FA d'un membre du personnel.
 * Retourne le secret en base32 et l'URI otpauth pour le QR code.
 */
export async function generateTwoFactorSecret(
  staffId: string,
): Promise<{ secret: string; otpauthUri: string }> {
  const staff = await db.staff.findUnique({
    where: { id: staffId },
    include: { restaurant: { select: { name: true, slug: true } } },
  });

  if (!staff) throw new Error("STAFF_NOT_FOUND");

  const secret = generateSecret();
  const otpauthUri = `otpauth://totp/${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(staff.email)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

  logger.info("2fa.secret_generated", {
    staffId,
    restaurantId: staff.restaurantId,
  });

  return { secret, otpauthUri };
}

/**
 * Vérifier un code TOTP à 6 chiffres.
 * Accepte la fenêtre courante ±1 pour compenser le décalage horloge.
 */
export async function verifyTwoFactorCode(
  staffId: string,
  code: string,
): Promise<boolean> {
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  if (!staff?.twoFactorSecret) return false;

  const currentStep = getTimeStep();

  for (const offset of [-1, 0, 1]) {
    const expected = await generateOTP(staff.twoFactorSecret, currentStep + offset);
    if (expected === code) return true;
  }

  logger.warn("2fa.verification_failed", { staffId });
  return false;
}

/**
 * Activer la 2FA après vérification du premier code.
 */
export async function enableTwoFactor(
  staffId: string,
  secret: string,
): Promise<void> {
  await db.staff.update({
    where: { id: staffId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    },
  });

  logger.info("2fa.enabled", { staffId });
}

/**
 * Désactiver la 2FA.
 */
export async function disableTwoFactor(staffId: string): Promise<void> {
  await db.staff.update({
    where: { id: staffId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  logger.info("2fa.disabled", { staffId });
}

// ─── Audit Log ────────────────────────────────────────────────────────

export type AuditLogEntry = {
  id: string;
  restaurantId: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: Date;
};

/**
 * Enregistrer une action de sécurité dans le journal d'audit.
 */
export async function createAuditLog(
  restaurantId: string,
  action: string,
  actorId: string | null,
  details?: Record<string, unknown>,
  ipAddress?: string,
): Promise<void> {
  let actorEmail: string | null = null;
  if (actorId) {
    const staff = await db.staff.findUnique({
      where: { id: actorId },
      select: { email: true },
    });
    actorEmail = staff?.email ?? null;
  }

  await db.auditLog.create({
    data: {
      restaurantId,
      action,
      actorId,
      actorEmail,
      details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      ipAddress: ipAddress ?? null,
    },
  });
}

/**
 * Récupérer les journaux d'audit d'un restaurant.
 */
export async function getAuditLogs(
  restaurantId: string,
  limit = 50,
  offset = 0,
): Promise<AuditLogEntry[]> {
  const logs = await db.auditLog.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return logs.map((log) => ({
    id: log.id,
    restaurantId: log.restaurantId,
    action: log.action,
    actorId: log.actorId,
    actorEmail: log.actorEmail,
    details: log.details,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
  }));
}

// ─── Rate Limiting (in-memory) ────────────────────────────────────────

type RateLimitEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateLimitEntry>();

// Nettoyage periodique toutes les 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
  }, 60_000);
}

/**
 * Vérifier et incrémenter un compteur de débit.
 * Renvoie `true` si la requête est autorisée, `false` si la limite est atteinte.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

// ─── API Keys ─────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes.buffer as ArrayBuffer);
  return toHex(hashBuffer);
}

/**
 * Générer une clé API pour l'authentification des webhooks.
 * Retourne la clé en clair (à montrer une seule fois) et son enregistrement.
 */
export async function generateApiKey(
  restaurantId: string,
  name: string,
): Promise<{ id: string; key: string; keyPrefix: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rawKey = `zl_${toHex(bytes.buffer as ArrayBuffer)}`;
  const keyPrefix = rawKey.substring(0, 11); // "zl_" + 8 hex chars
  const keyHash = await hashApiKey(rawKey);

  const apiKey = await db.apiKey.create({
    data: {
      restaurantId,
      name,
      keyPrefix,
      keyHash,
    },
  });

  logger.info("apikey.created", {
    apiKeyId: apiKey.id,
    restaurantId,
    name,
  });

  return { id: apiKey.id, key: rawKey, keyPrefix };
}

/**
 * Révoquer une clé API.
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const key = await db.apiKey.findUnique({ where: { id: keyId } });
  if (!key) throw new Error("API_KEY_NOT_FOUND");

  await db.apiKey.update({
    where: { id: keyId },
    data: { active: false, revokedAt: new Date() },
  });

  logger.info("apikey.revoked", { apiKeyId: keyId, restaurantId: key.restaurantId });
}

/**
 * Valider une clé API (pour l'authentification des webhooks entrants).
 */
export async function validateApiKey(rawKey: string): Promise<string | null> {
  const keyPrefix = rawKey.substring(0, 11);
  const keyHash = await hashApiKey(rawKey);

  const record = await db.apiKey.findFirst({
    where: { keyPrefix, keyHash, active: true },
  });

  if (!record) return null;

  await db.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return record.restaurantId;
}
