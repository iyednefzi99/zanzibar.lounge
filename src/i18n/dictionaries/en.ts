import type { Dictionary } from "./fr";

const en: Dictionary = {
  meta: {
    title: "E-Coffee Node — Medjez el Bab",
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
    now: "now",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "E-Coffee is your happy place",
    lead: "A terrace, a short menu, coffee that stands up on its own, and shisha until late. We'll keep a table for you.",
    book: "Book a table",
    bookWhatsapp: "Book on WhatsApp",
    menu: "See the menu",
  },

  about: {
    title: "What we do",
    body: "We open in the morning for coffee and close when the last table leaves. In between: straightforward cooking we stand behind, juice pressed to order, and a terrace on Avenue de l'Environnement where you can sit for three hours without anyone rushing you.",
    covers: "{count} seats",
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
    jumpTo: "Jump to",
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
    periods: {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      late: "Late night",
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
    slotsLoading: "Finding times…",
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
      slotsUnavailable:
        "Times aren't loading right now. Try again, or message us on WhatsApp.",
      tooSoon: "Bookings need at least {minutes} minutes' notice.",
      tooFar: "Bookings open {days} days ahead.",
      partyTooLarge: "For more than {max} guests, call us — we'll arrange it with you.",
      full: "That slot is full. Try {alternatives}.",
      rateLimited: "Too many attempts. Wait a minute.",
    },
  },

  notFound: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    backHome: "Back to home",
  },

  discover: {
    title: "Discover our restaurants",
    description:
      "Find the perfect restaurant near you.",
    search: "Search for a restaurant or cuisine...",
    filters: {
      cuisine: "Cuisine type",
      price: "Budget",
      rating: "Minimum rating",
      openNow: "Open now",
      sort: "Sort by",
    },
    sort: {
      relevance: "Relevance",
      rating: "Highest rated",
      price: "Price",
      distance: "Distance",
      popularity: "Popularity",
      name: "Name A-Z",
      newest: "Newest",
    },
    cards: {
      reviews: "reviews",
      book: "Book",
      open: "Open",
      closed: "Closed",
      featured: "Popular",
    },
    empty: "No restaurants match your criteria.",
    loading: "Searching...",
    pagination: {
      previous: "Previous",
      next: "Next",
    },
  },

  waitlist: {
    title: "Join the waiting list",
    body: "This slot is fully booked for {count} on {date} at {time}. You'll be notified if a table opens up.",
    join: "Join",
    joining: "Joining…",
    cancel: "Cancel",
    close: "Close",
    alreadyJoined: "You're already on the list for this slot.",
    error: "Could not join. Please try again.",
    successTitle: "You're on the list!",
    successBody: "We'll notify you by WhatsApp/SMS when a table opens up.",
    position: "Position in queue: {position}",
    notificationHint: "You'll have 15 minutes to confirm after notification.",
    badgeWaiting: "Position {position}",
    badgeNotified: "Table available",
    badgeBooked: "Booked via waitlist",
  },

  footer: {
    tagline: "E-Coffee is your happy place",
    follow: "Follow",
    rights: "All rights reserved.",
  },

  reviews: {
    title: "What our guests say",
    lead: "Read what our guests think about their experience at E-Coffee Node.",
    formTitle: "Leave a review",
    titleField: "Title",
    rating: "Rating",
    comment: "Comment",
    submit: "Submit",
    success: "Thank you! Your review will appear after moderation.",
    error: "Something went wrong. Please try again.",
    namePlaceholder: "Your name",
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
