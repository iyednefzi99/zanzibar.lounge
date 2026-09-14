import { z } from "zod";

/**
 * Variables d'environnement, validées au démarrage côté serveur.
 *
 * Rien ici n'est exposé au navigateur : ce module ne doit jamais être importé
 * depuis un composant client. Les seules valeurs publiques passent par
 * `NEXT_PUBLIC_*` et sont lues directement là où elles servent.
 *
 * Le site tourne sans les clés de messagerie ni la clé Anthropic : la
 * réservation en ligne fonctionne, l'agent WhatsApp/SMS reste simplement hors
 * service. C'est voulu — on peut développer la vitrine sans compte Meta.
 */

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Base de données ---
  DATABASE_URL: z.string().url().optional(),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  // --- Agent IA ---
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // --- WhatsApp Cloud API (Meta) ---
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  /** Jeton choisi par vous, redonné par Meta lors de la vérification du webhook. */
  WHATSAPP_VERIFY_TOKEN: z.string().min(16).optional(),
  /** Secret de l'application Meta, sert à vérifier X-Hub-Signature-256. */
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  /**
   * Nom du modèle approuvé servant aux rappels. Hors de la fenêtre de 24 h,
   * Meta n'accepte que des modèles : sans celui-ci, les rappels WhatsApp
   * basculent automatiquement en SMS.
   */
  WHATSAPP_REMINDER_TEMPLATE: z.string().min(1).optional(),

  // --- Twilio (SMS) ---
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  /** Numéro expéditeur, ou identifiant d'un Messaging Service (MG…). */
  TWILIO_FROM: z.string().min(1).optional(),

  /**
   * Exige un code de vérification avant toute réservation en ligne. Ajoute une
   * étape au parcours : à n'activer que si les fausses réservations deviennent
   * un problème réel.
   */
  BOOKING_REQUIRE_OTP: z.enum(["true", "false"]).default("false"),

  // --- Limitation de débit partagée (facultative mais recommandée en prod) ---
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // --- Exploitation ---
  /** Protège /api/cron/*. Générer avec : openssl rand -hex 32 */
  CRON_SECRET: z.string().min(32).optional(),
  ADMIN_USER: z.string().min(1).optional(),
  /** Mot de passe du back-office. 16 caractères minimum. */
  ADMIN_PASSWORD: z.string().min(16).optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  // --- Intégrations tierces (facultatives) ---
  GOOGLE_CALENDAR_API_KEY: z.string().min(1).optional(),
  GOOGLE_CALENDAR_ID: z.string().min(1).optional(),
  GOOGLE_BUSINESS_API_KEY: z.string().min(1).optional(),
  TRIPADVISOR_API_KEY: z.string().min(1).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")} — ${issue.message}`)
    .join("\n");
  throw new Error(
    `Variables d'environnement invalides :\n${details}\n\nVoir .env.example.`,
  );
}

export const env = parsed.data;

/** L'agent IA ne peut répondre que si la clé Anthropic est présente. */
export const hasAgent = Boolean(env.ANTHROPIC_API_KEY);

export const hasWhatsApp = Boolean(
  env.WHATSAPP_PHONE_NUMBER_ID &&
    env.WHATSAPP_ACCESS_TOKEN &&
    env.WHATSAPP_APP_SECRET &&
    env.WHATSAPP_VERIFY_TOKEN,
);

export const hasSms = Boolean(
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM,
);

export const hasDatabase = Boolean(env.DATABASE_URL);

/**
 * Manques qui empêchent une mise en production. Affiché au démarrage et repris
 * par le back-office, pour qu'un déploiement à moitié configuré se voie.
 */
export function productionGaps(): string[] {
  const gaps: string[] = [];
  if (!hasDatabase) gaps.push("DATABASE_URL");
  if (!hasAgent) gaps.push("ANTHROPIC_API_KEY (agent IA désactivé)");
  if (!hasWhatsApp) gaps.push("WhatsApp Cloud API (canal désactivé)");
  if (!hasSms) gaps.push("Twilio (SMS désactivé)");
  if (!env.CRON_SECRET) gaps.push("CRON_SECRET (rappels non protégés)");
  if (!env.ADMIN_PASSWORD) gaps.push("ADMIN_PASSWORD (back-office fermé)");
  if (!env.UPSTASH_REDIS_REST_URL) {
    gaps.push("Upstash Redis (limitation de débit non partagée entre instances)");
  }
  return gaps;
}
