import type { SubscriptionPlan } from "@/generated/prisma/client";

// Re-export for type-only consumers
export type { SubscriptionPlan };

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/payments";
import { hashPassword } from "@/lib/staff-auth";

// ─── Plan limits ──────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  FREE: 50,
  STARTER: 500,
  PRO: 999_999,
  ENTERPRISE: 999_999,
};

const PLAN_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? "price_starter",
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise",
};

// ─── Setup tokens ─────────────────────────────────────────────────────

export type SetupTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: SetupTokenError };

export type SetupTokenError =
  | { code: "TOKEN_INVALID" }
  | { code: "TOKEN_EXPIRED" }
  | { code: "TOKEN_USED" }
  | { code: "RESTAURANT_EXISTS" };

/**
 * Générer un token d'onboarding unique, expire en 24 h.
 * Le token est un hex aléatoire de 32 octets (64 caractères).
 */
export async function createSetupToken(
  email: string,
  restaurantName?: string,
): Promise<SetupTokenResult> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(
    bytes,
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.setupToken.create({
    data: {
      token,
      email: email.toLowerCase().trim(),
      restaurantName: restaurantName?.trim() ?? null,
      expiresAt,
    },
  });

  logger.info("setup_token.created", { email, restaurantName });

  return { ok: true, token };
}

/**
 * Finaliser l'onboarding : créer Restaurant + Staff (owner) + Subscription (free).
 * Marque le token comme utilisé.
 */
export async function completeSetup(
  token: string,
  data: {
    restaurantName: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
    timezone?: string;
    locale?: string;
  },
): Promise<
  | { ok: true; restaurant: RestaurantSummary }
  | { ok: false; error: SetupTokenError }
> {
  const row = await db.setupToken.findUnique({ where: { token } });

  if (!row) return { ok: false, error: { code: "TOKEN_INVALID" } };
  if (row.status === "used") return { ok: false, error: { code: "TOKEN_USED" } };
  if (row.expiresAt < new Date())
    return { ok: false, error: { code: "TOKEN_EXPIRED" } };

  const existing = await db.restaurant.findUnique({
    where: { slug: data.slug },
  });
  if (existing) return { ok: false, error: { code: "RESTAURANT_EXISTS" } };

  const passwordHash = await hashPassword(data.password);

  const restaurant = await db.$transaction(async (tx) => {
    const r = await tx.restaurant.create({
      data: {
        name: data.restaurantName.trim(),
        slug: data.slug.toLowerCase().trim(),
        timezone: data.timezone ?? "Africa/Tunis",
        locale: data.locale ?? "fr",
        plan: "FREE" as SubscriptionPlan,
        monthlyReservationLimit: PLAN_LIMITS["FREE"],
      },
    });

    await tx.staff.create({
      data: {
        restaurantId: r.id,
        email: data.ownerEmail.toLowerCase().trim(),
        name: data.ownerName.trim(),
        passwordHash,
        role: "OWNER",
      },
    });

    await tx.subscription.create({
      data: {
        restaurantId: r.id,
        status: "inactive",
      },
    });

    await tx.setupToken.update({
      where: { id: row.id },
      data: { status: "used", usedAt: new Date(), restaurantId: r.id },
    });

    return r;
  });

  logger.info("setup.completed", {
    restaurantId: restaurant.id,
    slug: restaurant.slug,
  });

  return {
    ok: true,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      plan: restaurant.plan,
      monthlyReservationLimit: restaurant.monthlyReservationLimit,
      monthlyReservationCount: restaurant.monthlyReservationCount,
      staffCount: 1,
      subscriptionStatus: "inactive",
    },
  };
}

// ─── Restaurant queries ───────────────────────────────────────────────

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  monthlyReservationLimit: number;
  monthlyReservationCount: number;
  staffCount: number;
  subscriptionStatus: string | null;
};

/** Récupérer un restaurant par son slug, avec abonnement et nombre de staff. */
export async function getRestaurantBySlug(
  slug: string,
): Promise<RestaurantSummary | null> {
  const row = await db.restaurant.findUnique({
    where: { slug },
    include: {
      subscription: { select: { status: true } },
      _count: { select: { staff: { where: { active: true } } } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    monthlyReservationLimit: row.monthlyReservationLimit,
    monthlyReservationCount: row.monthlyReservationCount,
    staffCount: row._count.staff,
    subscriptionStatus: row.subscription?.status ?? null,
  };
}

/** Modifier le plan d'un restaurant et mettre à jour les limites. */
export async function updateRestaurantPlan(
  restaurantId: string,
  plan: string,
): Promise<void> {
  await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      plan: plan as SubscriptionPlan,
      monthlyReservationLimit: PLAN_LIMITS[plan],
    },
  });

  logger.info("restaurant.plan_updated", {
    restaurantId,
    plan,
    limit: PLAN_LIMITS[plan],
  });
}

// ─── Reservation limits ───────────────────────────────────────────────

export type LimitCheck = {
  allowed: boolean;
  remaining: number;
  limit: number;
};

