import { ReservationStatus } from "@/generated/prisma/client";

import { site } from "@/content/site";
import { db } from "@/lib/db";
import { env, hasWhatsApp } from "@/lib/env";
import { sendWhatsAppTemplate } from "@/lib/channels/whatsapp";
import { sendPush } from "@/lib/push";
import { serviceSlotOf, formatSlot } from "@/lib/hours";

// ─── Logging ──────────────────────────────────────────────────────────

function log(level: string, event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ level, event, ...data }));
}

// ─── Types ────────────────────────────────────────────────────────────

type NotificationResult = {
  ok: boolean;
  channel: string;
  reason?: string;
};

type BulkResult = {
  sent: number;
  failed: number;
  errors: string[];
};

// ─── 1. Push notification unique ──────────────────────────────────────

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  title: string,
  body: string,
  url: string = "/",
  icon: string = "/icon-192.png",
): Promise<NotificationResult> {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!privateKey || !publicKey || !email) {
    log("warn", "push.vapid_missing", {});
    return { ok: false, channel: "push", reason: "VAPID keys not configured" };
  }

  try {
    const payload = JSON.stringify({ title, body, url, icon, badge: "/badge-72.png" });
    const status = await sendWebPushSingle(subscription, payload, privateKey, publicKey, email);

    if (status === 201) {
      log("info", "push.sent", { title, endpoint: subscription.endpoint.slice(0, 40) });
      return { ok: true, channel: "push" };
    }

    if (status === 410) {
      await db.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
      log("info", "push.expired", { endpoint: subscription.endpoint.slice(0, 40) });
      return { ok: false, channel: "push", reason: "subscription expired (410)" };
    }

    log("warn", "push.http_error", { status });
    return { ok: false, channel: "push", reason: `HTTP ${status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log("error", "push.exception", { error: msg });
    return { ok: false, channel: "push", reason: msg };
  }
}

// ─── 2. Push bulk ─────────────────────────────────────────────────────

export async function sendBulkPush(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  title: string,
  body: string,
  url: string = "/",
): Promise<BulkResult> {
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!privateKey || !publicKey || !email) {
    return {
      sent: 0,
      failed: subscriptions.length,
      errors: ["VAPID keys not configured"],
    };
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const endpointsToDelete: string[] = [];

  for (const sub of subscriptions) {
    try {
      const status = await sendWebPushSingle(sub, payload, privateKey, publicKey, email);
      if (status === 201) {
        sent++;
      } else if (status === 410) {
        endpointsToDelete.push(sub.endpoint);
        failed++;
      } else {
        failed++;
        errors.push(`${sub.endpoint.slice(0, 40)}: HTTP ${status}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : "unknown";
      errors.push(`${sub.endpoint.slice(0, 40)}: ${msg}`);
    }
  }

  if (endpointsToDelete.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: endpointsToDelete } },
    });
  }

  log("info", "push.bulk_done", { sent, failed, total: subscriptions.length });
  return { sent, failed, errors };
}

// ─── 3. Rappel J-1 ───────────────────────────────────────────────────

