import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

// ─── Web Crypto password hashing (PBKDF2-SHA-256 + salt) ──────────────

const SALT_BYTES = 16;
const ITERATIONS = 100_000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
}

/**
 * Hash un mot de passe avec PBKDF2-SHA-256 + salt aléatoire.
 * Format de sortie : `{salt_hex}:{hash_hex}`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const keyBits = await deriveKey(password, salt);
  return `${toHex(salt.buffer)}:${toHex(keyBits)}`;
}

/**
 * Vérifie un mot de passe contre un hash au format `{salt}:{hash}`.
 * Comparaison constante en temps pour éviter les timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const separator = storedHash.indexOf(":");
  if (separator < 0) return false;

  const salt = fromHex(storedHash.substring(0, separator));
  const expected = fromHex(storedHash.substring(separator + 1));
  const derived = new Uint8Array(await deriveKey(password, salt));

  if (derived.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    diff |= derived[i]! ^ expected[i]!;
  }
  return diff === 0;
}

// ─── Create staff ─────────────────────────────────────────────────────

/**
 * Créer un membre du personnel.
 * L'email doit être unique par restaurant (contrainte DB).
 * Lève une erreur "EMAIL_TAKEN" si l'email est déjà utilisé.
 */
export async function createStaff(params: {
  restaurantId: string;
  email: string;
  name: string;
  password: string;
  role?: string;
}): Promise<StaffMember> {
  const existing = await db.staff.findUnique({
    where: {
      restaurantId_email: {
        restaurantId: params.restaurantId,
        email: params.email.toLowerCase().trim(),
      },
    },
  });

  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(params.password);

  const staff = await db.staff.create({
    data: {
      restaurantId: params.restaurantId,
      email: params.email.toLowerCase().trim(),
      name: params.name.trim(),
      role: (params.role as "OWNER" | "MANAGER" | "STAFF") ?? "STAFF",
      passwordHash,
    },
  });

  logger.info("staff.created", {
    staffId: staff.id,
    restaurantId: params.restaurantId,
    role: staff.role,
  });

  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    active: staff.active,
    lastLoginAt: staff.lastLoginAt,
    createdAt: staff.createdAt,
  };
}

// ─── Authenticate staff ───────────────────────────────────────────────

/**
 * Authentifier un membre du personnel par email + mot de passe.
 * Met à jour `lastLoginAt` en cas de succès.
 * Renvoie `null` si les identifiants sont invalides.
 */
export async function authenticateStaff(
  restaurantId: string,
  email: string,
  password: string,
): Promise<StaffMember | null> {
  const staff = await db.staff.findUnique({
    where: {
      restaurantId_email: {
        restaurantId,
        email: email.toLowerCase().trim(),
      },
    },
  });

  if (!staff || !staff.active) return null;

  const valid = await verifyPassword(password, staff.passwordHash);
  if (!valid) return null;

  await db.staff.update({
    where: { id: staff.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info("staff.login", { staffId: staff.id, restaurantId });

  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    active: staff.active,
    lastLoginAt: new Date(),
    createdAt: staff.createdAt,
  };
}

// ─── Get staff members ────────────────────────────────────────────────

/** Lister tous les membres du personnel d'un restaurant. */
export async function getStaffMembers(
  restaurantId: string,
): Promise<StaffMember[]> {
  const members = await db.staff.findMany({
    where: { restaurantId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    role: s.role,
    active: s.active,
    lastLoginAt: s.lastLoginAt,
    createdAt: s.createdAt,
  }));
}

// ─── Update staff role ────────────────────────────────────────────────

/** Modifier le rôle d'un membre du personnel. */
export async function updateStaffRole(
  staffId: string,
  role: string,
): Promise<StaffMember> {
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new Error("STAFF_NOT_FOUND");
  }

  const updated = await db.staff.update({
    where: { id: staffId },
    data: { role: role as "OWNER" | "MANAGER" | "STAFF" },
  });

  logger.info("staff.role_updated", {
    staffId,
    restaurantId: updated.restaurantId,
    role,
  });

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    active: updated.active,
    lastLoginAt: updated.lastLoginAt,
    createdAt: updated.createdAt,
  };
}

// ─── Deactivate staff ─────────────────────────────────────────────────

/**
 * Désactiver un membre du personnel (soft-delete).
 * L'email reste réservé pour éviter les collisions.
 */
export async function deactivateStaff(
  staffId: string,
): Promise<StaffMember> {
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new Error("STAFF_NOT_FOUND");
  }

  const updated = await db.staff.update({
    where: { id: staffId },
    data: { active: false },
  });

  logger.info("staff.deactivated", {
    staffId,
    restaurantId: updated.restaurantId,
  });

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    active: updated.active,
    lastLoginAt: updated.lastLoginAt,
    createdAt: updated.createdAt,
  };
}
