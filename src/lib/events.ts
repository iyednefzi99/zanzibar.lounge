import { db } from "@/lib/db";

/**
 * Gestion des événements du restaurant.
 *
 * - Création / publication d'événements
 * - Réservation de places
 * - Vérification de disponibilité
 */

export type EventData = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  capacity: number;
  price: number;
  imageUrl: string | null;
  status: "draft" | "published" | "full";
  spotsLeft: number;
  createdAt: Date;
};

export type EventBookingData = {
  id: string;
  eventId: string;
  guestId: string;
  quantity: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
};

// --- Création ---

export async function createEvent(
  restaurantId: string,
  data: {
    title: string;
    description?: string;
    date: string;
    startTime: string;
    capacity: number;
    price?: number;
    imageUrl?: string;
  },
): Promise<EventData> {
  const event = await db.event.create({
    data: {
      restaurantId,
      title: data.title,
      description: data.description ?? null,
      date: data.date,
      startTime: data.startTime,
      capacity: data.capacity,
      price: data.price ?? 0,
      imageUrl: data.imageUrl ?? null,
    },
  });

  return toEventData(event, data.capacity);
}

// --- Lecture ---

export async function getEvents(restaurantId: string): Promise<EventData[]> {
  const events = await db.event.findMany({
    where: {
      restaurantId,
      status: { in: ["PUBLISHED", "FULL"] },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return Promise.all(
    events.map(async (e) => {
      const booked = await db.eventBooking.aggregate({
        where: {
          eventId: e.id,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        _sum: { quantity: true },
      });
      const totalBooked = booked._sum.quantity ?? 0;
      return toEventData(e, e.capacity - totalBooked);
    }),
  );
}

export async function getEventById(
  eventId: string,
): Promise<EventData | null> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return null;

  const booked = await db.eventBooking.aggregate({
    where: {
      eventId: event.id,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    _sum: { quantity: true },
  });
  const totalBooked = booked._sum.quantity ?? 0;
  return toEventData(event, event.capacity - totalBooked);
}

// --- Réservation ---

export async function bookEvent(
  eventId: string,
  guestId: string,
  quantity: number,
): Promise<{ ok: boolean; booking?: EventBookingData; error?: string }> {
  if (quantity < 1 || quantity > 10) {
    return { ok: false, error: "INVALID_QUANTITY" };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { ok: false, error: "EVENT_NOT_FOUND" };
  }

  if (event.status === "DRAFT") {
    return { ok: false, error: "EVENT_NOT_PUBLISHED" };
  }

  const existing = await db.eventBooking.findUnique({
    where: { eventId_guestId: { eventId, guestId } },
  });

  if (existing && existing.status !== "CANCELLED") {
    return { ok: false, error: "ALREADY_BOOKED" };
  }

  const booked = await db.eventBooking.aggregate({
    where: {
      eventId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    _sum: { quantity: true },
  });

  const totalBooked = booked._sum.quantity ?? 0;
  const spotsLeft = event.capacity - totalBooked;

  if (quantity > spotsLeft) {
    return { ok: false, error: "NOT_ENOUGH_SPOTS" };
  }

  let booking: EventBookingData;

  if (existing) {
    const updated = await db.eventBooking.update({
      where: { id: existing.id },
      data: {
        quantity,
        status: "CONFIRMED",
      },
    });
    booking = toBookingData(updated);
  } else {
    const created = await db.eventBooking.create({
      data: {
        eventId,
        guestId,
        quantity,
      },
    });
    booking = toBookingData(created);
  }

  const newTotal = totalBooked + quantity;
  if (newTotal >= event.capacity) {
    await db.event.update({
      where: { id: eventId },
      data: { status: "FULL" },
    });
  }

  return { ok: true, booking };
}

// --- Disponibilité ---

export async function getEventAvailability(
  eventId: string,
): Promise<{ total: number; booked: number; spotsLeft: number } | null> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return null;

  const booked = await db.eventBooking.aggregate({
    where: {
      eventId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    _sum: { quantity: true },
  });

  const totalBooked = booked._sum.quantity ?? 0;
  return {
    total: event.capacity,
    booked: totalBooked,
    spotsLeft: event.capacity - totalBooked,
  };
}

/**
 * Annule une réservation d'événement.
 */
export async function cancelEventBooking(
  eventId: string,
  guestId: string,
): Promise<boolean> {
  const booking = await db.eventBooking.findUnique({
    where: { eventId_guestId: { eventId, guestId } },
  });

  if (!booking || booking.status === "CANCELLED") return false;

  await db.eventBooking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (event && event.status === "FULL") {
    await db.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED" },
    });
  }

  return true;
}

// --- Helpers ---

function toEventData(
  event: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    startTime: string;
    capacity: number;
    price: number;
    imageUrl: string | null;
    status: string;
    createdAt: Date;
  },
  spotsLeft: number,
): EventData {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    capacity: event.capacity,
    price: event.price,
    imageUrl: event.imageUrl,
    status: event.status.toLowerCase() as EventData["status"],
    spotsLeft,
    createdAt: event.createdAt,
  };
}

function toBookingData(booking: {
  id: string;
  eventId: string;
  guestId: string;
  quantity: number;
  status: string;
  createdAt: Date;
}): EventBookingData {
  return {
    id: booking.id,
    eventId: booking.eventId,
    guestId: booking.guestId,
    quantity: booking.quantity,
    status: booking.status.toLowerCase() as EventBookingData["status"],
    createdAt: booking.createdAt,
  };
}
