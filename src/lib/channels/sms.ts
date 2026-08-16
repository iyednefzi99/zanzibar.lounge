import { Channel } from "@/generated/prisma/client";
import twilio from "twilio";

import { env, hasSms } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import {
  ChannelNotConfiguredError,
  type InboundMessage,
  type SendResult,
} from "@/lib/channels/types";

let client: ReturnType<typeof twilio> | null = null;

function twilioClient() {
  if (!hasSms) throw new ChannelNotConfiguredError(Channel.SMS);
  client ??= twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  return client;
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, reason: "numéro invalide" };

  const from = env.TWILIO_FROM!;

  try {
    const message = await twilioClient().messages.create({
      to: recipient,
      body,
      // Un identifiant « MG… » désigne un Messaging Service, pas un numéro.
      ...(from.startsWith("MG")
        ? { messagingServiceSid: from }
        : { from }),
    });
    return { ok: true, providerId: message.sid };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "erreur Twilio",
    };
  }
}

/**
 * Vérifie `X-Twilio-Signature`.
 *
 * Twilio calcule la signature sur l'URL exacte du webhook plus les paramètres
 * du formulaire. Derrière un proxy, l'URL vue par Next peut différer de celle
 * enregistrée chez Twilio : c'est la cause la plus fréquente d'un 403 ici, et
 * `NEXT_PUBLIC_SITE_URL` sert justement à reconstruire la bonne.
 */
export function verifyTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature || !env.TWILIO_AUTH_TOKEN) return false;
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

/** Transforme le formulaire envoyé par Twilio en message entrant. */
export function parseTwilioWebhook(
  params: Record<string, string>,
): InboundMessage | null {
  const from = params.From ? normalizePhone(params.From) : null;
  const body = params.Body?.trim();
  const providerId = params.MessageSid;

  if (!from || !body || !providerId) return null;

  return { channel: Channel.SMS, from, body, providerId };
}
