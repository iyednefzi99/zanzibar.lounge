import Stripe from "stripe";

import { db } from "@/lib/db";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export { getStripe as stripe };

// --- Types ---

export type PaymentSummary = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

export type CheckoutSessionResult = {
  sessionId: string;
  url: string;
};

export type PaymentError =
  | { code: "STRIPE_NOT_CONFIGURED" }
  | { code: "ORDER_NOT_FOUND" }
  | { code: "PAYMENT_ALREADY_EXISTS" }
  | { code: "AMOUNT_INVALID" }
  | { code: "SESSION_NOT_FOUND" };

export type PaymentResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PaymentError };

// --- Création de session de paiement ---

/**
 * Créer une session Stripe Checkout pour une commande.
 *
 * @param orderId - ID de la commande
 * @param amount - Montant en millimes (ex: 12000 = 12.000 DT)
 * @param currency - Devise ISO 4217 (défaut: TND)
 * @param successUrl - URL de redirection en cas de succès
 * @param cancelUrl - URL de redirection en cas d'annulation
 */
export async function createCheckoutSession(
  orderId: string,
  amount: number,
  currency: string = "TND",
  successUrl: string,
  cancelUrl: string,
  restaurantId?: string,
): Promise<PaymentResult<CheckoutSessionResult>> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: { code: "STRIPE_NOT_CONFIGURED" } };
  }

  if (amount <= 0) {
    return { ok: false, error: { code: "AMOUNT_INVALID" } };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { guest: true, items: true },
  });

  if (!order) {
    return { ok: false, error: { code: "ORDER_NOT_FOUND" } };
  }

  // Vérifier qu'il n'y a pas déjà un paiement en cours
  const existingPayment = await db.payment.findFirst({
    where: {
      orderId,
      status: { in: ["PENDING", "SUCCEEDED"] },
    },
  });

  if (existingPayment) {
    return { ok: false, error: { code: "PAYMENT_ALREADY_EXISTS" } };
  }

  const rid = restaurantId ?? order.restaurantId;

  // Créer la session Stripe Checkout
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: undefined,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Commande ${order.reference}`,
            description: `Zanzibar Lounge — ${order.items.length} article(s)`,
          },
          unit_amount: Math.round(amount * 10), // Stripe utilise les sous-unités (centimes)
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      guestId: order.guestId,
      restaurantId: rid,
      reference: order.reference,
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  // Enregistrer le paiement en base
  await db.payment.create({
    data: {
      restaurantId: rid,
      orderId: order.id,
      guestId: order.guestId,
      stripeSessionId: session.id,
      status: "PENDING",
      amount,
      currency,
      description: `Commande ${order.reference}`,
    },
  });

  return {
    ok: true,
    value: {
      sessionId: session.id,
      url: session.url ?? "",
    },
  };
}

/**
 * Créer une session de dépôt pour une réservation.
 */
export async function createDepositSession(
  reservationId: string,
  amount: number,
  currency: string = "TND",
  successUrl: string,
  cancelUrl: string,
  restaurantId?: string,
): Promise<PaymentResult<CheckoutSessionResult>> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: { code: "STRIPE_NOT_CONFIGURED" } };
  }

  if (amount <= 0) {
    return { ok: false, error: { code: "AMOUNT_INVALID" } };
  }

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true },
  });

  if (!reservation) {
    return { ok: false, error: { code: "ORDER_NOT_FOUND" } };
  }

  const existingPayment = await db.payment.findFirst({
    where: {
      reservationId,
      status: { in: ["PENDING", "SUCCEEDED"] },
    },
  });

  if (existingPayment) {
    return { ok: false, error: { code: "PAYMENT_ALREADY_EXISTS" } };
  }

  const rid = restaurantId ?? reservation.restaurantId;

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Dépôt — Réservation ${reservation.reference}`,
            description: `Zanzibar Lounge — ${reservation.partySize} personne(s) le ${reservation.serviceDate}`,
          },
          unit_amount: Math.round(amount * 10),
        },
        quantity: 1,
      },
    ],
    metadata: {
      reservationId: reservation.id,
      guestId: reservation.guestId,
      restaurantId: rid,
      reference: reservation.reference,
      type: "deposit",
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  await db.payment.create({
    data: {
      restaurantId: rid,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      stripeSessionId: session.id,
      status: "PENDING",
      amount,
      currency,
      description: `Dépôt réservation ${reservation.reference}`,
      metadata: { type: "deposit" },
    },
  });

  return {
    ok: true,
    value: {
      sessionId: session.id,
      url: session.url ?? "",
    },
  };
}

// --- Webhook Stripe ---

/**
 * Traiter un événement webhook Stripe.
 * Vérifie la signature et met à jour le statut du paiement.
 */
export async function handleWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<{ type: string; processed: boolean }> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  const event = getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutCompleted(session);
      return { type: event.type, processed: true };
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutExpired(session);
      return { type: event.type, processed: true };
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await onChargeRefunded(charge);
      return { type: event.type, processed: true };
    }
    default:
      return { type: event.type, processed: false };
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCEEDED",
      stripePaymentId: session.payment_intent as string,
      paidAt: new Date(),
    },
  });

  // Si c'est une commande, la marquer comme payée
  if (payment.orderId) {
    await db.order.update({
      where: { id: payment.orderId },
      data: { depositAmount: payment.amount },
    });
  }

  // Si c'est une réservation, mettre à jour le dépôt
  if (payment.reservationId) {
    await db.reservation.update({
      where: { id: payment.reservationId },
      data: { notes: `Dépôt de ${payment.amount} millimes payé` },
    });
  }
}

async function onCheckoutExpired(session: Stripe.Checkout.Session) {
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED" },
  });
}

async function onChargeRefunded(charge: Stripe.Charge) {
  if (!charge.payment_intent) return;

  const payment = await db.payment.findFirst({
    where: { stripePaymentId: charge.payment_intent as string },
  });

  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: charge.amount_refunded === charge.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
      refundedAt: new Date(),
    },
  });
}

// --- Lectures ---

export async function getPaymentStatus(
  sessionId: string,
): Promise<PaymentResult<PaymentSummary>> {
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!payment) {
    return { ok: false, error: { code: "SESSION_NOT_FOUND" } };
  }

  return {
    ok: true,
    value: {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    },
  };
}

export async function getPaymentsForOrder(
  orderId: string,
): Promise<PaymentSummary[]> {
  const payments = await db.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    description: p.description,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }));
}
