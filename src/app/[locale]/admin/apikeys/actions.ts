"use server";

import crypto from "node:crypto";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { db } from "@/lib/db";

function generateApiKey(): string {
  const bytes = crypto.randomBytes(32);
  return "ak_" + bytes.toString("base64url");
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function generateKey(name: string) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const raw = generateApiKey();
  const keyHash = sha256(raw);
  const keyPrefix = raw.slice(0, 8);

  const key = await db.apiKey.create({
    data: {
      restaurantId,
      name,
      keyPrefix,
      keyHash,
    },
  });

  return { ...key, rawKey: raw };
}

export async function revokeKey(keyId: string) {
  await requireAdmin();
  return db.apiKey.update({
    where: { id: keyId },
    data: { active: false, revokedAt: new Date() },
  });
}
