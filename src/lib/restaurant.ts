import { db } from "@/lib/db";

/**
 * Helper pour la multi-tenancy.
 *
 * Le restaurant par défaut est celui dont le slug correspond à
 * `DEFAULT_RESTAURANT_SLUG` dans `.env.local` (ou "e-coffee" par défaut).
 *
 * Pour les routes API, le restaurant peut être passé en query param
 * ou déduit du contexte (ex: slug dans l'URL).
 */

const DEFAULT_SLUG = process.env.DEFAULT_RESTAURANT_SLUG ?? "e-coffee";

/**
 * Trouver ou créer le restaurant par défaut.
 * Utile au seed et au premier démarrage.
 */
export async function getOrCreateDefaultRestaurant(): Promise<{
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: string;
}> {
  const existing = await db.restaurant.findUnique({
    where: { slug: DEFAULT_SLUG },
  });

  if (existing) {
    return {
      id: existing.id,
      slug: existing.slug,
      name: existing.name,
      timezone: existing.timezone,
      locale: existing.locale,
    };
  }

  const created = await db.restaurant.create({
    data: {
      name: "E-Coffee Node",
      slug: DEFAULT_SLUG,
      address: "Medjez el Bab, Tunisie",
      phone: "+21620123456",
      timezone: "Africa/Tunis",
      locale: "fr",
    },
  });

  return {
    id: created.id,
    slug: created.slug,
    name: created.name,
    timezone: created.timezone,
    locale: created.locale,
  };
}

/**
 * ID du restaurant par défaut (en cache pour la requête).
 */
let _defaultRestaurantId: string | null = null;

export async function getDefaultRestaurantId(): Promise<string> {
  if (_defaultRestaurantId) return _defaultRestaurantId;
  const r = await getOrCreateDefaultRestaurant();
  _defaultRestaurantId = r.id;
  return r.id;
}

/**
 * Trouver un restaurant par son slug.
 */
export async function getRestaurantBySlug(slug: string) {
  return db.restaurant.findUnique({ where: { slug } });
}

/**
 * Lister tous les restaurants actifs.
 */
export async function getActiveRestaurants() {
  return db.restaurant.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}
