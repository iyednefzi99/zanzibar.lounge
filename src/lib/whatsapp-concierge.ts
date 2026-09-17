/**
 * Concierge IA WhatsApp
 *
 * Orchestrateur du concierge WhatsApp qui gère :
 * - Messages entrants (text, audio, image)
 * - Détection d'intention (réservation, modification, annulation, info)
 * - Appel IA pour générer des réponses
 * - Exécution des outils (réservation, disponibilité, etc.)
 * - Transfert à un humain si nécessaire
 */

import { Channel, type ConciergeIntent } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { availability, createReservation, cancelReservation, findByReference } from "@/lib/reservations";
import { formatSlot } from "@/lib/hours";
import { normalizePhone } from "@/lib/phone";
import { hmToMinutes, toISODate } from "@/lib/time";

// ─── Types ────────────────────────────────────────────────────────────

export type WhatsAppMessage = {
  from: string; // Numéro E.164
  text?: string;
  type: "text" | "image" | "audio" | "location" | "interactive";
  mediaUrl?: string;
  interactiveId?: string; // Pour les boutons/réponses interactives
  messageId: string;
};

export type ConciergeResponse = {
  text: string;
  intent: ConciergeIntent;
  confidence: number;
  handoff?: boolean;
  handoffReason?: string;
};

export type ConversationContext = {
  conversationId: string;
  guestId: string;
  locale: string;
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>;
  lastIntent?: ConciergeIntent;
};

// ─── Patterns de détection d'intention ────────────────────────────────

const INTENT_PATTERNS: Record<ConciergeIntent, RegExp[]> = {
  RESERVATION: [
    /réserver?\b/i,
    /reserve\b/i,
    /book(?:ing)?\b/i,
    /حجز\b/,
    /نحجز\b/,
    /أحجز\b/,
    /table\b/i,
    /طاب/i,
    /creneau/i,
    /créneau/i,
    /ce soir/i,
    /ce week/i,
    /demain/i,
    /اليوم/,
    /غدا/,
  ],
  MODIFICATION: [
    /modif(?:ier|y)?\b/i,
    /changer?\b/i,
    /décaler?\b/i,
    /avancer?\b/i,
    /repousser?\b/i,
    /ch(?:anger|ange)\b/i,
    /تعديل\b/,
    /غيّر\b/,
  ],
  CANCELLATION: [
    /annul(?:er|er)?\b/i,
    /cancel\b/i,
    /supprim(?:er|e)\b/i,
    /حذف\b/,
    /إلغاء\b/,
    /إلغ\b/,
  ],
  INFO_MENU: [
    /menu\b/i,
    /carte\b/i,
    /plat(?:s)?\b/i,
    /dish(?:es)?\b/i,
    /نوع\b/,
    /أكل\b/,
    /أكل\b/,
    /وجبة\b/,
    /специалитет/i,
  ],
  INFO_RESTAURANT: [
    /horaire/i,
    /ouvert/i,
    /adresse/i,
    /localisation/i,
    /ouverture/i,
    /fermé/i,
    /مواعيد\b/,
    /وقت\b/,
    /فين\b/,
    /أين\b/,
  ],
  GENERAL: [],
  HANDOFF: [
    /parler?\s*(?:à|a)\s*(?:un|une)/i,
    /humain/i,
    /personne/i,
    /manager/i,
    /responsable/i,
    /موظف\b/,
    /manager\b/i,
  ],
};

// ─── Détection d'intention ────────────────────────────────────────────

/**
 * Détecte l'intention du message en utilisant des patterns regex.
 * Pas besoin d'appel IA pour la détection d'intention de base.
 */
export function detectIntent(text: string): { intent: ConciergeIntent; confidence: number } {
  const normalizedText = text.toLowerCase().trim();

  // Vérifier chaque intention dans l'ordre de priorité
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === "GENERAL") continue;

    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent: intent as ConciergeIntent,
          confidence: 0.9,
        };
      }
    }
  }

  // Par défaut : conversation générale
  return { intent: "GENERAL", confidence: 0.5 };
}

