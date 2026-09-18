import type Anthropic from "@anthropic-ai/sdk";
import { Channel, ReservationStatus } from "@/generated/prisma/client";

import { site, type ZoneId } from "@/content/site";
import { menu, menuAsText } from "@/content/menu";
import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { hmToMinutes, toISODate } from "@/lib/time";
import { serviceWindow, formatSlot } from "@/lib/hours";
import {
  availability,
  cancelReservation,
  createReservation,
  findByReference,
  rescheduleReservation,
  upcomingForPhone,
  type BookingError,
} from "@/lib/reservations";
import { joinWaitlist, getWaitlistForGuest } from "@/lib/waitlist";

/**
 * Les outils de l'agent.
 *
 * Principe de conception : **le numéro de téléphone n'est jamais un paramètre**.
 * Il vient du canal, qui l'a authentifié. Un client ne peut donc pas demander à
 * l'agent de lui lire la réservation de quelqu'un d'autre, même en fournissant
 * une référence valide — chaque outil revérifie l'appartenance.
 */

export type ToolContext = {
  /** Numéro E.164 vérifié par le canal. Fait autorité. */
  phone: string;
  guestId: string;
  locale: string;
  channel: Channel;
  now: Date;
};

export type ToolOutcome = {
  content: string;
  /** Signale à l'appelant qu'un humain doit reprendre la main. */
  handOff?: { reason: string; summary: string };
};

