import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";

/**
 * Système de notation et d'avis clients.
 *
 * Les avis sont soumis par les clients après une réservation, modérés par
 * le staff, puis affichés publiquement.
 */

export type CreateReviewInput = {
  guestId: string;
  reservationId?: string;
  rating: number; // 1–5
  title?: string;
  body?: string;
  locale: Locale;
};

export type ReviewWithGuest = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  locale: string;
  approved: boolean;
  createdAt: Date;
  guest: { name: string | null; locale: string };
};

export type ReviewStats = {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

// --- Création ---

export async function createReview(
  input: CreateReviewInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "RATING_OUT_OF_RANGE" };
  }

  const review = await db.review.create({
    data: {
      guestId: input.guestId,
      reservationId: input.reservationId ?? null,
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      locale: input.locale,
    },
  });

  // Accumuler les points de fidélité pour l'avis
  const { accrueForReview } = await import("@/lib/loyalty");
  await accrueForReview(input.guestId).catch(() => {
    // Ne pas faire échouer l'avis si la fidélité échoue
  });

  return { ok: true, id: review.id };
}

// --- Modération ---

export async function approveReview(id: string): Promise<void> {
  await db.review.update({ where: { id }, data: { approved: true } });
}

export async function rejectReview(id: string): Promise<void> {
  await db.review.delete({ where: { id } });
}

// --- Lecture ---

export async function getApprovedReviews(
  limit = 20,
  offset = 0,
): Promise<ReviewWithGuest[]> {
  return db.review.findMany({
    where: { approved: true },
    include: { guest: { select: { name: true, locale: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getPendingReviews(): Promise<ReviewWithGuest[]> {
  return db.review.findMany({
    where: { approved: false },
    include: { guest: { select: { name: true, locale: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getReviewStats(): Promise<ReviewStats> {
  const rows = await db.review.findMany({
    where: { approved: true },
    select: { rating: true },
  });

  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const row of rows) {
    const r = Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5;
    dist[r] += 1;
    sum += row.rating;
  }

  return {
    average: rows.length > 0 ? Math.round((sum / rows.length) * 10) / 10 : 0,
    count: rows.length,
    distribution: dist,
  };
}

export async function getReviewByReservation(
  reservationId: string,
): Promise<ReviewWithGuest | null> {
  return db.review.findFirst({
    where: { reservationId },
    include: { guest: { select: { name: true, locale: true } } },
  });
}