// ─── Génération de réponse ────────────────────────────────────────────

/**
 * Génère une réponse en fonction de l'intention détectée.
 */
export async function generateResponse(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  const { intent, confidence } = detectIntent(message.text ?? "");

  // Si le message est trop court ou ambigu, demander clarification
  if (confidence < 0.6 && intent === "GENERAL") {
    return {
      text: getClarificationMessage(context.locale),
      intent: "GENERAL",
      confidence,
    };
  }

  switch (intent) {
    case "RESERVATION":
      return await handleReservationIntent(message, context);
    case "MODIFICATION":
      return await handleModificationIntent(message, context);
    case "CANCELLATION":
      return await handleCancellationIntent(message, context);
    case "INFO_MENU":
      return await handleMenuIntent(message, context);
    case "INFO_RESTAURANT":
      return await handleRestaurantInfoIntent(message, context);
    case "HANDOFF":
      return {
        text: getHandoffMessage(context.locale),
        intent: "HANDOFF",
        confidence,
        handoff: true,
        handoffReason: "Client demande un humain",
      };
    default:
      return await handleGeneralIntent(message, context);
  }
}

// ─── Handlers par intention ───────────────────────────────────────────

async function handleReservationIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  const locale = context.locale;

  // Extraire les informations du message
  const dateMatch = message.text?.match(
    /(\d{1,2})\s*(?:\/|-|\.|\s)\s*(\d{1,2})\s*(?:\/|-|\.|\s)?(\d{2,4})?/,
  );
  const timeMatch = message.text?.match(/(\d{1,2})[h:](\d{2})/);
  const partyMatch = message.text?.match(/(\d+)\s*(?:personnes?|pers|p\b|أشخاص)/i);

  if (!dateMatch || !timeMatch) {
    return {
      text: getReservationFormMessage(locale),
      intent: "RESERVATION",
      confidence: 0.8,
    };
  }

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
  const serviceDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const minutes = hmToMinutes(`${timeMatch[1]}:${timeMatch[2]}`);
  const partySize = partyMatch ? parseInt(partyMatch[1], 10) : 2;

  // Vérifier la disponibilité
  const slots = await availability(serviceDate, partySize);
  const matchingSlot = slots.find(
    (s) => s.minutes === minutes && s.available,
  );

  if (!matchingSlot) {
    const alternatives = slots
      .filter((s) => s.available)
      .slice(0, 3)
      .map((s) => s.label)
      .join(", ");

    return {
      text: getNoAvailabilityMessage(locale, serviceDate, alternatives),
      intent: "RESERVATION",
      confidence: 0.9,
    };
  }

  // Demander confirmation
  return {
    text: getReservationConfirmationMessage(locale, serviceDate, formatSlot(minutes), partySize),
    intent: "RESERVATION",
    confidence: 0.95,
  };
}

async function handleModificationIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  // Chercher une référence de réservation dans l'historique
  const refMatch = message.text?.match(/ZL-[A-Z0-9]{4}/i);

  if (refMatch) {
    const ref = refMatch[0].toUpperCase();
    const reservation = await findByReference(ref, context.guestId);

    if (!reservation) {
      return {
        text: getReservationNotFoundMessage(context.locale),
        intent: "MODIFICATION",
        confidence: 0.9,
      };
    }

    return {
      text: getModificationOptionsMessage(context.locale, ref),
      intent: "MODIFICATION",
      confidence: 0.95,
    };
  }

  return {
    text: getModificationRequestMessage(context.locale),
    intent: "MODIFICATION",
    confidence: 0.8,
  };
}

