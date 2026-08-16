import { site } from "@/content/site";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

/**
 * Purge des données personnelles.
 *
 * Un système de réservation accumule des numéros de téléphone et des
 * conversations privées. Rien dans l'exploitation d'un restaurant ne justifie
 * de les garder indéfiniment : ce qui n'existe plus ne peut ni fuiter, ni être
 * réclamé. Les durées sont dans `site.retention`.
 *
 * Appelé par la tâche planifiée en même temps que les rappels.
 */

export type PurgeReport = {
  messages: number;
  conversations: number;
  webhookEvents: number;
  reservations: number;
  guests: number;
};

export async function purgeExpiredData(
  now: Date = new Date(),
): Promise<PurgeReport> {
  const { conversationDays, webhookEventDays, reservationDays } =
    site.retention;

  const messagesBefore = daysAgo(now, conversationDays);
  const eventsBefore = daysAgo(now, webhookEventDays);
  const reservationsBefore = daysAgo(now, reservationDays);

  const messages = await db.message.deleteMany({
    where: { createdAt: { lt: messagesBefore } },
  });

  // Une conversation sans message n'a plus d'objet.
  const conversations = await db.conversation.deleteMany({
    where: {
      lastMessageAt: { lt: messagesBefore },
      messages: { none: {} },
    },
  });

  const webhookEvents = await db.processedEvent.deleteMany({
    where: { createdAt: { lt: eventsBefore } },
  });

  const reservations = await db.reservation.deleteMany({
    where: { startsAt: { lt: reservationsBefore } },
  });

  // Un client sans réservation ni conversation n'est plus qu'un numéro de
  // téléphone conservé sans raison.
  const guests = await db.guest.deleteMany({
    where: {
      reservations: { none: {} },
      conversations: { none: {} },
      updatedAt: { lt: messagesBefore },
    },
  });

  return {
    messages: messages.count,
    conversations: conversations.count,
    webhookEvents: webhookEvents.count,
    reservations: reservations.count,
    guests: guests.count,
  };
}

/**
 * Effacement à la demande d'une personne (« supprimez mes données »).
 *
 * Supprime le client et, en cascade, ses conversations, ses messages et ses
 * réservations. Utilisé par `npm run forget -- +216XXXXXXXX`.
 */
export async function forgetGuest(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("Numéro invalide.");

  const deleted = await db.guest.deleteMany({ where: { phone: normalized } });
  return deleted.count > 0;
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60_000);
}
