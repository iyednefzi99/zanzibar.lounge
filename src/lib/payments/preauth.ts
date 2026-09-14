import Stripe from "stripe";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  stripe = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  return stripe;
}

export async function createPreAuthorization(
  reservationId: string,
  amount: number,
  guestId: string,
  restaurantId: string,
): Promise<{ id: string; clientSecret: string | null } | null> {
  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert millimes to subunits
      currency: "usd", // Stripe doesn't support TND directly
      capture_method: "manual",
      metadata: {
        type: "preauth",
        reservationId,
        guestId,
        restaurantId,
      },
    });

    const preAuth = await db.preAuthorization.create({
      data: {
        reservationId,
        guestId,
        restaurantId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: "USD",
        status: "pending",
      },
    });

    return { id: preAuth.id, clientSecret: paymentIntent.client_secret };
  } catch (error) {
    logger.error("Failed to create pre-authorization", { error, reservationId });
    return null;
  }
}

export async function capturePreAuthorization(preAuthId: string): Promise<boolean> {
  try {
    const preAuth = await db.preAuthorization.findUnique({ where: { id: preAuthId } });
    if (!preAuth) return false;

    const stripe = getStripe();
    await stripe.paymentIntents.capture(preAuth.stripePaymentIntentId);

    await db.preAuthorization.update({
      where: { id: preAuthId },
      data: { status: "authorized", capturedAt: new Date() },
    });

    return true;
  } catch (error) {
    logger.error("Failed to capture pre-authorization", { error, preAuthId });
    return false;
  }
}

export async function cancelPreAuthorization(preAuthId: string): Promise<boolean> {
  try {
    const preAuth = await db.preAuthorization.findUnique({ where: { id: preAuthId } });
    if (!preAuth) return false;

    const stripe = getStripe();
    await stripe.paymentIntents.cancel(preAuth.stripePaymentIntentId);

    await db.preAuthorization.update({
      where: { id: preAuthId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    return true;
  } catch (error) {
    logger.error("Failed to cancel pre-authorization", { error, preAuthId });
    return false;
  }
}

export async function chargeNoShowFee(
  reservationId: string,
  amount: number,
): Promise<boolean> {
  try {
    const preAuth = await db.preAuthorization.findFirst({
      where: { reservationId, status: "authorized" },
    });

    if (!preAuth) return false;

    const stripe = getStripe();
    await stripe.paymentIntents.capture(preAuth.stripePaymentIntentId, {
      amount_to_capture: Math.round(amount * 100),
    });

    await db.preAuthorization.update({
      where: { id: preAuth.id },
      data: { status: "captured", capturedAt: new Date() },
    });

    await db.reservation.update({
      where: { id: reservationId },
      data: { status: "NO_SHOW" },
    });

    return true;
  } catch (error) {
    logger.error("Failed to charge no-show fee", { error, reservationId });
    return false;
  }
}

export async function getPreAuthStatus(preAuthId: string) {
  return db.preAuthorization.findUnique({ where: { id: preAuthId } });
}
