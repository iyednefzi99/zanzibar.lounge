import type { Dictionary } from "./fr";

const es: Dictionary = {
  meta: {
    title: "E-Coffee Node — Medjez el Bab",
    description:
      "Café, cocina y cachimba en Medjez el Bab. Terraza abierta desde la mañana hasta tarde. Reserva una mesa por WhatsApp, SMS o en línea.",
  },

  nav: {
    menu: "Carta",
    gallery: "Galería",
    info: "Encontrarnos",
    book: "Reservar",
    language: "Idioma",
    skipToContent: "Saltar al contenido",
  },

  status: {
    openUntil: "Abierto hasta {time}",
    opensAt: "Abre a las {time}",
    opensDay: "Abre {day} a las {time}",
    closedToday: "Cerrado hoy",
    now: "ahora",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "E-Coffee es tu lugar feliz",
    lead: "Una terraza, una carta corta, café de verdad y cachimba hasta tarde. Guardamos una mesa para ti.",
    book: "Reservar una mesa",
    bookWhatsapp: "Reservar por WhatsApp",
    menu: "Ver la carta",
  },

  about: {
    title: "Lo que hacemos",
    body: "Abrimos por la mañana para el café y cerramos cuando se va la última mesa. Entre tanto: una cocina sencilla que asumimos, zumos recién exprimidos, y una terraza en la Avenida de l'Environnement donde puedes sentarte tres horas sin que nadie te apresure.",
    covers: "{count} comensales",
    zones: {
      title: "Tres formas de sentarse",
      terrasse: {
        name: "La terraza",
        body: "En la avenida, a la sombra. La cachimba se sirve aquí todo el día.",
      },
      salle: {
        name: "El comedor",
        body: "Tranquilo y resguardado. Aquí van los grupos grandes.",
      },
      salon: {
        name: "El salón",
        body: "Asientos bajos, luz tenue. Para quedarse un rato.",
      },
    },
  },

  menu: {
    title: "Carta",
    lead: "Precios en dinars tunecinos, servicio incluido.",
    priceOfDay: "Precio del día",
    jumpTo: "Ir a",
    tags: {
      vegetarien: "Vegetariano",
      epice: "Picante",
      signature: "De la casa",
      "sans-alcool": "Sin alcohol",
    },
  },

  gallery: {
    title: "En imágenes",
    lead: "Las fotos provienen del Instagram del establecimiento.",
    instagram: "Seguir en Instagram",
  },

  info: {
    title: "Encontrarnos",
    address: "Dirección",
    hours: "Horario",
    contact: "Contacto",
    directions: "Abrir en Maps",
    phone: "Teléfono",
    whatsapp: "WhatsApp",
    closed: "Cerrado",
    today: "Hoy",
    reviews: "Leer reseñas de TripAdvisor",
  },

  booking: {
    title: "Reservar una mesa",
    lead: "Tres líneas y está reservado. Recibirás la confirmación por WhatsApp o SMS — y un recordatorio el día anterior.",
    orChat:
      "¿Prefieres escribir? Nuestro agente responde por WhatsApp y por SMS, las 24 horas.",
    fields: {
      name: "Nombre",
      phone: "Teléfono",
      phoneHint: "Formato internacional, por ejemplo +216 20 123 456",
      date: "Fecha",
      time: "Hora",
      partySize: "Número de personas",
      zone: "¿Dónde te gustaría sentarte?",
      zoneAny: "Me da igual",
      notes: "¿Alguna indicación? (cumpleaños, cochecito, alergia…)",
      notesPlaceholder: "Opcional",
    },
    zones: {
      terrasse: "Terraza",
      salle: "Comedor",
      salon: "Salón",
    },
    periods: {
      morning: "Por la mañana",
      afternoon: "Por la tarde",
      evening: "Por la noche",
      late: "Alta noche",
    },
    otp: {
      label: "Código de verificación",
      hint: "Te enviaremos un código de seis dígitos para confirmar tu número.",
      send: "Enviar el código",
      sending: "Enviando…",
      sent: "Código enviado. Válido durante diez minutos.",
      resend: "Reenviar",
      missing: "Introduce el código recibido.",
      invalid: "Código incorrecto.",
      expired: "Código caducado. Solicita uno nuevo.",
      tooMany: "Demasiados intentos. Solicita un código nuevo.",
      failed: "No se pudo enviar el código. Inténtalo en un momento.",
    },
    slotsLoading: "Buscando horarios…",
    submit: "Reservar",
    submitting: "Enviando…",
    success: {
      title: "Reservado",
      body: "Tu mesa el {date} a las {time} para {count} personas está reservada. Enviamos la confirmación a {phone}.",
      again: "Hacer otra reserva",
    },
    errors: {
      generic: "La reserva no se ha completado. Inténtalo de nuevo o llámanos.",
      name: "Indica el nombre que figurará en la reserva.",
      phone: "Número no válido. Usa el formato internacional, ej. +21620123456.",
      date: "Elige una fecha.",
      time: "Elige una hora.",
      partySize: "Indica el número de personas.",
      closed: "El establecimiento está cerrado a esa hora.",
      slotsUnavailable:
        "Los horarios no se muestran ahora mismo. Inténtalo de nuevo, o escríbenos por WhatsApp.",
      tooSoon: "Hay que reservar al menos {minutes} minutos antes.",
      tooFar: "Las reservas se abren {days} días antes.",
      partyTooLarge:
        "Para más de {max} personas, llámanos — lo organizamos contigo.",
      full: "Ese turno está completo. Prueba {alternatives}.",
      rateLimited: "Demasiados intentos. Espera un minuto.",
    },
  },

  notFound: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o ha sido trasladada.",
    backHome: "Volver al inicio",
  },

  discover: {
    title: "Descubre nuestros restaurantes",
    description: "Encuentra el restaurante perfecto cerca de ti.",
    search: "Buscar restaurante o cocina...",
    filters: { cuisine: "Tipo de cocina", price: "Presupuesto", rating: "Calificación mínima", openNow: "Abierto ahora", sort: "Ordenar por" },
    sort: { relevance: "Relevancia", rating: "Mejor valorados", price: "Precio", distance: "Distancia", popularity: "Popularidad", name: "Nombre A-Z", newest: "Más reciente" },
    cards: { reviews: "reseñas", book: "Reservar", open: "Abierto", closed: "Cerrado", featured: "Popular" },
    empty: "Ningún restaurante coincide con tus criterios.",
    loading: "Buscando...",
    pagination: { previous: "Anterior", next: "Siguiente" },
  },

  footer: {
    tagline: "E-Coffee es tu lugar feliz",
    follow: "Seguir",
    rights: "Todos los derechos reservados.",
  },

  reviews: {
    title: "Lo que dicen nuestros clientes",
    lead: "Lee lo que nuestros clientes opinan sobre su experiencia en E-Coffee Node.",
    formTitle: "Dejar una reseña",
    titleField: "Título",
    rating: "Puntuación",
    comment: "Comentario",
    submit: "Enviar",
    success: "¡Gracias! Tu reseña será visible tras su moderación.",
    error: "Ha ocurrido un error. Inténtalo de nuevo.",
    namePlaceholder: "Tu nombre",
  },

  days: {
    long: [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ],
    short: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  },
};

export default es;
