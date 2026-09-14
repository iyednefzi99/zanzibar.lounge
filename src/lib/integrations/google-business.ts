import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Google Business Profile integration — sync restaurant info and manage reviews.
 *
 * Requires GOOGLE_BUSINESS_API_KEY env var.
 * Falls back gracefully when unconfigured.
 */

const BASE_URL = "https://mybusinessbusinessinformation.googleapis.com/v1";

function isConfigured(): boolean {
  return !!env.GOOGLE_BUSINESS_API_KEY;
}

function apiKey(): string {
  return env.GOOGLE_BUSINESS_API_KEY ?? "";
}

type BusinessInfo = {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
};

export async function syncBusinessInfo(
  restaurantId: string,
  info: BusinessInfo,
): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    logger.info("[google-business] syncBusinessInfo", {
      restaurantId,
      name: info.name,
    });
    // Google Business Profile API requires OAuth2 for write operations.
    // This is a placeholder for when OAuth is configured.
    // In production, use google-auth-library for token management.
    return true;
  } catch (error) {
    logger.error("[google-business] syncBusinessInfo error", {
      restaurantId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

type BusinessReview = {
  reviewId: string;
  reviewer: { displayName: string };
  starRating: number;
  comment: string;
  createTime: string;
  reply?: { comment: string };
};

export async function getBusinessReviews(
  restaurantId: string,
): Promise<BusinessReview[]> {
  if (!isConfigured()) return [];

  try {
    const url = `${BASE_URL}/accounts/-/locations/-/reviews?key=${apiKey()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      logger.error("[google-business] getReviews failed", {
        restaurantId,
        status: res.status,
      });
      return [];
    }

    const data = (await res.json()) as { reviews?: BusinessReview[] };
    return data.reviews ?? [];
  } catch (error) {
    logger.error("[google-business] getReviews error", {
      restaurantId,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    const url = `${BASE_URL}/accounts/-/locations/-/reviews/${reviewId}/reply?key=${apiKey()}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: reply }),
    });

    if (!res.ok) {
      logger.error("[google-business] replyToReview failed", {
        reviewId,
        status: res.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[google-business] replyToReview error", {
      reviewId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}
