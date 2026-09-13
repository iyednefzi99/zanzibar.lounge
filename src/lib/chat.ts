import { db } from "@/lib/db";
import { sendOnBestChannel } from "@/lib/channels";

/**
 * Chat en direct staff.
 *
 * Le staff peut prendre le relais de l'agent pour une conversation.
 * Les messages passent par la même table `Message` existante.
 */

export type ConversationSummary = {
  id: string;
  guestName: string | null;
  guestPhone: string;
  channel: string;
  locale: string;
  lastMessageAt: Date;
  unread: number;
  lastMessage: string;
};

export type ChatMessage = {
  id: string;
  role: "GUEST" | "AGENT" | "STAFF";
  body: string;
  createdAt: Date;
};

// --- Lectures ---

/**
 * Conversations ouvertes, triées par dernier message.
 */
export async function getOpenConversations(): Promise<ConversationSummary[]> {
  const conversations = await db.conversation.findMany({
    where: { closed: false },
    include: {
      guest: { select: { name: true, phone: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    guestName: conv.guest.name,
    guestPhone: conv.guest.phone,
    channel: conv.channel,
    locale: conv.locale,
    lastMessageAt: conv.lastMessageAt,
    unread: 0, // TODO: compter les messages non lus si besoin
    lastMessage: conv.messages[0]?.body ?? "",
  }));
}

/**
 * Messages d'une conversation.
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "GUEST" | "AGENT" | "STAFF",
    body: msg.body,
    createdAt: msg.createdAt,
  }));
}

// --- Écritures ---

/**
 * Envoyer un message depuis le staff.
 */
export async function sendStaffMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { guest: true },
  });

  if (!conversation) {
    return { ok: false, error: "CONVERSATION_NOT_FOUND" };
  }

  if (conversation.closed) {
    return { ok: false, error: "CONVERSATION_CLOSED" };
  }

  // Enregistrer le message staff
  await db.message.create({
    data: {
      conversationId,
      role: "STAFF",
      body,
    },
  });

  // Mettre à jour lastMessageAt
  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Envoyer via le canal (WhatsApp/SMS)
  const channel = conversation.channel as "WHATSAPP" | "SMS" | "WEB" | "PHONE";
  if (channel === "WHATSAPP" || channel === "SMS") {
    await sendOnBestChannel(conversation.guest.phone, body).catch(() => {
      // Ne pas faire échouer si l'envoi échoue
    });
  }

  return { ok: true };
}

/**
 * Fermer une conversation.
 */
export async function closeConversation(
  conversationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return { ok: false, error: "CONVERSATION_NOT_FOUND" };
  }

  await db.conversation.update({
    where: { id: conversationId },
    data: { closed: true },
  });

  return { ok: true };
}

/**
 * Transférer une conversation depuis l'agent vers le staff.
 *
 * Ferme la conversation existante de l'agent et en crée une nouvelle
 * pour le staff, en transférant le contexte.
 */
export async function takeoverFromAgent(
  conversationId: string,
): Promise<{ ok: boolean; newConversationId?: string; error?: string }> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      guest: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    return { ok: false, error: "CONVERSATION_NOT_FOUND" };
  }

  // Fermer la conversation de l'agent
  await db.conversation.update({
    where: { id: conversationId },
    data: { closed: true },
  });

  // Créer une nouvelle conversation pour le staff (même canal)
  const newConv = await db.conversation.create({
    data: {
      guestId: conversation.guestId,
      channel: conversation.channel,
      locale: conversation.locale,
    },
  });

  // Message de transfert
  await db.message.create({
    data: {
      conversationId: newConv.id,
      role: "STAFF",
      body: "Un membre de l'équipe vous répondra sous peu.",
    },
  });

  return { ok: true, newConversationId: newConv.id };
}
