const fr = {
  meta: {
    title: "Zanzibar Lounge — Medjez el Bab",
    description:
      "Café, cuisine et chicha à Medjez el Bab. Terrasse ouverte du matin à tard le soir. Réservez une table par WhatsApp, SMS ou en ligne.",
  },

  nav: {
    menu: "La carte",
    gallery: "Galerie",
    info: "Nous trouver",
    book: "Réserver",
    language: "Langue",
    skipToContent: "Aller au contenu",
  },

  status: {
    openUntil: "Ouvert jusqu'à {time}",
    opensAt: "Ouvre à {time}",
    opensDay: "Ouvre {day} à {time}",
    closedToday: "Fermé aujourd'hui",
    now: "maintenant",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "Zanzibar is your happy place",
    lead: "Une terrasse, une carte courte, du café qui tient debout et de la chicha jusque tard. On garde une table pour vous.",
    book: "Réserver une table",
    bookWhatsapp: "Réserver sur WhatsApp",
    menu: "Voir la carte",
  },

  about: {
    title: "Ce qu'on fait",
    body: "On ouvre le matin pour le café et on ferme quand la dernière table s'en va. Entre les deux : une cuisine simple qu'on assume, des jus pressés à la commande, et une terrasse sur l'avenue de l'Environnement où l'on peut rester trois heures sans que personne ne vous presse.",
    covers: "{count} couverts",
    zones: {
      title: "Trois façons de s'installer",
      terrasse: {
        name: "La terrasse",
        body: "Sur l'avenue, à l'ombre. Le service chicha s'y fait toute la journée.",
      },
      salle: {
        name: "La salle",
        body: "Au calme et à l'abri. C'est là qu'on installe les grandes tablées.",
      },
      salon: {
        name: "Le salon",
        body: "Assises basses, lumière tamisée. Pour rester longtemps.",
      },
    },
  },

  menu: {
    title: "La carte",
    lead: "Prix en dinars, service compris.",
    priceOfDay: "Prix du jour",
    jumpTo: "Aller à",
    tags: {
      vegetarien: "Végétarien",
      epice: "Épicé",
      signature: "Signature",
      "sans-alcool": "Sans alcool",
    },
  },

  gallery: {
    title: "En images",
    lead: "Les photos viennent du compte Instagram de l'établissement.",
    instagram: "Suivre sur Instagram",
  },

  info: {
    title: "Nous trouver",
    address: "Adresse",
    hours: "Horaires",
    contact: "Contact",
    directions: "Ouvrir dans Maps",
    phone: "Téléphone",
    whatsapp: "WhatsApp",
    closed: "Fermé",
    today: "Aujourd'hui",
    reviews: "Lire les avis TripAdvisor",
  },

  booking: {
    title: "Réserver une table",
    lead: "Trois lignes, et c'est réservé. Vous recevez la confirmation par WhatsApp ou SMS — puis un rappel la veille.",
    orChat:
      "Vous préférez écrire ? Notre agent répond sur WhatsApp et par SMS, 24h/24.",
    fields: {
      name: "Nom",
      phone: "Téléphone",
      phoneHint: "Format international, par exemple +216 20 123 456",
      date: "Date",
      time: "Heure",
      partySize: "Nombre de personnes",
      zone: "Où souhaitez-vous être installé ?",
      zoneAny: "Peu importe",
      notes: "Une précision ? (anniversaire, poussette, allergie…)",
      notesPlaceholder: "Facultatif",
    },
    zones: {
      terrasse: "Terrasse",
      salle: "Salle",
      salon: "Salon",
    },
    periods: {
      morning: "Le matin",
      afternoon: "L'après-midi",
      evening: "Le soir",
      late: "Tard le soir",
    },
    otp: {
      label: "Code de vérification",
      hint: "Nous vous envoyons un code à six chiffres pour confirmer votre numéro.",
      send: "Recevoir le code",
      sending: "Envoi…",
      sent: "Code envoyé. Il est valable dix minutes.",
      resend: "Renvoyer",
      missing: "Saisissez le code reçu.",
      invalid: "Code incorrect.",
      expired: "Code expiré. Demandez-en un nouveau.",
      tooMany: "Trop d'essais. Demandez un nouveau code.",
      failed: "L'envoi du code a échoué. Réessayez dans un instant.",
    },
    slotsLoading: "Recherche des créneaux…",
    submit: "Réserver",
    submitting: "Envoi…",
    success: {
      title: "C'est noté",
      body: "Votre table du {date} à {time} pour {count} est réservée. Une confirmation part sur {phone}.",
      again: "Faire une autre réservation",
    },
    errors: {
      generic: "La réservation n'est pas passée. Réessayez ou appelez-nous.",
      name: "Indiquez le nom qui figurera sur la réservation.",
      phone: "Numéro invalide. Utilisez le format international, ex. +21620123456.",
      date: "Choisissez une date.",
      time: "Choisissez une heure.",
      partySize: "Indiquez le nombre de personnes.",
      closed: "L'établissement est fermé à cette heure-là.",
      slotsUnavailable:
        "Les créneaux ne s'affichent pas pour l'instant. Réessayez, ou écrivez-nous sur WhatsApp.",
      tooSoon: "Il faut réserver au moins {minutes} minutes à l'avance.",
      tooFar: "Les réservations s'ouvrent {days} jours à l'avance.",
      partyTooLarge:
        "Au-delà de {max} personnes, appelez-nous : on organise ça avec vous.",
      full: "Ce créneau est complet. Essayez {alternatives}.",
      rateLimited: "Trop de tentatives. Patientez une minute.",
    },
  },

  footer: {
    tagline: "Zanzibar is your happy place",
    follow: "Suivre",
    rights: "Tous droits réservés.",
  },

  reviews: {
    title: "Avis de nos clients",
    lead: "Ce que nos clients disent de leur expérience au Zanzibar Lounge.",
    formTitle: "Laisser un avis",
    titleField: "Titre",
    rating: "Note",
    comment: "Commentaire",
    submit: "Envoyer",
    success: "Merci ! Votre avis sera visible après modération.",
    error: "Une erreur est survenue. Réessayez.",
    namePlaceholder: "Votre nom",
  },

  days: {
    long: [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ],
    short: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
  },
} as const;

export default fr;

/**
 * Le français fixe la forme du dictionnaire ; les autres langues doivent la
 * respecter clé pour clé. `Widen` élargit les littéraux du français en `string`
 * pour que « Réserver » et « Book » soient tous deux valides.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof fr>;
