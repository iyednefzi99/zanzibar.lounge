import type { Dictionary } from "./fr";

const en: Dictionary = {
  meta: {
    title: "Zanzibar Lounge — Medjez el Bab",
    description:
      "Coffee, food and shisha in Medjez el Bab. Terrace open from morning until late. Book a table on WhatsApp, by SMS or online.",
  },

  nav: {
    menu: "Menu",
    gallery: "Gallery",
    info: "Find us",
    book: "Book",
    language: "Language",
    skipToContent: "Skip to content",
  },

  status: {
    openUntil: "Open until {time}",
    opensAt: "Opens at {time}",
    opensDay: "Opens {day} at {time}",
    closedToday: "Closed today",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "Zanzibar is your happy place",
    lead: "A terrace, a short menu, coffee that stands up on its own, and shisha until late. We'll keep a table for you.",
    book: "Book a table",
    bookWhatsapp: "Book on WhatsApp",
    menu: "See the menu",
  },

  about: {
    title: "What we do",
    body: "We open in the morning for coffee and close when the last table leaves. In between: straightforward cooking we stand behind, juice pressed to order, and a terrace on Avenue de l'Environnement where you can sit for three hours without anyone rushing you.",
    zones: {
      title: "Three ways to sit",
      terrasse: {
        name: "The terrace",
        body: "On the avenue, in the shade. Shisha is served here all day.",
      },
      salle: {
        name: "The dining room",
        body: "Quiet and sheltered. This is where large parties go.",
      },
      salon: {
        name: "The lounge",
        body: "Low seating, dim light. For staying a while.",
      },
    },
  },

  menu: {
    title: "Menu",
    lead: "Prices in Tunisian dinars, service included.",
    priceOfDay: "Market price",
    tags: {
      vegetarien: "Vegetarian",
      epice: "Spicy",
      signature: "Signature",
      "sans-alcool": "Alcohol-free",
    },
  },

  gallery: {
    title: "In pictures",
    lead: "Photographs come from the venue's Instagram account.",
    instagram: "Follow on Instagram",
  },

  info: {
    title: "Find us",
    address: "Address",
    hours: "Opening hours",
    contact: "Contact",
    directions: "Open in Maps",
    phone: "Phone",
    whatsapp: "WhatsApp",
    closed: "Closed",
    today: "Today",
    reviews: "Read TripAdvisor reviews",
  },

  booking: {
    title: "Book a table",
    lead: "Three lines and it's booked. You'll get confirmation by WhatsApp or SMS, then a reminder the day before.",
    orChat:
      "Rather write to us? Our agent answers on WhatsApp and by SMS, around the clock.",
    fields: {
      name: "Name",
      phone: "Phone",
      phoneHint: "International format, for example +216 20 123 456",
      date: "Date",
      time: "Time",
      partySize: "Number of guests",
      zone: "Where would you like to sit?",
      zoneAny: "No preference",
      notes: "Anything we should know? (birthday, pushchair, allergy…)",
      notesPlaceholder: "Optional",
    },
    zones: {
      terrasse: "Terrace",
      salle: "Dining room",
      salon: "Lounge",
    },
    otp: {
      label: "Verification code",
      hint: "We'll send a six-digit code to confirm your number.",
      send: "Send the code",
      sending: "Sending…",
      sent: "Code sent. It's valid for ten minutes.",
      resend: "Resend",
      missing: "Enter the code you received.",
      invalid: "Wrong code.",
      expired: "Code expired. Ask for a new one.",
      tooMany: "Too many attempts. Ask for a new code.",
      failed: "Couldn't send the code. Try again in a moment.",
    },
    submit: "Book",
    submitting: "Sending…",
    success: {
      title: "You're booked",
      body: "Your table on {date} at {time} for {count} is confirmed. We're sending confirmation to {phone}.",
      again: "Make another booking",
    },
    errors: {
      generic: "The booking didn't go through. Try again or give us a call.",
      name: "Tell us the name for the booking.",
      phone: "Invalid number. Use international format, e.g. +21620123456.",
      date: "Pick a date.",
      time: "Pick a time.",
      partySize: "Tell us how many people.",
      closed: "We're closed at that time.",
      tooSoon: "Bookings need at least {minutes} minutes' notice.",
      tooFar: "Bookings open {days} days ahead.",
      partyTooLarge: "For more than {max} guests, call us — we'll arrange it with you.",
      full: "That slot is full. Try {alternatives}.",
      rateLimited: "Too many attempts. Wait a minute.",
    },
  },

  footer: {
    tagline: "Zanzibar is your happy place",
    follow: "Follow",
    rights: "All rights reserved.",
  },

  days: {
    long: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
};

export default en;
