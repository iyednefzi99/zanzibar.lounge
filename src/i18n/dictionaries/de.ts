import type { Dictionary } from "./fr";

const de: Dictionary = {
  meta: {
    title: "E-Coffee Node — Medjez el Bab",
    description:
      "Kaffee, Küche und Shisha in Medjez el Bab. Terrasse von morgens bis spät abends geöffnet. Reservieren Sie einen Tisch per WhatsApp, SMS oder online.",
  },

  nav: {
    menu: "Speisekarte",
    gallery: "Galerie",
    info: "So finden Sie uns",
    book: "Reservieren",
    language: "Sprache",
    skipToContent: "Zum Inhalt springen",
  },

  status: {
    openUntil: "Geöffnet bis {time}",
    opensAt: "Öffnet um {time}",
    opensDay: "Öffnet {day} um {time}",
    closedToday: "Heute geschlossen",
    now: "jetzt",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "E-Coffee ist Ihr glücklicher Ort",
    lead: "Eine Terrasse, eine kurze Speisekarte, Kaffee der hält, und Shisha bis spät. Wir bewahren Ihnen einen Tisch auf.",
    book: "Tisch reservieren",
    bookWhatsapp: "Per WhatsApp reservieren",
    menu: "Speisekarte ansehen",
  },

  about: {
    title: "Was wir tun",
    body: "Wir öffnen morgens für Kaffee und schließen, wenn der letzte Tisch geht. Dazwischen: ehrliche Küche, frisch gepresste Säfte, und eine Terrasse an der Avenue de l'Environnement, wo man drei Stunden sitzen kann, ohne dass jemand einen drängt.",
    covers: "{count} Plätze",
    zones: {
      title: "Drei Möglichkeiten zum Sitzen",
      terrasse: {
        name: "Die Terrasse",
        body: "An der Avenue, im Schatten. Shisha wird den ganzen Tag hier serviert.",
      },
      salle: {
        name: "Das Speisezimmer",
        body: "Ruhig und geschützt. Hier sitzen die großen Gruppen.",
      },
      salon: {
        name: "Der Lounge",
        body: "Niedrige Sitze, gedämpftes Licht. Für längere Aufenthalte.",
      },
    },
  },

  menu: {
    title: "Speisekarte",
    lead: "Preise in Tunesischen Dinars, Bedienung inklusive.",
    priceOfDay: "Tagespreis",
    jumpTo: "Springen zu",
    tags: {
      vegetarien: "Vegetarisch",
      epice: "Scharf",
      signature: "Spezialität",
      "sans-alcool": "Alkoholfrei",
    },
  },

  gallery: {
    title: "In Bildern",
    lead: "Die Fotos stammen vom Instagram-Account des Lokals.",
    instagram: "Auf Instagram folgen",
  },

  info: {
    title: "So finden Sie uns",
    address: "Adresse",
    hours: "Öffnungszeiten",
    contact: "Kontakt",
    directions: "In Maps öffnen",
    phone: "Telefon",
    whatsapp: "WhatsApp",
    closed: "Geschlossen",
    today: "Heute",
    reviews: "TripAdvisor-Bewertungen lesen",
  },

  booking: {
    title: "Tisch reservieren",
    lead: "Drei Zeilen und es ist reserviert. Sie erhalten die Bestätigung per WhatsApp oder SMS — und am Tag vorher eine Erinnerung.",
    orChat:
      "Schreiben Sie lieber? Unser Agent antwortet auf WhatsApp und per SMS, rund um die Uhr.",
    fields: {
      name: "Name",
      phone: "Telefon",
      phoneHint: "Internationales Format, z.B. +216 20 123 456",
      date: "Datum",
      time: "Uhrzeit",
      partySize: "Anzahl der Gäste",
      zone: "Wo möchten Sie sitzen?",
      zoneAny: "Egal",
      notes: "Hinweis? (Geburtstag, Kinderwagen, Allergie…)",
      notesPlaceholder: "Optional",
    },
    zones: {
      terrasse: "Terrasse",
      salle: "Speisezimmer",
      salon: "Lounge",
    },
    periods: {
      morning: "Vormittag",
      afternoon: "Nachmittag",
      evening: "Abend",
      late: "Spät abends",
    },
    otp: {
      label: "Bestätigungscode",
      hint: "Wir senden Ihnen einen sechsstelligen Code zur Bestätigung Ihrer Nummer.",
      send: "Code senden",
      sending: "Wird gesendet…",
      sent: "Code gesendet. Gültig für zehn Minuten.",
      resend: "Erneut senden",
      missing: "Geben Sie den erhaltenen Code ein.",
      invalid: "Falscher Code.",
      expired: "Code abgelaufen. Fordern Sie einen neuen an.",
      tooMany: "Zu viele Versuche. Fordern Sie einen neuen Code an.",
      failed: "Code konnte nicht gesendet werden. Versuchen Sie es gleich nochmal.",
    },
    slotsLoading: "Zeiten werden gesucht…",
    submit: "Reservieren",
    submitting: "Wird gesendet…",
    success: {
      title: "Reserviert",
      body: "Ihr Tisch am {date} um {time} für {count} Personen ist reserviert. Eine Bestätigung geht an {phone}.",
      again: "Weitere Reservierung",
    },
    errors: {
      generic: "Die Reservierung ist nicht durchgegangen. Versuchen Sie es erneut oder rufen Sie uns an.",
      name: "Geben Sie den Namen für die Reservierung an.",
      phone: "Ungültige Nummer. Verwenden Sie das internationale Format, z.B. +21620123456.",
      date: "Wählen Sie ein Datum.",
      time: "Wählen Sie eine Uhrzeit.",
      partySize: "Geben Sie die Anzahl der Gäste an.",
      closed: "Das Lokal ist zu dieser Zeit geschlossen.",
      slotsUnavailable:
        "Die Zeiten werden gerade nicht angezeigt. Versuchen Sie es erneut, oder schreiben Sie uns auf WhatsApp.",
      tooSoon: "Reservierungen benötigen mindestens {minutes} Minuten Vorlauf.",
      tooFar: "Reservierungen öffnen {days} Tage im Voraus.",
      partyTooLarge:
        "Für mehr als {max} Gäste rufen Sie uns an — wir organisieren das mit Ihnen.",
      full: "Dieser Termin ist voll. Versuchen Sie {alternatives}.",
      rateLimited: "Zu viele Versuche. Warten Sie eine Minute.",
    },
  },

  notFound: {
    title: "Seite nicht gefunden",
    description: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    backHome: "Zurück zur Startseite",
  },

  discover: {
    title: "Entdecken Sie unsere Restaurants",
    description: "Finden Sie das perfekte Restaurant in Ihrer Nähe.",
    search: "Restaurant oder Küche suchen...",
    filters: { cuisine: "Küche", price: "Budget", rating: "Mindestbewertung", openNow: "Jetzt geöffnet", sort: "Sortieren nach" },
    sort: { relevance: "Relevanz", rating: "Beste Bewertung", price: "Preis", distance: "Entfernung", popularity: "Beliebtheit", name: "Name A-Z", newest: "Neueste" },
    cards: { reviews: "Bewertungen", book: "Buchen", open: "Geöffnet", closed: "Geschlossen", featured: "Beliebt" },
    empty: "Keine Restaurants entsprechen Ihren Kriterien.",
    loading: "Suche läuft...",
    pagination: { previous: "Zurück", next: "Weiter" },
  },

  waitlist: {
    title: "Der Warteliste beitreten",
    body: "Dieser Termin ist voll für {count} Person(en) am {date} um {time}. Sie werden benachrichtigt, wenn ein Tisch frei wird.",
    join: "Beitreten",
    joining: "Beitritt läuft…",
    cancel: "Abbrechen",
    close: "Schließen",
    alreadyJoined: "Sie sind bereits für diesen Termin auf der Warteliste.",
    error: "Beitritt nicht möglich. Versuchen Sie es erneut.",
    successTitle: "Beigetreten!",
    successBody: "Sie werden per WhatsApp/SMS benachrichtigt, wenn ein Tisch frei wird.",
    position: "Position in der Schlange: {position}",
    notificationHint: "Sie haben 15 Minuten Zeit zu bestätigen, nach der Benachrichtigung.",
    badgeWaiting: "Position {position}",
    badgeNotified: "Tisch verfügbar",
    badgeBooked: "Über Warteliste gebucht",
  },

  footer: {
    tagline: "E-Coffee ist Ihr glücklicher Ort",
    follow: "Folgen",
    rights: "Alle Rechte vorbehalten.",
  },

  reviews: {
    title: "Was unsere Gäste sagen",
    lead: "Lesen Sie, was unsere Gäste über ihren Besuch im E-Coffee Node denken.",
    formTitle: "Bewertung abgeben",
    titleField: "Titel",
    rating: "Bewertung",
    comment: "Kommentar",
    submit: "Absenden",
    success: "Danke! Ihre Bewertung erscheint nach Prüfung.",
    error: "Etwas ist schiefgelaufen. Versuchen Sie es erneut.",
    namePlaceholder: "Ihr Name",
  },

  days: {
    long: [
      "Sonntag",
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
    ],
    short: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  },
};

export default de;