async function handleCancellationIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  const refMatch = message.text?.match(/ZL-[A-Z0-9]{4}/i);

  if (refMatch) {
    const ref = refMatch[0].toUpperCase();
    const result = await cancelReservation(ref, "guest");

    if (result.ok) {
      return {
        text: getCancellationSuccessMessage(context.locale, ref),
        intent: "CANCELLATION",
        confidence: 1,
      };
    }

    return {
      text: getCancellationErrorMessage(context.locale, "NOT_FOUND"),
      intent: "CANCELLATION",
      confidence: 0.9,
    };
  }

  return {
    text: getCancellationRequestMessage(context.locale),
    intent: "CANCELLATION",
    confidence: 0.8,
  };
}

async function handleMenuIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  // TODO: Récupérer le menu depuis le site
  return {
    text: getMenuMessage(context.locale),
    intent: "INFO_MENU",
    confidence: 0.9,
  };
}

async function handleRestaurantInfoIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  return {
    text: getRestaurantInfoMessage(context.locale),
    intent: "INFO_RESTAURANT",
    confidence: 0.9,
  };
}

async function handleGeneralIntent(
  message: WhatsAppMessage,
  context: ConversationContext,
): Promise<ConciergeResponse> {
  // Vérifier si c'est un salut
  const greetings = /^(bonjour|bonsoir|hello|hi|salut|هاي|مرحبا)/i;
  if (greetings.test(message.text ?? "")) {
    return {
      text: getGreetingMessage(context.locale),
      intent: "GENERAL",
      confidence: 0.9,
    };
  }

  return {
    text: getGeneralResponseMessage(context.locale),
    intent: "GENERAL",
    confidence: 0.7,
  };
}

// ─── Messages localisés ───────────────────────────────────────────────

function getReservationFormMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `📅 Pour réserver, j'ai besoin de :
• La date (ex: 15/12)
• L'heure (ex: 20h00)
• Le nombre de personnes

Exemple : "Réserver pour 4 personnes demain à 20h30"`,
    ar: `📅 للحجز، أحتاج إلى:
• التاريخ (مثال: 15/12)
• الوقت (مثال: 20:00)
• عدد الأشخاص

مثال: "أحجز لـ 4 أشخاص غداً الساعة 20:30"`,
    en: `📅 To book, I need:
• The date (e.g., 15/12)
• The time (e.g., 8:00 PM)
• Number of guests

Example: "Book for 4 tomorrow at 8:30 PM"`,
  };
  return messages[locale] ?? messages.fr;
}

function getReservationConfirmationMessage(
  locale: string,
  date: string,
  time: string,
  partySize: number,
): string {
  const messages: Record<string, string> = {
    fr: `✅ J'ai une table disponible !
📅 ${date} à ${time}
👥 ${partySize} personne${partySize > 1 ? "s" : ""}

Tapez "confirmer" pour valider, ou proposez une autre heure.`,
    ar: `✅ لديّ طاولة متاحة!
📅 ${date} الساعة ${time}
👥 ${partySize} شخص

اكتب "تأكيد" للتأكيد، أو اقترح وقتاً آخر.`,
    en: `✅ I have a table available!
📅 ${date} at ${time}
👥 ${partySize} guest${partySize > 1 ? "s" : ""}

Type "confirm" to book, or suggest another time.`,
  };
  return messages[locale] ?? messages.fr;
}

function getNoAvailabilityMessage(
  locale: string,
  date: string,
  alternatives: string,
): string {
  const messages: Record<string, string> = {
    fr: `😔 Pas de disponibilité à ${date}.
Heures alternatives : ${alternatives}

Voulez-vous réserver à l'une de ces heures ?`,
    ar: `😔 لا تتوفر أماكن في ${date}.
الساعات البديلة: ${alternatives}

هل تريد الحجز في أحد هذه الأوقات؟`,
    en: `😔 No availability on ${date}.
Alternative times: ${alternatives}

Would you like to book at one of these times?`,
  };
  return messages[locale] ?? messages.fr;
}

function getHandoffMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `👨‍💼 Je transfer à un membre de notre équipe. Un instant s'il vous plaît...`,
    ar: `👨‍💼 أحوّلك إلى أحد أعضاء فريقنا. لحظة من فضلك...`,
    en: `👨‍💼 I'm transferring you to a team member. One moment please...`,
  };
  return messages[locale] ?? messages.fr;
}

function getClarificationMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `🤔 Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?

Je peux vous aider avec :
• 📅 Réservation de table
• 📋 Consultation du menu
• ℹ️ Informations pratiques
• ❌ Annulation de réservation`,
    ar: `🤔 لست متأكداً من أنني أفهم. هل يمكنك إعادة الصياغة؟

يمكنني مساعدتك مع:
• 📅 حجز طاولة
• 📋 عرض القائمة
• ℹ️ معلومات عملية
• ❌ إلغاء حجز`,
    en: `🤔 I'm not sure I understand. Can you rephrase?

I can help with:
• 📅 Table reservation
• 📋 Menu consultation
• ℹ️ Practical information
• ❌ Reservation cancellation`,
  };
  return messages[locale] ?? messages.fr;
}

function getReservationNotFoundMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `❌ Réservation non trouvée. Vérifiez la référence (format ZL-XXXX).`,
    ar: `❌ لم يتم العثور على الحجز. تحقق من المرجع (تنسيق ZL-XXXX).`,
    en: `❌ Reservation not found. Check the reference (format ZL-XXXX).`,
  };
  return messages[locale] ?? messages.fr;
}

function getModificationOptionsMessage(locale: string, ref: string): string {
  const messages: Record<string, string> = {
    fr: `📝 Réservation ${ref} trouvée !
Que souhaitez-vous modifier ?
• "Changer d'heure" → Nouvelle heure
• "Changer de date" → Nouvelle date
• "Changer le nombre" → Nouvel effectif`,
    ar: `📝 تم العثور على الحجز ${ref}!
ماذا تريد التعديل؟
• "تغيير الوقت" → وقت جديد
• "تغيير التاريخ" → تاريخ جديد
• "تغيير العدد" → عدد جديد`,
    en: `📝 Reservation ${ref} found!
What would you like to change?
• "Change time" → New time
• "Change date" → New date
• "Change party size" → New party size`,
  };
  return messages[locale] ?? messages.fr;
}

function getModificationRequestMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `📝 Pour modifier votre réservation, envoyez-moi la référence (format ZL-XXXX) ou décrivez le changement souhaité.`,
    ar: `📝 لتعديل حجزك، أرسل لي المرجع (تنسيق ZL-XXXX) أو صِف التغيير المطلوب.`,
    en: `📝 To modify your reservation, send me the reference (format ZL-XXXX) or describe the change.`,
  };
  return messages[locale] ?? messages.fr;
}

function getCancellationSuccessMessage(locale: string, ref: string): string {
  const messages: Record<string, string> = {
    fr: `✅ Réservation ${ref} annulée avec succès.
Au plaisir de vous accueillir à nouveau !`,
    ar: `✅ تم إلغاء الحجز ${ref} بنجاح.
نتطلع لاستضافتك مرة أخرى!`,
    en: `✅ Reservation ${ref} cancelled successfully.
We look forward to welcoming you again!`,
  };
  return messages[locale] ?? messages.fr;
}

function getCancellationErrorMessage(locale: string, error: string | undefined): string {
  const messages: Record<string, string> = {
    fr: `❌ Impossible d'annuler : ${error ?? "réservation non trouvée"}.`,
    ar: `❌ تعذر الإلغاء: ${error ?? "الحجز غير موجود"}.`,
    en: `❌ Cannot cancel: ${error ?? "reservation not found"}.`,
  };
  return messages[locale] ?? messages.fr;
}

function getCancellationRequestMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `❌ Pour annuler, envoyez-moi la référence de votre réservation (format ZL-XXXX).`,
    ar: `❌ للإلغاء، أرسل لي مرجع حجزك (تنسيق ZL-XXXX).`,
    en: `❌ To cancel, send me your reservation reference (format ZL-XXXX).`,
  };
  return messages[locale] ?? messages.fr;
}

function getMenuMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `📋 Consultez notre menu complet ici :
👉 https://zanzibar.lounge/carte

N'hésitez pas si vous avez des questions sur les allergènes !`,
    ar: `📋 اعرض قائمتنا الكاملة هنا:
👉 https://zanzibar.lounge/carte

لا تتردد في السؤال عن مسببات الحساسية!`,
    en: `📋 View our full menu here:
👉 https://zanzibar.lounge/carte

Feel free to ask about allergens!`,
  };
  return messages[locale] ?? messages.fr;
}

function getRestaurantInfoMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `ℹ️ Zanzibar Lounge
📍 Adresse à confirmer
📞 Téléphone à confirmer
🕐 Horaires : à confirmer`,
    ar: `ℹ️ زنجبار لاونج
📍 العنوان قيد التأكيد
📞 الهاتف قيد التأكيد
🕐 مواعيد العمل: قيد التأكيد`,
    en: `ℹ️ Zanzibar Lounge
📍 Address to confirm
📞 Phone to confirm
🕐 Hours: to confirm`,
  };
  return messages[locale] ?? messages.fr;
}

function getGreetingMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `👋 Bonjour ! Bienvenue chez Zanzibar Lounge.

Comment puis-je vous aider ?
• 📅 Réserver une table
• 📋 Voir le menu
• ℹ️ Infos pratiques`,
    ar: `👋 مرحباً! أهلاً بك في زنجبار لاونج.

كيف يمكنني مساعدتك؟
• 📅 حجز طاولة
• 📋 عرض القائمة
• ℹ️ معلومات عملية`,
    en: `👋 Hello! Welcome to Zanzibar Lounge.

How can I help you?
• 📅 Book a table
• 📋 View menu
• ℹ️ Practical info`,
  };
  return messages[locale] ?? messages.fr;
}

function getGeneralResponseMessage(locale: string): string {
  const messages: Record<string, string> = {
    fr: `Je suis là pour vous aider avec :
• 📅 Réservation de table
• 📋 Consultation du menu
• ℹ️ Informations pratiques
• ❌ Annulation de réservation

Que souhaitez-vous faire ?`,
    ar: `أنا هنا لمساعدتك مع:
• 📅 حجز طاولة
• 📋 عرض القائمة
• ℹ️ معلومات عملية
• ❌ إلغاء حجز

ماذا تريد أن تفعل؟`,
    en: `I'm here to help with:
• 📅 Table reservation
• 📋 Menu consultation
• ℹ️ Practical information
• ❌ Reservation cancellation

What would you like to do?`,
  };
  return messages[locale] ?? messages.fr;
}

// ─── Conversation Context ─────────────────────────────────────────────

/**
 * Construit le contexte de conversation pour l'IA.
 */
export async function buildConversationContext(
  guestId: string,
  locale: string,
): Promise<ConversationContext> {
  // Trouver ou créer la conversation WhatsApp
  const conversation = await db.conversation.findFirst({
    where: {
      guestId,
      channel: "WHATSAPP",
      closed: false,
    },
    orderBy: { lastMessageAt: "desc" },
  });

  if (!conversation) {
    const newConversation = await db.conversation.create({
      data: {
        guestId,
        channel: "WHATSAPP",
        locale,
      },
    });
    return {
      conversationId: newConversation.id,
      guestId,
      locale,
      messageHistory: [],
    };
  }

  // Récupérer les derniers messages
  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    conversationId: conversation.id,
    guestId,
    locale: conversation.locale,
    messageHistory: messages.reverse().map((m) => ({
      role: m.role === "GUEST" ? "user" as const : "assistant" as const,
      content: m.body,
    })),
  };
}

/**
 * Sauvegarde un message dans la conversation.
 */
export async function saveMessage(
  conversationId: string,
  role: "GUEST" | "AGENT" | "STAFF",
  body: string,
  providerId?: string,
): Promise<void> {
  await db.message.create({
    data: {
      conversationId,
      role,
      body,
      providerId,
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
}