/**
 * Vérifier si le restaurant a atteint sa limite mensuelle de réservations.
 * Réinitialise automatiquement si on est dans un nouveau mois.
 */
export async function checkReservationLimit(
  restaurantId: string,
): Promise<LimitCheck> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      monthlyReservationLimit: true,
      monthlyReservationCount: true,
      reservationCountResetAt: true,
    },
  });

  if (!restaurant) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const now = new Date();
  const needsReset =
    !restaurant.reservationCountResetAt ||
    restaurant.reservationCountResetAt.getMonth() !== now.getMonth() ||
    restaurant.reservationCountResetAt.getFullYear() !== now.getFullYear();

  if (needsReset) {
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        monthlyReservationCount: 0,
        reservationCountResetAt: now,
      },
    });
    return {
      allowed: restaurant.monthlyReservationLimit > 0,
      remaining: restaurant.monthlyReservationLimit,
      limit: restaurant.monthlyReservationLimit,
    };
  }

  const remaining = Math.max(
    0,
    restaurant.monthlyReservationLimit - restaurant.monthlyReservationCount,
  );

  return {
    allowed: remaining > 0,
    remaining,
    limit: restaurant.monthlyReservationLimit,
  };
}

/**
 * Incrémenter le compteur de réservations mensuelles.
 */
export async function incrementReservationCount(
  restaurantId: string,
): Promise<void> {
  await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      monthlyReservationCount: { increment: 1 },
    },
  });
}

/**
 * Réinitialiser les compteurs mensuels de tous les restaurants.
 * Appelé par un cron le 1er de chaque mois.
 */
export async function resetMonthlyCounts(): Promise<number> {
  const result = await db.restaurant.updateMany({
    data: {
      monthlyReservationCount: 0,
      reservationCountResetAt: new Date(),
    },
  });

  logger.info("monthly_counts_reset", { count: result.count });

  return result.count;
}

// ─── Stripe billing ───────────────────────────────────────────────────

/**
 * Créer une session Stripe Customer Portal pour gérer l'abonnement.
 */
export async function createStripePortalSession(
  restaurantId: string,
  returnUrl: string,
): Promise<string> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { stripeCustomerId: true },
  });

  if (!restaurant?.stripeCustomerId) {
    throw new Error("NO_STRIPE_CUSTOMER");
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: restaurant.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url ?? "";
}

/**
 * Créer une session Stripe Checkout pour souscrire/upgrader un plan.
 */
export async function createCheckoutSessionForPlan(
  restaurantId: string,
  plan: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string }> {
  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error("INVALID_PLAN");
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { stripeCustomerId: true, id: true },
  });

  if (!restaurant) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  let customerId = restaurant.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe().customers.create({
      metadata: { restaurantId },
    });
    customerId = customer.id;

    await db.restaurant.update({
      where: { id: restaurantId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { restaurantId, plan },
  });

  logger.info("checkout.created", { restaurantId, plan, sessionId: session.id });

  return { url: session.url ?? "" };
}

// ─── Usage stats ──────────────────────────────────────────────────────

export type UsageStats = {
  reservationsThisMonth: number;
  reservationLimit: number;
  ordersThisMonth: number;
  guestsThisMonth: number;
  revenueThisMonth: number;
  plan: string;
};

/**
 * Statistiques d'utilisation actuelles d'un restaurant.
 */
export async function getRestaurantUsage(
  restaurantId: string,
): Promise<UsageStats | null> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      plan: true,
      monthlyReservationLimit: true,
      monthlyReservationCount: true,
    },
  });

  if (!restaurant) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [orderStats, guestRows] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        restaurantId,
        createdAt: { gte: startOfMonth },
      },
    }),
    db.reservation.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfMonth },
      },
      select: { guestId: true },
      distinct: ["guestId"],
    }),
  ]);

  return {
    reservationsThisMonth: restaurant.monthlyReservationCount,
    reservationLimit: restaurant.monthlyReservationLimit,
    ordersThisMonth: orderStats._count,
    guestsThisMonth: guestRows.length,
    revenueThisMonth: orderStats._sum.total ?? 0,
    plan: restaurant.plan,
  };
}

// ─── Enterprise features ──────────────────────────────────────────────

export type EnterpriseFeatures = {
  customDomain: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  sla: boolean;
  dedicatedAccountManager: boolean;
};

const ENTERPRISE_FEATURES: EnterpriseFeatures = {
  customDomain: true,
  whiteLabel: true,
  prioritySupport: true,
  sla: true,
  dedicatedAccountManager: true,
};

/**
 * Vérifier si un restaurant dispose des fonctionnalités entreprise.
 * Seuls les restaurants au plan ENTERPRISE ont accès à ces features.
 */
export async function getEnterpriseFeatures(
  restaurantId: string,
): Promise<EnterpriseFeatures> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { plan: true },
  });

  if (!restaurant || restaurant.plan !== "ENTERPRISE") {
    return {
      customDomain: false,
      whiteLabel: false,
      prioritySupport: false,
      sla: false,
      dedicatedAccountManager: false,
    };
  }

  return ENTERPRISE_FEATURES;
}
