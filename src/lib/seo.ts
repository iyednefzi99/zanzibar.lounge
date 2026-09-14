/**
 * SEO utilities — server-only.
 *
 * Generates meta titles, descriptions, keywords, and structured data schemas
 * for the restaurant. No external dependencies; uses the `site` content source
 * as the single source of truth.
 */

import { site } from "@/content/site";
import type { MenuCategory } from "@/content/menu";

const baseUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// --- Page context for meta generation ---

export type PageContext = {
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
};

// --- Meta generators ---

/**
 * Generate an optimized page title. Format: "Page — E-Coffee Node" or just
 * "E-Coffee Node" for the homepage.
 */
export function generateMetaTitle(
  page: PageContext,
  restaurant: typeof site = site,
): string {
  if (!page.title && !page.slug) return restaurant.name;
  const pageLabel = page.title ?? capitalize(page.slug!);
  return `${pageLabel} — ${restaurant.name}`;
}

/**
 * Generate a meta description. Falls back to a default derived from the
 * restaurant's address and offering.
 */
export function generateMetaDescription(
  page: PageContext,
  restaurant: typeof site = site,
): string {
  if (page.description) return truncate(page.description, 160);
  return `Café, cuisine et chicha à ${restaurant.address.city}. Terrasse ouverte du matin à tard le soir. Réservez en ligne.`;
}

/**
 * Generate keyword array combining restaurant-wide and page-specific terms.
 */
export function generateKeywords(
  page: PageContext,
  restaurant: typeof site = site,
): string[] {
  const base = [
    restaurant.name.toLowerCase(),
    "café",
    "chicha",
    "restaurant",
    restaurant.address.city.toLowerCase(),
    "terrasse",
    "réservation",
    "méditerranéen",
    "tunisien",
  ];

  if (page.slug) {
    const pageKeywords: Record<string, string[]> = {
      carte: ["menu", "carte", "prix", "boissons", "plats"],
      reserver: ["réservation", "table", "booking"],
      galerie: ["photos", "galerie", "instagram"],
      avis: ["avis", "reviews", "tripadvisor"],
      commander: ["commande", "order", "livraison"],
      fidelite: ["fidélité", "loyalty", "programme"],
    };
    const extra = pageKeywords[page.slug] ?? [];
    return [...base, ...extra];
  }

  return base;
}

// --- Structured Data (Schema.org) ---

/**
 * Generate a LocalBusiness schema for rich search results.
 */
export function generateLocalBusinessSchema(
  restaurant: typeof site = site,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.tagline,
    url: baseUrl(),
    telephone: restaurant.contact.phone,
    email: restaurant.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address.street,
      addressLocality: restaurant.address.city,
      addressRegion: restaurant.address.region,
      postalCode: restaurant.address.postalCode,
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: restaurant.address.lat,
      longitude: restaurant.address.lng,
    },
    openingHoursSpecification: restaurant.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][h.day],
      opens: h.open,
      closes: h.close,
    })),
    priceRange: "$$",
    servesCuisine: ["Tunisian", "Mediterranean", "Cafe"],
    hasMenu: `${baseUrl()}/fr/carte`,
    acceptsReservations: "True",
    sameAs: [
      restaurant.social.instagram,
      restaurant.social.facebook,
      restaurant.social.tripadvisor,
    ].filter(Boolean),
    image: `${baseUrl()}/opengraph-image`,
  };
}

/**
 * Generate a Menu schema for the restaurant's offerings.
 */
export function generateMenuSchema(
  restaurant: typeof site = site,
  categories: MenuCategory[] = [],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `Menu — ${restaurant.name}`,
    url: `${baseUrl()}/fr/carte`,
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.name.fr,
      hasMenuItem: category.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name.fr,
        description: item.description?.fr ?? undefined,
        offers: {
          "@type": "Offer",
          price: item.price !== null ? String(item.price) : "Prix du jour",
          priceCurrency: "TND",
          availability: "https://schema.org/InStock",
        },
      })),
    })),
  };
}

/**
 * Generate a ReservationAction schema for the booking page.
 */
export function generateReservationSchema(
  restaurant: typeof site = site,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishmentReservation",
    name: `Réservation — ${restaurant.name}`,
    url: `${baseUrl()}/fr/reserver`,
    provider: {
      "@type": "FoodEstablishment",
      name: restaurant.name,
      telephone: restaurant.contact.phone,
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl()}/fr/reserver`,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: {
        "@type": "Reservation",
        name: `Réservation au ${restaurant.name}`,
      },
    },
  };
}

/**
 * Generate a Restaurant schema for a specific restaurant (discovery page).
 */
export function generateRestaurantSchema(restaurant: {
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cuisineTypes?: string[];
  priceRange?: number;
  rating?: number;
  reviewCount?: number;
}): Record<string, unknown> {
  const base = baseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description ?? `${restaurant.name} — Restaurant`,
    url: `${base}/r/${restaurant.slug}`,
    telephone: restaurant.phone ?? undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressCountry: "TN",
        }
      : undefined,
    geo: restaurant.latitude && restaurant.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }
      : undefined,
    priceRange: "$".repeat(restaurant.priceRange ?? 2),
    servesCuisine: restaurant.cuisineTypes ?? ["Tunisian"],
    acceptsReservations: "True",
    aggregateRating:
      restaurant.reviewCount && restaurant.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: restaurant.rating,
            reviewCount: restaurant.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

/**
 * Generate a BreadcrumbList schema.
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${baseUrl()}${item.url}`,
    })),
  };
}

// --- Helpers ---

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}
