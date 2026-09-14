import Anthropic from "@anthropic-ai/sdk";
import { Channel, MessageRole } from "@/generated/prisma/client";

import { site } from "@/content/site";
import { db } from "@/lib/db";
import { env, hasAgent } from "@/lib/env";
import { isLocale, type Locale } from "@/i18n/config";
import {
  conversationHistory,
  ensureConversation,
  ensureGuest,
  recordMessage,
  sendMessage,
  type InboundMessage,
} from "@/lib/channels";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { runTool, tools, type ToolContext } from "@/lib/agent/tools";
import { getSmartSuggestions } from "@/lib/agent/suggestions";

/**
 * L'agent conversationnel : reçoit un message, décide, agit, répond.
 *
 * Boucle d'outils écrite à la main plutôt que via le tool runner du SDK : elle
 * n'est pas en bêta, et chaque appel d'outil passe par nos propres vérifications
 * d'appartenance avant de toucher la base.
 */

const MODEL = "claude-opus-5";
const MAX_TOOL_ROUNDS = 6;
const HISTORY_LENGTH = 20;

let anthropic: Anthropic | null = null;

function client(): Anthropic {
  anthropic ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic;
}

/** Mots qui coupent net la conversation, quel que soit le canal. */
const OPT_OUT = [
  "stop",
  "arret",
  "arrêt",
  "desabonner",
  "désabonner",
  "unsubscribe",
  "توقف",
  "إلغاء",
];

const OPT_OUT_REPLY: Record<Locale, string> = {
  fr: "C'est noté, vous ne recevrez plus de messages. Vos réservations en cours restent valables. Écrivez « START » pour réactiver.",
  ar: "تم، لن تصلك رسائل بعد الآن. حجوزاتك الحالية سارية. اكتب « START » لإعادة التفعيل.",
  en: "Done — no more messages. Any existing bookings still stand. Text “START” to switch them back on.",
};

const FALLBACK_REPLY: Record<Locale, string> = {
  fr: `Je n'arrive pas à traiter votre message. Appelez-nous au ${site.contact.phone}, on s'en occupe.`,
  ar: `تعذّر عليّ معالجة رسالتك. اتصل بنا على ${site.contact.phone} وسنتكفّل بالأمر.`,
  en: `I can't process that right now. Call us on ${site.contact.phone} and we'll sort it out.`,
};

export type AgentResult = {
  reply: string | null;
  handOff?: { reason: string; summary: string };
  /** Vrai si la réponse vient du repli et non du modèle. */
  degraded?: boolean;
};

export async function handleInbound(
  inbound: InboundMessage,
  now: Date = new Date(),
): Promise<AgentResult> {
  const locale = detectLocale(inbound.body);
  const guest = await ensureGuest(inbound.from, locale);
  const conversation = await ensureConversation(guest.id, inbound.channel, locale);

  await recordMessage(
    conversation.id,
    MessageRole.GUEST,
    inbound.body,
    inbound.providerId,
  );

  // --- Désabonnement et réabonnement : traités avant tout appel au modèle ---
  const normalized = inbound.body.trim().toLowerCase();
  if (OPT_OUT.some((word) => normalized === word)) {
    await db.guest.update({ where: { id: guest.id }, data: { optedOut: true } });
    const reply = OPT_OUT_REPLY[locale];
    // On répond directement : `sendMessage` refuserait, le client venant
    // d'être marqué comme désabonné.
    await deliver(inbound.channel, inbound.from, reply, conversation.id);
    return { reply };
  }

  if (normalized === "start" && guest.optedOut) {
    await db.guest.update({ where: { id: guest.id }, data: { optedOut: false } });
  }

  if (!hasAgent) {
    const reply = FALLBACK_REPLY[locale];
    await sendMessage(inbound.channel, inbound.from, reply);
    return { reply, degraded: true };
  }

  const context: ToolContext = {
    phone: inbound.from,
    guestId: guest.id,
    locale,
    channel: inbound.channel,
    now,
  };

  try {
    const suggestions = await getSmartSuggestions(guest.id, locale);
    const { text, handOff } = await converse(
      conversation.id,
      buildSystemPrompt({ locale, guestName: guest.name, now, suggestions }),
      context,
    );

    const reply = text.trim() || FALLBACK_REPLY[locale];
    await sendMessage(inbound.channel, inbound.from, reply);

    if (handOff) await flagForStaff(guest.id, inbound, handOff);

    return { reply, handOff };
  } catch (error) {
    console.error("[agent] échec du traitement", {
      channel: inbound.channel,
      error: error instanceof Error ? error.message : error,
    });
    const reply = FALLBACK_REPLY[locale];
    await sendMessage(inbound.channel, inbound.from, reply);
    return { reply, degraded: true };
  }
}