export const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Liste les créneaux encore libres pour une date et une taille de groupe. À appeler avant de proposer une heure. Ne réserve rien.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date du service au format AAAA-MM-JJ.",
        },
        party_size: {
          type: "integer",
          description: "Nombre de personnes, de 1 à 12.",
        },
      },
      required: ["date", "party_size"],
    },
  },
  {
    name: "create_booking",
    description:
      "Enregistre la réservation. À n'appeler que lorsque le nom, la date, l'heure et le nombre de personnes sont connus, et après check_availability.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom au nom duquel réserver." },
        date: { type: "string", description: "AAAA-MM-JJ." },
        time: {
          type: "string",
          description:
            "Heure sur 24 h, HH:MM. Pour une table après minuit, donner l'heure réelle (par exemple 00:30) avec la date de la soirée.",
        },
        party_size: { type: "integer" },
        zone: {
          type: "string",
          enum: ["terrasse", "salle", "salon"],
          description: "Facultatif. Ne rien mettre si le client n'a pas de préférence.",
        },
        notes: {
          type: "string",
          description:
            "Facultatif : anniversaire, poussette, allergie, demande particulière.",
        },
      },
      required: ["name", "date", "time", "party_size"],
    },
  },
  {
    name: "list_my_bookings",
    description:
      "Réservations à venir du client qui écrit. Aucun paramètre : le numéro est déjà connu.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "reschedule_booking",
    description: "Déplace une réservation existante du client.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Référence, format ZL-XXXX." },
        date: { type: "string", description: "Nouvelle date, AAAA-MM-JJ." },
        time: { type: "string", description: "Nouvelle heure, HH:MM." },
        party_size: {
          type: "integer",
          description: "Facultatif : nouveau nombre de personnes.",
        },
      },
      required: ["reference", "date", "time"],
    },
  },
  {
    name: "cancel_booking",
    description: "Annule une réservation du client.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Référence, format ZL-XXXX." },
      },
      required: ["reference"],
    },
  },
  {
    name: "confirm_booking",
    description:
      "Confirme la venue après un rappel. À appeler quand le client répond oui / نعم / yes à un message de rappel.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string" },
      },
      required: ["reference"],
    },
  },
  {
    name: "hand_off_to_staff",
    description:
      "Transmet à l'équipe : demande hors réservation, réclamation, groupe de plus de 12, ou question dont tu n'as pas la réponse.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["hors_sujet", "grand_groupe", "reclamation", "inconnu"],
        },
        summary: {
          type: "string",
          description: "Une phrase pour l'équipe, dans la langue du client.",
        },
      },
      required: ["reason", "summary"],
    },
  },
  {
    name: "get_menu_info",
    description:
      "Affiche la carte du restaurant, avec ou sans filtre par catégorie. À appeler quand le client demande le menu, les prix, un plat spécifique, ou les chichas.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Filtrer par catégorie (cafes, jus, cuisine, chicha, douceurs). Facultatif.",
          enum: ["cafes", "jus", "cuisine", "chicha", "douceurs"],
        },
      },
    },
  },
  {
    name: "get_reviews",
    description:
      "Affiche les avis approuvés récents du restaurant. À appeler quand le client demande des avis, la note, ou si le restaurant est bien.",
    input_schema: {
      type: "object",
      properties: {
        min_rating: {
          type: "integer",
          description:
            "Note minimale sur 5. Facultatif : par défaut tous les avis approuvés.",
          minimum: 1,
          maximum: 5,
        },
      },
    },
  },
  {
    name: "get_restaurant_info",
    description:
      "Affiche les informations du restaurant : horaires, adresse, téléphone, zones. À appeler quand le client demande où on est, les horaires, ou comment appeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "suggest_alternatives",
    description:
      "Quand un créneau est complet, propose les créneaux les plus proches encore disponibles. À appeler après check_availability si aucun créneau n'est libre, ou directement quand le client demande des alternatives.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date du service au format AAAA-MM-JJ.",
        },
        party_size: {
          type: "integer",
          description: "Nombre de personnes.",
        },
        preferred_time: {
          type: "string",
          description: "Heure souhaitée, HH:MM.",
        },
      },
      required: ["date", "party_size", "preferred_time"],
    },
  },
  {
    name: "join_waitlist",
    description:
      "Inscrit le client en liste d'attente quand le créneau souhaité est complet. Le client sera notifié si un créneau se libère.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date du service au format AAAA-MM-JJ.",
        },
        party_size: {
          type: "integer",
          description: "Nombre de personnes.",
        },
        preferred_time: {
          type: "string",
          description: "Heure souhaitée, HH:MM.",
        },
      },
      required: ["date", "party_size", "preferred_time"],
    },
  },
  {
    name: "check_waitlist_status",
    description:
      "Affiche la position et le statut de la liste d'attente du client. À appeler quand le client demande où en est sa demande d'inscription en liste d'attente.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  switch (name) {
    case "check_availability":
      return checkAvailability(input, context);
    case "create_booking":
      return createBooking(input, context);
    case "list_my_bookings":
      return listMyBookings(context);
    case "reschedule_booking":
      return reschedule(input, context);
    case "cancel_booking":
      return cancel(input, context);
    case "confirm_booking":
      return confirm(input, context);
    case "hand_off_to_staff":
      return handOff(input);
    case "get_menu_info":
      return getMenuInfo(input, context);
    case "get_reviews":
      return getReviews(input);
    case "get_restaurant_info":
      return getRestaurantInfo();
    case "suggest_alternatives":
      return suggestAlternatives(input, context);
    case "join_waitlist":
      return joinWaitlistTool(input, context);
    case "check_waitlist_status":
      return checkWaitlistStatus(context);
    default:
      return { content: `Outil inconnu : ${name}` };
  }
}

// --------------------------------------------------------------------------

async function checkAvailability(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const date = asDate(input.date);
  const partySize = asInt(input.party_size);
  if (!date) return { content: "Date invalide. Format attendu : AAAA-MM-JJ." };
  if (!partySize) return { content: "Nombre de personnes invalide." };

  if (!serviceWindow(date)) {
    return { content: `Fermé le ${date}. Proposer une autre date.` };
  }

  const slots = await availability(date, partySize, context.now);
  const free = slots.filter((slot) => slot.available).map((slot) => slot.label);

  if (free.length === 0) {
    return {
      content: `Aucun créneau libre le ${date} pour ${partySize} personnes. Proposer une autre date.`,
    };
  }

  return {
    content: `Créneaux libres le ${date} pour ${partySize} personnes : ${free.join(", ")}.`,
  };
}

