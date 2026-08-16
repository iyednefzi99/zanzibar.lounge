import crypto from "node:crypto";

import { Channel } from "@/generated/prisma/client";

import { env, hasWhatsApp } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import {
  ChannelNotConfiguredError,
  type InboundMessage,
  type SendResult,
} from "@/lib/channels/types";

const GRAPH_VERSION = "v21.0";

/**
 * Envoi d'un message texte via la WhatsApp Cloud API.
 *
 * Attention à la fenêtre de service de Meta : hors des 24 h qui suivent le
 * dernier message du client, seuls les modèles pré-approuvés passent. Les
 * rappels de réservation doivent donc utiliser `sendWhatsAppTemplate`.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<SendResult> {
  if (!hasWhatsApp) throw new ChannelNotConfiguredError(Channel.WHATSAPP);

  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, reason: "numéro invalide" };

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        // L'API attend le numéro sans le « + ».
        to: recipient.slice(1),
        type: "text",
        text: { preview_url: false, body },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, reason: `WhatsApp ${response.status} : ${detail}` };
  }

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };
  return { ok: true, providerId: payload.messages?.[0]?.id ?? null };
}

/**
 * Envoi d'un modèle approuvé — le seul moyen de reprendre contact au-delà de
 * 24 h, donc ce qui porte les rappels de réservation.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  variables: string[],
): Promise<SendResult> {
  if (!hasWhatsApp) throw new ChannelNotConfiguredError(Channel.WHATSAPP);

  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, reason: "numéro invalide" };

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient.slice(1),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: variables.length
            ? [
                {
                  type: "body",
                  parameters: variables.map((text) => ({ type: "text", text })),
                },
              ]
            : [],
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, reason: `WhatsApp ${response.status} : ${detail}` };
  }

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };
  return { ok: true, providerId: payload.messages?.[0]?.id ?? null };
}

/**
 * Vérifie la signature `X-Hub-Signature-256`.
 *
 * Sans ce contrôle, n'importe qui connaissant l'URL du webhook peut faire
 * parler l'agent et lire des réservations. Le corps doit être le texte brut :
 * un `JSON.parse` suivi d'un `JSON.stringify` change les octets et invalide
 * la signature.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader || !env.WHATSAPP_APP_SECRET) return false;

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", env.WHATSAPP_APP_SECRET)
      .update(rawBody, "utf8")
      .digest("hex");

  const received = Buffer.from(signatureHeader);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;

  return crypto.timingSafeEqual(received, computed);
}

/** Répond au défi de vérification que Meta envoie à l'enregistrement du webhook. */
export function verifyWebhookChallenge(params: URLSearchParams): string | null {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode !== "subscribe" || !token || !env.WHATSAPP_VERIFY_TOKEN) return null;

  const a = Buffer.from(token);
  const b = Buffer.from(env.WHATSAPP_VERIFY_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return challenge;
}

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          button?: { text?: string };
          interactive?: {
            button_reply?: { title?: string };
            list_reply?: { title?: string };
          };
        }>;
      };
    }>;
  }>;
};

/**
 * Extrait les messages exploitables du webhook. On ignore les accusés de
 * réception et les types non textuels : l'agent ne sait pas répondre à une
 * photo, autant ne pas lui en donner.
 */
export function parseWhatsAppWebhook(payload: unknown): InboundMessage[] {
  const data = payload as MetaWebhookPayload;
  const messages: InboundMessage[] = [];

  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const from = message.from ? normalizePhone(`+${message.from}`) : null;
        if (!from || !message.id) continue;

        const body =
          message.text?.body ??
          message.button?.text ??
          message.interactive?.button_reply?.title ??
          message.interactive?.list_reply?.title;

        if (!body?.trim()) continue;

        messages.push({
          channel: Channel.WHATSAPP,
          from,
          body: body.trim(),
          providerId: message.id,
        });
      }
    }
  }

  return messages;
}