// --------------------------------------------------------------------------
// Boucle d'outils
// --------------------------------------------------------------------------

async function converse(
  conversationId: string,
  system: string,
  context: ToolContext,
): Promise<{ text: string; handOff?: { reason: string; summary: string } }> {
  const history = await conversationHistory(conversationId, HISTORY_LENGTH);

  const messages: Anthropic.MessageParam[] = history.map((message) => ({
    role: message.role === MessageRole.GUEST ? "user" : "assistant",
    content: message.body,
  }));

  // L'historique doit commencer par le client et alterner proprement.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (messages.length === 0) return { text: "" };

  let handOff: { reason: string; summary: string } | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 8192,
      system,
      tools,
      // Une réservation n'a pas besoin d'un raisonnement profond, et le client
      // attend sur WhatsApp : on privilégie la latence.
      output_config: { effort: "low" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { text: "", handOff };
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      return { text: textOf(response.content), handOff };
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const outcome = await runTool(
        block.name,
        (block.input ?? {}) as Record<string, unknown>,
        context,
      );
      if (outcome.handOff) handOff = outcome.handOff;

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: outcome.content,
      });
    }

    // Tous les résultats repartent dans un seul message utilisateur : les
    // séparer apprendrait au modèle à ne plus appeler d'outils en parallèle.
    messages.push({ role: "user", content: results });
  }

  // Boucle trop longue : on rend la main plutôt que de tourner indéfiniment.
  return { text: "", handOff };
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

// --------------------------------------------------------------------------
// Divers
// --------------------------------------------------------------------------

/** Envoi direct, sans le contrôle de désabonnement de `sendMessage`. */
async function deliver(
  channel: Channel,
  to: string,
  body: string,
  conversationId: string,
): Promise<void> {
  const { sendWhatsAppText } = await import("@/lib/channels/whatsapp");
  const { sendSms } = await import("@/lib/channels/sms");

  const result =
    channel === Channel.WHATSAPP
      ? await sendWhatsAppText(to, body)
      : await sendSms(to, body);

  if (result.ok) {
    await recordMessage(conversationId, MessageRole.AGENT, body, result.providerId);
  }
}

async function flagForStaff(
  guestId: string,
  inbound: InboundMessage,
  handOff: { reason: string; summary: string },
): Promise<void> {
  // Trace lisible dans les journaux d'exploitation ; le back-office la reprend
  // depuis la conversation. Volontairement sans le numéro complet.
  console.warn("[agent] passage à l'équipe", {
    guestId,
    channel: inbound.channel,
    reason: handOff.reason,
    summary: handOff.summary,
  });

  const conversation = await db.conversation.findFirst({
    where: { guestId, channel: inbound.channel, closed: false },
  });
  if (conversation) {
    await recordMessage(
      conversation.id,
      MessageRole.STAFF,
      `⚑ À reprendre par l'équipe (${handOff.reason}) : ${handOff.summary}`,
    );
  }
}

/** L'écriture arabe se repère au premier coup d'œil ; le reste suit le stockage. */
function detectLocale(body: string): Locale {
  if (/[؀-ۿ]/.test(body)) return "ar";
  if (/\b(the|hello|hi|book|table|tonight|tomorrow)\b/i.test(body)) return "en";
  return "fr";
}

export { isLocale };
