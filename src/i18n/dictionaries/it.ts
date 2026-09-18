import type { Dictionary } from "./fr";

const it: Dictionary = {
  meta: {
    title: "E-Coffee Node — Medjez el Bab",
    description:
      "Caffè, cucina e narghilè a Medjez el Bab. Terrazza aperta dalla mattina fino a tardi. Prenota un tavolo via WhatsApp, SMS o online.",
  },

  nav: {
    menu: "Menu",
    gallery: "Galleria",
    info: "Dove siamo",
    book: "Prenota",
    language: "Lingua",
    skipToContent: "Vai al contenuto",
  },

  status: {
    openUntil: "Aperto fino alle {time}",
    opensAt: "Apre alle {time}",
    opensDay: "Apre {day} alle {time}",
    closedToday: "Chiuso oggi",
    now: "adesso",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "E-Coffee è il tuo posto felice",
    lead: "Una terrazza, un menu corto, un caffè che regge, e narghilè fino a tardi. Teniamo un tavolo per te.",
    book: "Prenota un tavolo",
    bookWhatsapp: "Prenota su WhatsApp",
    menu: "Vedi il menu",
  },

  about: {
    title: "Cosa facciamo",
    body: "Apriamo la mattina per il caffè e chiudiamo quando se ne va l'ultimo tavolo. In mezzo: una cucina semplice che rivendiamo, succhi spremuti al momento, e una terrazza sull'Avenue de l'Environnement dove puoi stare tre ore senza che nessuno ti加快.",
    covers: "{count} coperti",
    zones: {
      title: "Tre modi per sedersi",
      terrasse: {
        name: "La terrazza",
        body: "Sulla via, all'ombra. Il narghilè viene servito qui tutto il giorno.",
      },
      salle: {
        name: "La sala",
        body: "Tranquilla e riparata. È dove si siedono i grandi gruppi.",
      },
      salon: {
        name: "Il salotto",
        body: "Sedute basse, luce soffusa. Per restare a lungo.",
      },
    },
  },

  menu: {
    title: "Menu",
    lead: "Prezzi in dinari tunisini, servizio incluso.",
    priceOfDay: "Prezzo del giorno",
    jumpTo: "Vai a",
    tags: {
      vegetarien: "Vegetariano",
      epice: "Piccante",
      signature: "Della casa",
      "sans-alcool": "Senza alcol",
    },
  },

  gallery: {
    title: "In immagini",
    lead: "Le foto provengono dall'Instagram della struttura.",
    instagram: "Segui su Instagram",
  },

  info: {
    title: "Dove siamo",
    address: "Indirizzo",
    hours: "Orari",
    contact: "Contatti",
    directions: "Apri in Maps",
    phone: "Telefono",
    whatsapp: "WhatsApp",
    closed: "Chiuso",
    today: "Oggi",
    reviews: "Leggi le recensioni TripAdvisor",
  },

  booking: {
    title: "Prenota un tavolo",
    lead: "Tre righe ed è prenotato. Riceverai la conferma via WhatsApp o SMS — e un promemria il giorno prima.",
    orChat:
      "Preferisci scrivere? Il nostro agente risponde su WhatsApp e via SMS, 24 ore su 24.",
    fields: {
      name: "Nome",
      phone: "Telefono",
      phoneHint: "Formato internazionale, ad esempio +216 20 123 456",
      date: "Data",
      time: "Ora",
      partySize: "Numero di persone",
      zone: "Dove vorresti sederti?",
      zoneAny: "Non importa",
      notes: "Qualche nota? (compleanno, passeggino, allergia…)",
      notesPlaceholder: "Facoltativo",
    },
    zones: {
      terrasse: "Terrazza",
      salle: "Sala",
      salon: "Salotto",
    },
    periods: {
      morning: "La mattina",
      afternoon: "Il pomeriggio",
      evening: "La sera",
      late: "Tardi nella sera",
    },
    otp: {
      label: "Codice di verifica",
      hint: "Ti invieremo un codice a sei cifre per confermare il tuo numero.",
      send: "Invia il codice",
      sending: "Invio in corso…",
      sent: "Codice inviato. Valido per dieci minuti.",
      resend: "Reinvia",
      missing: "Inserisci il codice ricevuto.",
      invalid: "Codice sbagliato.",
      expired: "Codice scaduto. Richiedine uno nuovo.",
      tooMany: "Troppi tentativi. Richiedi un nuovo codice.",
      failed: "Impossibile inviare il codice. Riprova tra un momento.",
    },
    slotsLoading: "Ricerca orari…",
    submit: "Prenota",
    submitting: "Invio in corso…",
    success: {
      title: "Prenotato",
      body: "Il tuo tavolo il {date} alle {time} per {count} persone è prenotato. Inviamo la conferma a {phone}.",
      again: "Effettua un'altra prenotazione",
    },
    errors: {
      generic: "La prenotazione non è andata a buon fine. Riprova o chiamaci.",
      name: "Indica il nome che apparirà sulla prenotazione.",
      phone: "Numero non valido. Usa il formato internazionale, es. +21620123456.",
      date: "Scegli una data.",
      time: "Scegli un orario.",
      partySize: "Indica il numero di persone.",
      closed: "La struttura è chiusa a quell'ora.",
      slotsUnavailable:
        "Gli orari non si stanno caricando. Riprova, o scrivici su WhatsApp.",
      tooSoon: "Le prenotazioni richiedono almeno {minutes} minuti di preavviso.",
      tooFar: "Le prenotazioni si aprono {days} giorni prima.",
      partyTooLarge:
        "Per più di {max} persone, chiamaci — organizziamo con te.",
      full: "Quello slot è completo. Prova {alternatives}.",
      rateLimited: "Troppi tentativi. Aspetta un minuto.",
    },
  },

  notFound: {
    title: "Pagina non trovata",
    description: "La pagina che cerchi non esiste o è stata spostata.",
    backHome: "Torna alla home",
  },

  discover: {
    title: "Scopri i nostri ristoranti",
    description: "Trova il ristorante perfetto vicino a te.",
    search: "Cerca ristorante o cucina...",
    filters: { cuisine: "Tipo di cucina", price: "Budget", rating: "Valutazione minima", openNow: "Aperto ora", sort: "Ordina per" },
    sort: { relevance: "Rilevanza", rating: "Più votati", price: "Prezzo", distance: "Distanza", popularity: "Popolarità", name: "Nome A-Z", newest: "Più recente" },
    cards: { reviews: "recensioni", book: "Prenota", open: "Aperto", closed: "Chiuso", featured: "Popolare" },
    empty: "Nessun ristorante corrisponde ai tuoi criteri.",
    loading: "Ricerca in corso...",
    pagination: { previous: "Precedente", next: "Successivo" },
  },

  waitlist: {
    title: "Unisciti alla lista d'attesa",
    body: "Questo slot è completo per {count} persona/e il {date} alle {time}. Riceverai una notifica quando un tavolo si libera.",
    join: "Unisciti",
    joining: "Unione in corso…",
    cancel: "Annulla",
    close: "Chiudi",
    alreadyJoined: "Sei già iscritto per questo slot.",
    error: "Impossibile unirsi. Riprova.",
    successTitle: "Iscritto!",
    successBody: "Riceverai una notifica via WhatsApp/SMS quando un tavolo si libererà.",
    position: "Posizione nella coda: {position}",
    notificationHint: "Avrai 15 minuti per confermare dopo la notifica.",
    badgeWaiting: "Posizione {position}",
    badgeNotified: "Tavolo disponibile",
    badgeBooked: "Prenotato via lista d'attesa",
  },

  footer: {
    tagline: "E-Coffee è il tuo posto felice",
    follow: "Segui",
    rights: "Tutti i diritti riservati.",
  },

  reviews: {
    title: "Cosa dicono i nostri ospiti",
    lead: "Leggi cosa pensano i nostri ospiti della loro esperienza allo E-Coffee Node.",
    formTitle: "Lascia una recensione",
    titleField: "Titolo",
    rating: "Voto",
    comment: "Commento",
    submit: "Invia",
    success: "Grazie! La tua recensione sarà visibile dopo la moderazione.",
    error: "Si è verificato un errore. Riprova.",
    namePlaceholder: "Il tuo nome",
  },

  days: {
    long: [
      "domenica",
      "lunedì",
      "martedì",
      "mercoledì",
      "giovedì",
      "venerdì",
      "sabato",
    ],
    short: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"],
  },
};

export default it;
