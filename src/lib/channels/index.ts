import { Channel, MessageRole } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { hasSms, hasWhatsApp } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { sendSms } from "@/lib/channels/sms";
import { sendWhatsAppText } from "@/lib/channels/whatsapp";
import type { InboundMessage, SendResult } from "@/lib/channels/types";

export * from "@/lib/channels/types";

export function isChannelReady(channel: Channel): boolean {
  if (channel === Channel.WHATSAPP) return hasWhatsApp;
  if (channel === Channel.SMS) return hasSms;
  return false;
}

/**
 * Envoie un message et le consigne dans la conversation.
 *
 * Un client qui s'est désabonné ne reçoit plus rien : c'est vérifié ici, une
 * seule fois, plutôt qu'à chaque appelant.
 */
export async function sendMessage(
  channel: Channel,
  to: string,
  body: string,
  options: { role?: MessageRole; log?: boolean } = {},
): Promise<SendResult> {
  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, reason: "numéro invalide" };

  const guest = await db.guest.findUnique({ where: { phone: recipient } });
  if (guest?.optedOut) {
    return { ok: false, reason: "le client s'est désabonné" };
  }

  if (!isChannelReady(channel)) {
    return { ok: false, reason: `canal ${channel} non configuré` };
  }

  const result =
    channel === Channel.WHATSAPP
      ? await sendWhatsAppText(recipient, body)
      : await sendSms(recipient, body);

  if (result.ok && options.log !== false && guest) {
    const conversation = await ensureConversation(guest.id, channel, guest.locale);
    await recordMessage(
      conversation.id,
      options.role ?? MessageRole.AGENT,
      body,
      result.providerId,
    );
  }

  return result;
}

/**
 * Bascule WhatsApp → SMS. Un client qui a écrit par SMS ne reçoit pas de
 * WhatsApp : on répond toujours d'abord sur le canal qu'il a choisi.
 */
export async function sendOnBestChannel(
  to: string,
  body: string,
  preferred?: Channel,
): Promise<SendResult> {
  const order: Channel[] = preferred
    ? [preferred, preferred === Channel.WHATSAPP ? Channel.SMS : Channel.WHATSAPP]
    : [Channel.WHATSAPP, Channel.SMS];

  let lastReason = "aucun canal disponible";
  for (const channel of order) {
    if (!isChannelReady(channel)) continue;
    const result = await sendMessage(channel, to, body);
    if (result.ok) return result;
    lastReason = result.reason;
  }
  return { ok: false, reason: lastReason };
}

// --------------------------------------------------------------------------
// Conversations
// --------------------------------------------------------------------------

export async function ensureGuest(phone: string, locale?: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("numéro invalide");

  return db.guest.upsert({
    where: { phone: normalized },
    create: { phone: normalized, locale: locale ?? "fr" },
    update: locale ? { locale } : {},
  });
}

export async function ensureConversation(
  guestId: string,
  channel: Channel,
  locale = "fr",
) {
  // Chercher une conversation ouverte existante
  const existing = await db.conversation.findFirst({
    where: { guestId, channel, closed: false },
  });

  if (existing) {
    return db.conversation.update({
      where: { id: existing.id },
      data: { lastMessageAt: new Date(), closed: false },
    });
  }

  return db.conversation.create({
    data: { guestId, channel, locale },
  });
}

export async function recordMessage(
  conversationId: string,
  role: MessageRole,
  body: string,
  providerId: string | null = null,
) {
  return db.message.create({
    data: { conversationId, role, body, providerId },
  });
}

/**
 * Marque un événement fournisseur comme traité. Renvoie `false` s'il l'était
 * déjà : Meta et Twilio rejouent volontiers la même livraison, et sans ce
 * garde-fou l'agent répondrait deux fois à la même phrase.
 */
export async function claimEvent(
  providerId: string,
  channel: Channel,
): Promise<boolean> {
  try {
    await db.processedEvent.create({ data: { id: providerId, channel } });
    return true;
  } catch {
    return false;
  }
}

/** Historique récent, remis à l'agent comme contexte de conversation. */
export async function conversationHistory(conversationId: string, take = 20) {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return messages.reverse();
}

export type { InboundMessage };