async function createBooking(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const date = asDate(input.date);
  const partySize = asInt(input.party_size);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const minutes = date ? resolveSlot(date, input.time) : null;

  if (!name) return { content: "Nom manquant. Le demander au client." };
  if (!date) return { content: "Date invalide. Format attendu : AAAA-MM-JJ." };
  if (minutes === null) return { content: "Heure invalide. Format attendu : HH:MM." };
  if (!partySize) return { content: "Nombre de personnes invalide." };

  const result = await createReservation(
    {
      name,
      phone: context.phone,
      serviceDate: date,
      minutes,
      partySize,
      zone: asZone(input.zone),
      notes: typeof input.notes === "string" ? input.notes : null,
      channel: context.channel,
      locale: context.locale,
    },
    context.now,
  );

  if (!result.ok) return { content: explain(result.error) };

  const reservation = result.value;
  return {
    content: `Réservation enregistrée. Référence ${reservation.reference} : ${reservation.partySize} personne(s) le ${reservation.serviceDate} à ${reservation.time}${
      reservation.zone ? `, en ${reservation.zone}` : ""
    }. Donner la référence au client.`,
  };
}

async function listMyBookings(context: ToolContext): Promise<ToolOutcome> {
  const bookings = await upcomingForPhone(context.phone, context.now);

  if (bookings.length === 0) {
    return { content: "Aucune réservation à venir pour ce numéro." };
  }

  const lines = bookings.map(
    (booking) =>
      `${booking.reference} — ${booking.serviceDate} à ${booking.time}, ${booking.partySize} personne(s)${
        booking.zone ? `, ${booking.zone}` : ""
      }, statut ${booking.status}`,
  );
  return { content: `Réservations à venir :\n${lines.join("\n")}` };
}

async function reschedule(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const reference = asReference(input.reference);
  const date = asDate(input.date);
  const minutes = date ? resolveSlot(date, input.time) : null;

  if (!reference) return { content: "Référence invalide." };
  if (!date) return { content: "Date invalide." };
  if (minutes === null) return { content: "Heure invalide." };

  const owned = await assertOwnership(reference, context.phone);
  if (!owned) return { content: OWNERSHIP_DENIED };

  const partySize = asInt(input.party_size);
  const result = await rescheduleReservation(
    reference,
    { serviceDate: date, minutes, ...(partySize ? { partySize } : {}) },
    context.now,
  );

  if (!result.ok) return { content: explain(result.error) };

  return {
    content: `Déplacée. ${result.value.reference} : ${result.value.partySize} personne(s) le ${result.value.serviceDate} à ${result.value.time}.`,
  };
}

async function cancel(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const reference = asReference(input.reference);
  if (!reference) return { content: "Référence invalide." };

  const owned = await assertOwnership(reference, context.phone);
  if (!owned) return { content: OWNERSHIP_DENIED };

  const result = await cancelReservation(reference, "agent");
  if (!result.ok) return { content: explain(result.error) };

  return { content: `Annulée : ${result.value.reference}.` };
}

async function confirm(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const reference = asReference(input.reference);
  if (!reference) {
    // Le client répond « oui » sans référence : on prend la prochaine.
    const [next] = await upcomingForPhone(context.phone, context.now);
    if (!next) return { content: "Aucune réservation à confirmer." };
    await db.reservation.update({
      where: { id: next.id },
      data: { confirmedByGuestAt: new Date(), status: ReservationStatus.CONFIRMED },
    });
    return { content: `Venue confirmée pour ${next.reference}.` };
  }

  const owned = await assertOwnership(reference, context.phone);
  if (!owned) return { content: OWNERSHIP_DENIED };

  const found = await findByReference(reference);
  if (!found) return { content: "Réservation introuvable." };
  await db.reservation.update({
    where: { id: found.id },
    data: { confirmedByGuestAt: new Date(), status: ReservationStatus.CONFIRMED },
  });
  return { content: `Venue confirmée pour ${reference}.` };
}

function handOff(input: Record<string, unknown>): ToolOutcome {
  const reason = typeof input.reason === "string" ? input.reason : "inconnu";
  const summary = typeof input.summary === "string" ? input.summary : "";
  return {
    content:
      "Transmis à l'équipe. Dire au client qu'un membre de l'équipe le rappellera, et lui donner le numéro " +
      site.contact.phone +
      ".",
    handOff: { reason, summary },
  };
}

