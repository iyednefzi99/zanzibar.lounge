import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * TripAdvisor integration — fetch ratings and generate embeddable widgets.
 *
 * Requires TRIPADVISOR_API_KEY env var.
 * Falls back gracefully when unconfigured.
 */

const BASE_URL = "https://api.content.tripadvisor.com/api/v1";

function isConfigured(): boolean {
  return !!env.TRIPADVISOR_API_KEY;
}

function apiKey(): string {
  return env.TRIPADVISOR_API_KEY ?? "";
}

type TripAdvisorRating = {
  rating: number;
  reviewCount: number;
  ranking?: string;
  url?: string;
};

export async function getTripAdvisorRating(
  restaurantId: string,
  locationId?: string,
): Promise<TripAdvisorRating | null> {
  if (!isConfigured() || !locationId) return null;

  try {
    const url = `${BASE_URL}/location/${locationId}/details?key=${apiKey()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      logger.error("[tripadvisor] getRating failed", {
        restaurantId,
        status: res.status,
      });
      return null;
    }

    const data = (await res.json()) as {
      rating?: number;
      num_reviews?: number;
      ranking_string?: string;
      web_url?: string;
    };

    return {
      rating: data.rating ?? 0,
      reviewCount: data.num_reviews ?? 0,
      ranking: data.ranking_string,
      url: data.web_url,
    };
  } catch (error) {
    logger.error("[tripadvisor] getRating error", {
      restaurantId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

export function getTripAdvisorWidget(
  restaurantId: string,
  locationId?: string,
): string | null {
  if (!isConfigured() || !locationId) return null;

  return `<div class="tripadvisor-widget">
  <div id="TA_cdsList_${locationId}" class="ta-cds-list">
    <div id="cds-rating-widget-${locationId}"></div>
  </div>
  <script async src="https://www.jscache.com/gitjs/6690e27c72f5ac6b8d4e1cf5ed99c22dcd129cd0/hotel.js"></script>
</div>`;
}
