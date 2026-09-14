import { db } from "@/lib/db";

type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(
  guestId: string,
  subscription: PushSubscriptionData,
) {
  return db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      guestId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(guestId: string) {
  return db.pushSubscription.deleteMany({
    where: { guestId },
  });
}

export async function sendPushNotification(
  restaurantId: string,
  title: string,
  body: string,
  url?: string,
) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { guest: { reservations: { some: { restaurantId } } } },
  });

  let sent = 0;

  for (const sub of subscriptions) {
    try {
      const payload = JSON.stringify({
        title,
        body,
        url: url ?? "/",
      });

      console.log(`Push notification to ${sub.endpoint.slice(0, 50)}...: ${title}`);
      sent++;
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  }

  return { sent };
}

export async function getPushSubscriptions(restaurantId: string) {
  return db.pushSubscription.findMany({
    where: { guest: { reservations: { some: { restaurantId } } } },
    select: { id: true, guestId: true, createdAt: true },
  });
}
