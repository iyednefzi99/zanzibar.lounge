import crypto from "node:crypto";

import { site } from "@/content/site";
import { db } from "@/lib/db";
import { sendOnBestChannel } from "@/lib/channels";
import { normalizePhone } from "@/lib/phone";

/**
 * Vérification du numéro par code court.
 *
 * Désactivée par défaut : elle ajoute une étape à chaque réservation, donc de
 * l'abandon, et le pot de miel plus la limitation de débit suffisent tant que
 * les fausses réservations restent marginales. À activer avec
 * `BOOKING_REQUIRE_OTP=true` le jour où ce n'est plus le cas.
 *
 * Le code n'est jamais stocké : seule son empreinte l'est, liée au numéro. Un
 * code à six chiffres reste devinable hors ligne si la base fuit — c'est
 * pourquoi il expire en dix minutes et que les tentatives sont plafonnées.
 */

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function isOtpRequired(): boolean {
  return process.env.BOOKING_REQUIRE_OTP === "true";
}

/**
 * Émet un code et l'envoie. Ne dit jamais si le numéro est connu : la réponse
 * est identique dans tous les cas, sans quoi l'endpoint devient un moyen de
 * savoir qui est client.
 */
export async function requestCode(
  phone: string,
  locale: string,
): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!normalized) return;

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await db.phoneVerification.upsert({
    where: { phone: normalized },
    create: { phone: normalized, codeHash: hash(normalized, code), expiresAt },
    update: {
      codeHash: hash(normalized, code),
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
  });

  await sendOnBestChannel(normalized, codeMessage(locale, code));
}

export type VerifyOutcome = "ok" | "invalid" | "expired" | "too_many_attempts";

export async function verifyCode(
  phone: string,
  code: string,
): Promise<VerifyOutcome> {
  const normalized = normalizePhone(phone);
  if (!normalized) return "invalid";

  const record = await db.phoneVerification.findUnique({
    where: { phone: normalized },
  });
  if (!record) return "invalid";

  if (record.expiresAt.getTime() < Date.now()) {
    await db.phoneVerification.delete({ where: { phone: normalized } });
    return "expired";
  }

  if (record.attempts >= MAX_ATTEMPTS) return "too_many_attempts";

  const expected = Buffer.from(record.codeHash, "hex");
  const given = Buffer.from(hash(normalized, code.trim()), "hex");
  const matches =
    expected.length === given.length && crypto.timingSafeEqual(expected, given);

  if (!matches) {
    await db.phoneVerification.update({
      where: { phone: normalized },
      data: { attempts: { increment: 1 } },
    });
    return "invalid";
  }

  // Un code ne sert qu'une fois.
  await db.phoneVerification.delete({ where: { phone: normalized } });
  return "ok";
}

function hash(phone: string, code: string): string {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function codeMessage(locale: string, code: string): string {
  if (locale === "ar") {
    return `رمز التأكيد لحجزك في ${site.name} هو ${code}. صالح لمدة ${CODE_TTL_MINUTES} دقائق.`;
  }
  if (locale === "en") {
    return `Your ${site.name} booking code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`;
  }
  return `Votre code de réservation ${site.name} : ${code}. Valable ${CODE_TTL_MINUTES} minutes.`;
}
