/**
 * Thread omnichannel : vue unifiée de toutes les conversations d'un guest.
 *
 * Les conversations existent toujours par canal (WhatsApp, SMS, Voice, Web)
 * mais cette couche offre une vue aggregate pour :
 * - L'agent IA : contexte complet quelle que soit la来源
 * - Le back-office : historique unifié du guest
 * - Le guest : timeline de ses échanges
 */

import { Channel, MessageRole } from "@/generated/prisma/client";

import { db } from "@/lib/db";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type UnifiedMessage = {
  id: string;
  channel: Channel;
  role: "guest" | "agent" | "staff";
  body: string;
  timestamp: Date;
  /** Contexte optionnel : réservation liée, outil appelé, etc. */
  metadata?: Record<string, unknown>;
};

export type UnifiedThread = {
  guestId: string;
  guestName: string | null;
  guestPhone: string;
  messages: UnifiedMessage[];
  channels: Channel[];
  lastMessageAt: Date | null;
  totalMessages: number;
};

export type ChannelSummary = {
  channel: Channel;
  messageCount: number;
  lastMessageAt: Date | null;
  open: boolean;
};

// --------------------------------------------------------------------------
// Thread unifié
// --------------------------------------------------------------------------

/**
 * Récupère l'historique unifié de tous les échanges d'un guest,
 * triés par date. Utile pour le back-office et le contexte agent.
 */
export async function getUnifiedThread(
  guestId: string,
  options: { limit?: number; before?: Date } = {},
): Promise<UnifiedThread> {
  const { limit = 100, before } = options;

  const guest = await db.guest.findUnique({
    where: { id: guestId },
    select: { id: true, name: true, phone: true },
  });

  if (!guest) {
    return {
      guestId,
      guestName: null,
      guestPhone: "",
      messages: [],
      channels: [],
      lastMessageAt: null,
      totalMessages: 0,
    };
  }

  // Récupérer toutes les conversations du guest
  const conversations = await db.conversation.findMany({
    where: { guestId },
    select: {
      id: true,
      channel: true,
      closed: true,
      lastMessageAt: true,
      messages: {
        where: before ? { createdAt: { lt: before } } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          role: true,
          body: true,
          createdAt: true,
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Aplatir et trier tous les messages
  const allMessages: UnifiedMessage[] = conversations.flatMap((conv) =>
    conv.messages.map((msg) => ({
      id: msg.id,
      channel: conv.channel,
      role: mapRole(msg.role),
      body: msg.body,
      timestamp: msg.createdAt,
    })),
  );

  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Dédupliquer et limiter
  const seen = new Set<string>();
  const unique = allMessages.filter((msg) => {
    if (seen.has(msg.id)) return false;
    seen.add(msg.id);
    return true;
  });

  const messages = unique.slice(-limit);

  const channels = [...new Set(conversations.map((c) => c.channel))];
  const lastMessageAt = conversations[0]?.lastMessageAt ?? null;

  return {
    guestId: guest.id,
    guestName: guest.name,
    guestPhone: guest.phone,
    messages,
    channels,
    lastMessageAt,
    totalMessages: unique.length,
  };
}

// --------------------------------------------------------------------------
// Résumé par canal
// --------------------------------------------------------------------------

export async function getChannelSummary(
  guestId: string,
): Promise<ChannelSummary[]> {
  const conversations = await db.conversation.findMany({
    where: { guestId },
    select: {
      channel: true,
      closed: true,
      lastMessageAt: true,
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((conv) => ({
    channel: conv.channel,
    messageCount: conv._count.messages,
    lastMessageAt: conv.lastMessageAt,
    open: !conv.closed,
  }));
}

// --------------------------------------------------------------------------
// Contexte agent (derniers N messages de tous les canaux)
// --------------------------------------------------------------------------

/**
 * Récupère le contexte de conversation pour l'agent IA :
 * les derniers messages de TOUS les canaux du guest, pour que l'agent
 * ait une vue complète même si le client a changé de canal.
 */
export async function getAgentContext(
  guestId: string,
  take = 20,
): Promise<Array<{ role: string; body: string; channel: Channel; at: Date }>> {
  const conversations = await db.conversation.findMany({
    where: { guestId },
    select: {
      channel: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        select: {
          role: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });

  const all = conversations.flatMap((conv) =>
    conv.messages.map((msg) => ({
      role: msg.role,
      body: msg.body,
      channel: conv.channel,
      at: msg.createdAt,
    })),
  );

  all.sort((a, b) => a.at.getTime() - b.at.getTime());

  return all.slice(-take);
}

// --------------------------------------------------------------------------
// Envoi cross-canal
// --------------------------------------------------------------------------

/**
 * Envoie un message sur le meilleur canal disponible pour un guest.
 * Utilisé pour les notifications importantes (waitlist, rappels, etc.)
 * qui doivent atteindre le guest quelle que soit sa dernière interaction.
 */
export async function sendToGuestBestChannel(
  guestId: string,
  body: string,
  preferred?: Channel,
): Promise<{ ok: boolean; channel?: Channel; reason?: string }> {
  const { sendOnBestChannel } = await import("@/lib/channels");
  const guest = await db.guest.findUnique({
    where: { id: guestId },
    select: { phone: true, optedOut: true },
  });

  if (!guest || guest.optedOut) {
    return { ok: false, reason: "guest not found or opted out" };
  }

  const result = await sendOnBestChannel(guest.phone, body, preferred);
  return {
    ok: result.ok,
    channel: preferred,
    reason: result.ok ? undefined : ("reason" in result ? result.reason : undefined),
  };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function mapRole(role: MessageRole): "guest" | "agent" | "staff" {
  switch (role) {
    case MessageRole.GUEST:
      return "guest";
    case MessageRole.AGENT:
      return "agent";
    case MessageRole.STAFF:
      return "staff";
    default:
      return "agent";
  }
}