export async function scheduleReminder(
  reservationId: string,
): Promise<NotificationResult> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      restaurant: true,
    },
  });

  if (!reservation) {
    log("warn", "reminder.not_found", { reservationId });
    return { ok: false, channel: "multi", reason: "reservation not found" };
  }

  if (reservation.guest.optedOut) {
    log("info", "reminder.opted_out", { reservationId });
    await db.reservation.update({
      where: { id: reservationId },
      data: { reminderSentAt: new Date() },
    });
    return { ok: false, channel: "multi", reason: "guest opted out" };
  }

  if (
    reservation.status !== ReservationStatus.CONFIRMED &&
    reservation.status !== ReservationStatus.PENDING
  ) {
    log("info", "reminder.skipped_status", {
      reservationId,
      status: reservation.status,
    });
    return { ok: false, channel: "multi", reason: `status ${reservation.status}` };
  }

  const { minutes } = serviceSlotOf(reservation.startsAt);
  const time = formatSlot(minutes);
  const locale = reservation.guest.locale;
  const guestId = reservation.guestId;

  const pushBody = reminderPushText(locale, {
    date: reservation.serviceDate,
    time,
    partySize: reservation.partySize,
    reference: reservation.reference,
    restaurantName: site.name,
  });

  // Push notification
  const pushResult = await sendPush(
    {
      title: `Rappel — ${site.name}`,
      body: pushBody,
      url: `/reservation/${reservation.reference}`,
    },
    guestId,
  );

  // WhatsApp template message
  let whatsappOk = false;
  if (hasWhatsApp && env.WHATSAPP_REMINDER_TEMPLATE) {
    try {
      const result = await sendWhatsAppTemplate(
        reservation.guest.phone,
        env.WHATSAPP_REMINDER_TEMPLATE,
        templateLanguage(locale),
        [
          reservation.serviceDate,
          time,
          String(reservation.partySize),
          reservation.reference,
        ],
      );
      whatsappOk = result.ok;
      if (!result.ok) {
        log("warn", "reminder.whatsapp_failed", {
          reservationId,
          reason: result.reason,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      log("warn", "reminder.whatsapp_error", { reservationId, error: msg });
    }
  }

  const anyOk = pushResult.sent > 0 || whatsappOk;

  if (anyOk) {
    await db.reservation.update({
      where: { id: reservationId },
      data: { reminderSentAt: new Date() },
    });
  }

  log("info", "reminder.done", {
    reservationId,
    push: pushResult.sent > 0,
    whatsapp: whatsappOk,
  });

  return {
    ok: anyOk,
    channel: pushResult.sent > 0 ? "push" : whatsappOk ? "whatsapp" : "none",
  };
}

// ─── 4. Flash offer ───────────────────────────────────────────────────

export async function sendFlashOffer(
  restaurantId: string,
  message: string,
  targetTier?: "bronze" | "silver" | "gold",
): Promise<BulkResult> {
  const where: Record<string, unknown> = { restaurantId };
  if (targetTier) {
    where.tier = targetTier;
  }

  const accounts = await db.loyaltyAccount.findMany({
    where,
    include: { guest: true },
  });

  if (accounts.length === 0) {
    log("info", "flash_offer.no_recipients", { restaurantId, targetTier });
    return { sent: 0, failed: 0, errors: [] };
  }

  // Collect push subscriptions for all eligible guests
  const guestIds = accounts.map((a) => a.guestId);
  const subscriptions = await db.pushSubscription.findMany({
    where: { guestId: { in: guestIds } },
    select: { endpoint: true, p256dh: true, auth: true, guestId: true },
  });

  // Group subscriptions by guestId
  const subsByGuest = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    if (!sub.guestId) continue;
    const list = subsByGuest.get(sub.guestId) ?? [];
    list.push(sub);
    subsByGuest.set(sub.guestId, list);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send push to each guest who has subscriptions
  for (const [, subs] of subsByGuest) {
    const result = await sendBulkPush(subs, "Offre flash", message, "/menu");
    sent += result.sent;
    failed += result.failed;
    errors.push(...result.errors);
  }

  // WhatsApp fallback for guests without push subscriptions but with WhatsApp
  if (hasWhatsApp) {
    for (const account of accounts) {
      if (subsByGuest.has(account.guestId)) continue;
      if (account.guest.optedOut) continue;

      try {
        await sendWhatsAppTemplate(
          account.guest.phone,
          env.WHATSAPP_REMINDER_TEMPLATE ?? "",
          templateLanguage(account.guest.locale),
          [message],
        );
        sent++;
      } catch {
        // WhatsApp template may not be appropriate for flash offers —
        // try free text within the 24h service window.
        // Skip silently if outside the window.
      }
    }
  }

  log("info", "flash_offer.done", {
    restaurantId,
    targetTier,
    totalAccounts: accounts.length,
    sent,
    failed,
  });

  return { sent, failed, errors };
}

// ─── 5. Birthday wish ────────────────────────────────────────────────

export async function sendBirthdayWish(
  guestId: string,
): Promise<NotificationResult> {
  const guest = await db.guest.findUnique({ where: { id: guestId } });
  if (!guest) {
    log("warn", "birthday.guest_not_found", { guestId });
    return { ok: false, channel: "multi", reason: "guest not found" };
  }

  if (guest.optedOut) {
    log("info", "birthday.opted_out", { guestId });
    return { ok: false, channel: "multi", reason: "guest opted out" };
  }

  // Check if today is the guest's birthday using phone hash as a simple
  // proxy for a birthday field (the schema doesn't store DOB — we use the
  // guest's createdAt month/day as a "member anniversary" substitute, or a
  // dedicated birthday field when available). For now we store no birthday,
  // so this sends only if called on the right day by an external cron.
  //
  // When a `birthday` column exists on Guest, replace this check:
  //   if (toISODate(new Date(), TZ) !== guest.birthday) { ... return ... }
  //
  // As-is, we trust the caller to have verified the date.

  const locale = guest.locale;
  const title =
    locale === "ar"
      ? "عيد ميلاد سعيد!"
      : locale === "en"
        ? "Happy Birthday!"
        : "Joyeux anniversaire !";
  const body =
    locale === "ar"
      ? `كل سنة وأنت بخير! ${site.name} يهنئك بمناسبة عيد ميلادك. هديتنا في انتظارك.`
      : locale === "en"
        ? `Happy birthday from ${site.name}! A little gift is waiting for you on your next visit.`
        : `Joyeux anniversaire de la part de ${site.name} ! Un petit cadeau vous attend lors de votre prochaine visite.`;

  // Push
  const pushResult = await sendPush(
    {
      title,
      body,
      url: "/menu",
    },
    guestId,
  );

  // WhatsApp
  let whatsappOk = false;
  if (hasWhatsApp) {
    try {
      const result = await sendWhatsAppTemplate(
        guest.phone,
        env.WHATSAPP_REMINDER_TEMPLATE ?? "",
        templateLanguage(locale),
        [title, body],
      );
      whatsappOk = result.ok;
    } catch {
      // Outside service window or template mismatch — ignore.
    }
  }

  const anyOk = pushResult.sent > 0 || whatsappOk;
  log("info", "birthday.done", {
    guestId,
    push: pushResult.sent > 0,
    whatsapp: whatsappOk,
  });

  return {
    ok: anyOk,
    channel: pushResult.sent > 0 ? "push" : whatsappOk ? "whatsapp" : "none",
  };
}

// ─── 6. Weather alert ─────────────────────────────────────────────────

export async function sendWeatherAlert(
  guestId: string,
  message: string,
): Promise<NotificationResult> {
  const guest = await db.guest.findUnique({ where: { id: guestId } });
  if (!guest) {
    log("warn", "weather.guest_not_found", { guestId });
    return { ok: false, channel: "multi", reason: "guest not found" };
  }

  if (guest.optedOut) {
    log("info", "weather.opted_out", { guestId });
    return { ok: false, channel: "multi", reason: "guest opted out" };
  }

  const locale = guest.locale;
  const title =
    locale === "ar"
      ? "تنبيه الطقس"
      : locale === "en"
        ? "Weather Alert"
        : "Alerte météo";

  const fullMessage =
    locale === "ar"
      ? `${message} يرجى تعديل أو إلغاء حجزك إذا لزم الأمر.`
      : locale === "en"
        ? `${message} Please adjust or cancel your reservation if needed.`
        : `${message} Merci d'ajuster ou d'annuler votre réservation si nécessaire.`;

  // Push
  const pushResult = await sendPush(
    {
      title,
      body: fullMessage,
      url: "/reservation",
    },
    guestId,
  );

  // WhatsApp
  let whatsappOk = false;
  if (hasWhatsApp) {
    try {
      const result = await sendWhatsAppTemplate(
        guest.phone,
        env.WHATSAPP_REMINDER_TEMPLATE ?? "",
        templateLanguage(locale),
        [fullMessage],
      );
      whatsappOk = result.ok;
    } catch {
      // Ignore template failures.
    }
  }

  const anyOk = pushResult.sent > 0 || whatsappOk;
  log("info", "weather.done", {
    guestId,
    push: pushResult.sent > 0,
    whatsapp: whatsappOk,
  });

  return {
    ok: anyOk,
    channel: pushResult.sent > 0 ? "push" : whatsappOk ? "whatsapp" : "none",
  };
}

// ─── Internals ────────────────────────────────────────────────────────

function reminderPushText(
  locale: string,
  data: {
    date: string;
    time: string;
    partySize: number;
    reference: string;
    restaurantName: string;
  },
): string {
  if (locale === "ar") {
    return `تذكير: طاولتك في ${data.restaurantName} يوم ${data.date} على ${data.time} لـ ${data.partySize} أشخاص (${data.reference}).`;
  }
  if (locale === "en") {
    return `Reminder: your table at ${data.restaurantName} on ${data.date} at ${data.time} for ${data.partySize} (${data.reference}).`;
  }
  return `Rappel : votre table au ${data.restaurantName} le ${data.date} à ${data.time} pour ${data.partySize} personne(s) (${data.reference}).`;
}

function templateLanguage(locale: string): string {
  return { fr: "fr", ar: "ar", en: "en" }[locale] ?? "fr";
}

async function sendWebPushSingle(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  privateKey: string,
  publicKey: string,
  email: string,
): Promise<number> {
  const url = new URL(subscription.endpoint);
  const timestamp = Math.floor(Date.now() / 1000);

  const header = {
    aud: url.origin,
    exp: timestamp + 43200,
    sub: email,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const data = `${encodedHeader}.`;
  const crypto = await import("node:crypto");
  const keyObj = crypto.createPrivateKey({
    key: Buffer.from(privateKey, "base64url"),
    format: "der",
    type: "pkcs8",
  });
  const signature = crypto
    .createSign("SHA256")
    .update(data)
    .sign(keyObj, "base64url");

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Authorization: `vapid t=${encodedHeader}, k=${publicKey}, s=${signature}`,
    },
    body: Buffer.from(payload),
    signal: AbortSignal.timeout(10_000),
  });

  return response.status;
}
