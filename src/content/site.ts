/**
 * Source unique de vérité sur l'établissement.
 *
 * Le site ET l'agent IA (WhatsApp / SMS) lisent ce fichier : une modification
 * ici se répercute sur les deux. L'agent ne sait rien que ce fichier ne dise.
 *
 * ⚠️ Les valeurs marquées « À CONFIRMER » sont des espaces réservés. Seuls le
 * nom, la devise, l'adresse et les liens sociaux proviennent du profil public.
 */

export const site = {
  name: "Zanzibar Lounge",
  tagline: "Zanzibar is your happy place",

  address: {
    street: "Avenue de l'Environnement",
    city: "Medjez el Bab",
    postalCode: "9070",
    region: "Gouvernorat de Béja",
    country: "Tunisie",
    // À CONFIRMER : coordonnées relevées à l'échelle de Medjez el Bab.
    // Remplacer par le point exact (clic droit → « Plus / Coordonnées » sur Google Maps).
    lat: 36.6489,
    lng: 9.6103,
  },

  // À CONFIRMER : numéros de l'établissement.
  // Le numéro WhatsApp doit être celui rattaché au compte WhatsApp Business.
  contact: {
    phone: "+216 00 000 000",
    whatsapp: "+216 00 000 000",
    email: "contact@zanzibar.lounge",
  },

  social: {
    instagram: "https://www.instagram.com/zanzibar.lounge/",
    facebook: "https://www.facebook.com/zanzibar.rlc/",
    tripadvisor:
      "https://www.tripadvisor.fr/Restaurant_Review-g1237245-d32836171-Reviews-Zanzibar_Lounge-Medjez_el_Bab_Beja_Governorate.html",
  },

  timezone: "Africa/Tunis",

  /**
   * Horaires d'ouverture. 0 = dimanche … 6 = samedi.
   * `close` peut dépasser 24:00 pour une fermeture après minuit — « 26:00 »
   * signifie 02:00 le lendemain. La logique d'ouverture s'en sert telle quelle.
   *
   * À CONFIRMER : horaires réels.
   */
  hours: [
    { day: 0, open: "08:00", close: "24:00" },
    { day: 1, open: "08:00", close: "24:00" },
    { day: 2, open: "08:00", close: "24:00" },
    { day: 3, open: "08:00", close: "24:00" },
    { day: 4, open: "08:00", close: "24:00" },
    { day: 5, open: "08:00", close: "26:00" },
    { day: 6, open: "08:00", close: "26:00" },
  ] satisfies OpeningHour[],

  /** Jours de fermeture exceptionnelle, au format ISO (AAAA-MM-JJ). */
  closedDates: [] as string[],

  /**
   * Règles de réservation. L'agent IA les applique sans exception.
   * À CONFIRMER : capacité et durée de service réelles.
   */
  booking: {
    /** Pas des créneaux proposés, en minutes. */
    slotMinutes: 30,
    /** Durée pendant laquelle une table reste occupée. */
    turnoverMinutes: 120,
    /** Marge entre la dernière installation et la fermeture. */
    lastSeatingBufferMinutes: 60,
    /** Nombre maximum de couverts par créneau, toutes tables confondues. */
    maxCoversPerSlot: 40,
    /** Taille de groupe au-delà de laquelle il faut appeler l'établissement. */
    maxPartySize: 12,
    /** Délai minimum entre la demande et le créneau réservé. */
    minLeadMinutes: 60,
    /** Horizon maximum de réservation. */
    maxDaysAhead: 60,
  },

  /**
   * Durées de conservation, en jours.
   *
   * On garde les réservations pour l'historique du restaurant, mais pas le
   * contenu des conversations : ce sont des messages personnels, et rien dans
   * l'exploitation ne justifie de les garder un an.
   */
  retention: {
    /** Messages échangés avec l'agent. */
    conversationDays: 180,
    /** Traces de déduplication des webhooks. */
    webhookEventDays: 30,
    /** Réservations passées, purgées avec le client s'il n'en a plus aucune. */
    reservationDays: 730,
  },

  /**
   * Zones de salle. Utilisées pour l'attribution des tables et proposées au
   * client par l'agent. À CONFIRMER : zones et capacités réelles.
   */
  zones: [
    { id: "terrasse", capacity: 24 },
    { id: "salle", capacity: 32 },
    { id: "salon", capacity: 16 },
  ] satisfies Zone[],
} as const;

export type OpeningHour = {
  /** 0 = dimanche … 6 = samedi */
  day: number;
  /** « HH:MM » */
  open: string;
  /** « HH:MM », peut dépasser 24:00 pour une fermeture après minuit */
  close: string;
};

export type Zone = {
  id: "terrasse" | "salle" | "salon";
  capacity: number;
};

export type ZoneId = Zone["id"];