async function getMenuInfo(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const locale = context.locale as Locale;
  const category = typeof input.category === "string" ? input.category : null;

  if (category) {
    const cat = menu.find((c) => c.id === category);
    if (!cat) return { content: "Catégorie inconnue." };
    const items = cat.items
      .map((item) => {
        const price =
          item.price === null ? "prix du jour" : `${item.price} TND`;
        return `- ${item.name[locale]} : ${price}`;
      })
      .join("\n");
    return { content: `${cat.name[locale]}\n${items}` };
  }

  return { content: menuAsText(locale) };
}

async function getReviews(
  input: Record<string, unknown>,
): Promise<ToolOutcome> {
  const minRating = typeof input.min_rating === "number" ? input.min_rating : undefined;

  const where: Record<string, unknown> = { approved: true };
  if (minRating) where.rating = { gte: minRating };

  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      guest: { select: { name: true } },
    },
  });

  if (reviews.length === 0) {
    return { content: "Aucun avis disponible pour le moment." };
  }

  const lines = reviews.map((review) => {
    const name = review.guest.name ?? "Client";
    const title = review.title ? ` — ${review.title}` : "";
    const body = review.body ? `\n   "${review.body}"` : "";
    return `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)} ${name}${title}${body}`;
  });

  return { content: `Avis récents :\n${lines.join("\n")}` };
}

async function getRestaurantInfo(): Promise<ToolOutcome> {
  const hours = site.hours
    .map((entry) => `  ${dayName(entry.day)} : ${entry.open} – ${entry.close}`)
    .join("\n");

  const zones = site.zones
    .map((z) => `- ${z.id} (${z.capacity} places)`)
    .join("\n");

  return {
    content: `${site.name}
Adresse : ${site.address.street}, ${site.address.city} ${site.address.postalCode}
Téléphone : ${site.contact.phone}
Horaires :
${hours}
Zones :
${zones}`,
  };
}

async function suggestAlternatives(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const date = asDate(input.date);
  const partySize = asInt(input.party_size);
  const preferredTime = typeof input.preferred_time === "string" ? input.preferred_time.trim() : null;

  if (!date) return { content: "Date invalide. Format attendu : AAAA-MM-JJ." };
  if (!partySize) return { content: "Nombre de personnes invalide." };
  if (!preferredTime) return { content: "Heure préférée requise, format HH:MM." };

  const match = /^(\d{1,2}):(\d{2})$/.exec(preferredTime);
  if (!match) return { content: "Format d'heure invalide. Attendu : HH:MM." };
  const preferredMinutes = Number(match[1]) * 60 + Number(match[2]);

  const slots = await availability(date, partySize, context.now);
  const free = slots.filter((slot) => slot.available);

  if (free.length === 0) {
    return {
      content: `Aucun créneau libre le ${date} pour ${partySize} personnes. Proposer une autre date.`,
    };
  }

  const closest = [...free]
    .sort((a, b) => Math.abs(a.minutes - preferredMinutes) - Math.abs(b.minutes - preferredMinutes))
    .slice(0, 3)
    .map((slot) => slot.label);

  return {
    content: `Créneaux les plus proches de ${preferredTime} le ${date} pour ${partySize} personnes : ${closest.join(", ")}.`,
  };
}

async function joinWaitlistTool(
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const date = asDate(input.date);
  const partySize = asInt(input.party_size);
  const preferredTime = typeof input.preferred_time === "string" ? input.preferred_time.trim() : null;

  if (!date) return { content: "Date invalide. Format attendu : AAAA-MM-JJ." };
  if (!partySize) return { content: "Nombre de personnes invalide." };
  if (!preferredTime) return { content: "Heure préférée requise, format HH:MM." };

  const match = /^(\d{1,2}):(\d{2})$/.exec(preferredTime);
  if (!match) return { content: "Format d'heure invalide. Attendu : HH:MM." };
  const minutes = Number(match[1]) * 60 + Number(match[2]);

  const result = await joinWaitlist({
    guestId: context.guestId,
    date,
    minutes,
    partySize,
  });

  if (!result.ok) {
    if (result.error === "ALREADY_JOINED") {
      return { content: "Vous êtes déjà inscrit en liste d'attente pour ce créneau. Vous serez notifié quand une table se libère." };
    }
    return { content: "Impossible de s'inscrire en liste d'attente. Réessayer ou contacter l'établissement." };
  }

  return {
    content: `Inscrit en liste d'attente. Position : ${result.position}. Vous recevrez une notification WhatsApp/SMS quand une table se libérera. Répondez OUI pour confirmer quand vous serez notifié.`,
  };
}

