import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Google Calendar integration — creates calendar events for reservations.
 *
 * Requires GOOGLE_CALENDAR_API_KEY and GOOGLE_CALENDAR_ID env vars.
 * Falls back gracefully when unconfigured.
 */

const BASE_URL = "https://www.googleapis.com/calendar/v3";

function isConfigured(): boolean {
  return !!(env.GOOGLE_CALENDAR_API_KEY && env.GOOGLE_CALENDAR_ID);
}

function apiKey(): string {
  return env.GOOGLE_CALENDAR_API_KEY ?? "";
}

function calendarId(): string {
  return env.GOOGLE_CALENDAR_ID ?? "";
}

type CalendarEvent = {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email?: string; displayName?: string }[];
};

export async function createCalendarEvent(
  restaurantId: string,
  reservation: {
    reference: string;
    guestName: string;
    phone: string;
    startsAt: Date;
    endsAt: Date;
    partySize: number;
    zone?: string | null;
    timezone: string;
  },
): Promise<string | null> {
  if (!isConfigured()) return null;

  const event: CalendarEvent = {
    summary: `Réservation ${reservation.guestName} — ${reservation.partySize} pers.`,
    description: [
      `Référence : ${reservation.reference}`,
      `Téléphone : ${reservation.phone}`,
      `Personnes : ${reservation.partySize}`,
      reservation.zone ? `Zone : ${reservation.zone}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: reservation.startsAt.toISOString(),
      timeZone: reservation.timezone,
    },
    end: {
      dateTime: reservation.endsAt.toISOString(),
      timeZone: reservation.timezone,
    },
  };

  try {
    const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId())}/events?key=${apiKey()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("[google-calendar] createEvent failed", {
        restaurantId,
        status: res.status,
        body,
      });
      return null;
    }

    const data = (await res.json()) as { id: string };
    logger.info("[google-calendar] event created", {
      restaurantId,
      eventId: data.id,
      reference: reservation.reference,
    });
    return data.id;
  } catch (error) {
    logger.error("[google-calendar] createEvent error", {
      restaurantId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  data: {
    startsAt?: Date;
    endsAt?: Date;
    timezone?: string;
    guestName?: string;
    partySize?: number;
  },
): Promise<boolean> {
  if (!isConfigured()) return false;

  const update: Record<string, unknown> = {};
  if (data.startsAt && data.timezone) {
    update.start = { dateTime: data.startsAt.toISOString(), timeZone: data.timezone };
  }
  if (data.endsAt && data.timezone) {
    update.end = { dateTime: data.endsAt.toISOString(), timeZone: data.timezone };
  }
  if (data.guestName || data.partySize) {
    update.summary = `Réservation ${data.guestName ?? ""} — ${data.partySize ?? "?"} pers.`;
  }

  try {
    const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId())}/events/${eventId}?key=${apiKey()}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });

    if (!res.ok) {
      logger.error("[google-calendar] updateEvent failed", {
        eventId,
        status: res.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[google-calendar] updateEvent error", {
      eventId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId())}/events/${eventId}?key=${apiKey()}`;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      logger.error("[google-calendar] deleteEvent failed", {
        eventId,
        status: res.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[google-calendar] deleteEvent error", {
      eventId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}