async function checkWaitlistStatus(context: ToolContext): Promise<ToolOutcome> {
  const entries = await getWaitlistForGuest(context.guestId);

  if (entries.length === 0) {
    return { content: "Vous n'avez aucune inscription en liste d'attente." };
  }

  const lines = entries.map((entry) => {
    const timeLabel = formatSlot(entry.minutes);
    const statusLabel =
      entry.status === "NOTIFIED"
        ? "✓ Table disponible — réservez !"
        : entry.status === "WAITING"
          ? `Position ${entry.position} en attente`
          : entry.status;
    return `${entry.date} à ${timeLabel} pour ${entry.partySize} personnes : ${statusLabel}`;
  });

  return { content: `Liste d'attente :\n${lines.join("\n")}` };
}

function dayName(day: number): string {
  return [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ][day];
}

// --------------------------------------------------------------------------
// Garde-fous
// --------------------------------------------------------------------------

const OWNERSHIP_DENIED =
  "Aucune réservation à ce numéro ne porte cette référence. Ne rien divulguer : demander au client de vérifier sa référence, ou lui proposer d'appeler l'établissement.";

/**
 * Une référence ne suffit pas : elle doit appartenir au numéro qui écrit.
 * C'est ce qui empêche de deviner « ZL-A2B3 » et de lire — ou d'annuler — la
 * table d'un autre client.
 */
async function assertOwnership(
  reference: string,
  phone: string,
): Promise<boolean> {
  const reservation = await findByReference(reference);
  return reservation?.phone === phone;
}

// --------------------------------------------------------------------------
// Conversions
// --------------------------------------------------------------------------

function asDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function asInt(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function asReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return /^ZL-[A-Z0-9]{4}$/.test(trimmed) ? trimmed : null;
}

function asZone(value: unknown): ZoneId | null {
  return value === "terrasse" || value === "salle" || value === "salon"
    ? value
    : null;
}

/**
 * « 00:30 » un vendredi soir, c'est la fin du service du vendredi, pas le début
 * de celui du samedi. On rattache donc les petites heures à la fenêtre en cours.
 */
function resolveSlot(serviceDate: string, time: unknown): number | null {
  if (typeof time !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  const minutes = hmToMinutes(`${hour}:${minute}`);
  const window = serviceWindow(serviceDate);
  if (!window) return minutes;

  if (minutes < window.open && window.close > 1440) return minutes + 1440;
  return minutes;
}

function explain(error: BookingError): string {
  switch (error.code) {
    case "CLOSED":
      return "Fermé à cette heure-là. Proposer un créneau dans les horaires.";
    case "TOO_SOON":
      return `Trop tard : il faut ${error.minutes} minutes de préavis. Proposer un créneau plus tardif.`;
    case "TOO_FAR":
      return `Les réservations s'ouvrent ${error.days} jours à l'avance.`;
    case "PARTY_TOO_LARGE":
      return `Au-delà de ${error.max} personnes, l'équipe s'en occupe par téléphone : ${site.contact.phone}.`;
    case "FULL":
      return error.alternatives.length
        ? `Créneau complet. Alternatives : ${error.alternatives.join(", ")}.`
        : "Créneau complet, et rien de proche. Proposer une autre date.";
    case "NOT_FOUND":
      return "Référence introuvable.";
    case "ALREADY_CANCELLED":
      return "Cette réservation est déjà annulée ou terminée.";
    case "INVALID_NAME":
      return "Nom manquant ou trop court.";
    case "INVALID_PHONE":
      return "Numéro invalide.";
    case "INVALID_PARTY_SIZE":
      return "Nombre de personnes invalide.";
    case "INVALID_DATE":
      return "Date invalide.";
  }
}

/** Utilisé par les tests et le back-office pour rejouer un contexte d'outil. */
export function contextForNow(partial: Omit<ToolContext, "now">): ToolContext {
  return { ...partial, now: new Date() };
}

export { toISODate };
