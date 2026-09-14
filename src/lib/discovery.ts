import { db } from "@/lib/db";

export type DiscoveryFilters = {
  query?: string;
  cuisine?: string;
  priceRange?: number;
  minRating?: number;
  isOpenNow?: boolean;
  featured?: boolean;
  sortBy?: "rating" | "price" | "name" | "popularity" | "newest";
  page?: number;
  limit?: number;
};

export type RestaurantWithStats = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  description: string | null;
  cuisineTypes: string[];
  priceRange: number;
  coverImage: string | null;
  galleryImages: string[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  menuItemCount: number;
  tableCount: number;
};

export type SearchResult = {
  restaurants: RestaurantWithStats[];
  total: number;
  page: number;
  totalPages: number;
};

function isOpenNow(tz: string): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const minutes = hour * 60 + minute;
  const weekday = now.getUTCDay();

  const hoursConfig = [
    { day: 0, open: "10:00", close: "23:00" },
    { day: 1, open: "09:00", close: "23:00" },
    { day: 2, open: "09:00", close: "23:00" },
    { day: 3, open: "09:00", close: "23:00" },
    { day: 4, open: "09:00", close: "00:00" },
    { day: 5, open: "09:00", close: "00:00" },
    { day: 6, open: "10:00", close: "00:00" },
  ];

  const dayHours = hoursConfig.find((h) => h.day === weekday);
  if (!dayHours) return false;

  const openMin = parseInt(dayHours.open, 10) * 60;
  const closeStr = dayHours.close.replace("26:00", "26");
  const closeMin = parseInt(closeStr, 10) * 60;

  return minutes >= openMin && minutes < closeMin;
}

function computeStats(reservations: Array<{ reviews: Array<{ rating: number }> }>) {
  const reviews = reservations.flatMap((r) => r.reviews);
  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((s, rv) => s + rv.rating, 0) / count) * 10) / 10
      : 0;
  return { count, average };
}

export async function searchRestaurants(
  filters: DiscoveryFilters,
): Promise<SearchResult> {
  const {
    query,
    cuisine,
    priceRange,
    minRating,
    isOpenNow: filterOpen,
    featured,
    sortBy = "rating",
    page = 1,
    limit = 12,
  } = filters;

  const where: Record<string, unknown> = { active: true };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { cuisineTypes: { has: query } },
    ];
  }

  if (cuisine) {
    where.cuisineTypes = { has: cuisine };
  }

  if (priceRange) {
    where.priceRange = priceRange;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  const restaurants = await db.restaurant.findMany({
    where,
    include: {
      reservations: {
        where: { status: "COMPLETED" },
        include: {
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
        },
      },
      menuItems: {
        where: { available: true },
        select: { id: true },
      },
      tables: {
        where: { active: true },
        select: { id: true },
      },
    },
  });

  let mapped: RestaurantWithStats[] = restaurants.map((r) => {
    const stats = computeStats(r.reservations);
    const open = isOpenNow(r.timezone ?? "Africa/Tunis");
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      address: r.address,
      phone: r.phone,
      timezone: r.timezone,
      description: r.description,
      cuisineTypes: r.cuisineTypes,
      priceRange: r.priceRange,
      coverImage: r.coverImage,
      galleryImages: r.galleryImages,
      featured: r.featured,
      rating: stats.average,
      reviewCount: stats.count,
      isOpen: open,
      menuItemCount: r.menuItems.length,
      tableCount: r.tables.length,
    };
  });

  if (minRating && minRating > 0) {
    mapped = mapped.filter((r) => r.rating >= minRating);
  }

  if (filterOpen) {
    mapped = mapped.filter((r) => r.isOpen);
  }

  switch (sortBy) {
    case "rating":
      mapped.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case "price":
      mapped.sort((a, b) => a.priceRange - b.priceRange);
      break;
    case "name":
      mapped.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "popularity":
      mapped.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
      break;
    case "newest":
      mapped.reverse();
      break;
  }

  const total = mapped.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const paged = mapped.slice((currentPage - 1) * limit, currentPage * limit);

  return { restaurants: paged, total, page: currentPage, totalPages };
}

export async function getFeaturedRestaurants(): Promise<RestaurantWithStats[]> {
  const result = await searchRestaurants({ featured: true, limit: 6, sortBy: "rating" });
  return result.restaurants;
}

export async function getRestaurantBySlugForDiscovery(
  slug: string,
): Promise<RestaurantWithStats | null> {
  const r = await db.restaurant.findUnique({
    where: { slug, active: true },
    include: {
      reservations: {
        where: { status: "COMPLETED" },
        include: {
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
        },
      },
      menuItems: {
        where: { available: true },
        select: { id: true },
      },
      tables: {
        where: { active: true },
        select: { id: true },
      },
    },
  });

  if (!r) return null;

  const stats = computeStats(r.reservations);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    address: r.address,
    phone: r.phone,
    timezone: r.timezone,
    description: r.description,
    cuisineTypes: r.cuisineTypes,
    priceRange: r.priceRange,
    coverImage: r.coverImage,
    galleryImages: r.galleryImages,
    featured: r.featured,
    rating: stats.average,
    reviewCount: stats.count,
    isOpen: isOpenNow(r.timezone ?? "Africa/Tunis"),
    menuItemCount: r.menuItems.length,
    tableCount: r.tables.length,
  };
}

export async function trackRestaurantView(
  restaurantId: string,
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.$executeRaw`
      INSERT INTO "RestaurantAnalytics" ("id", "restaurantId", "date", "views", "createdAt")
      VALUES (gen_random_uuid(), ${restaurantId}, ${today}, 1, NOW())
      ON CONFLICT ("restaurantId", "date")
      DO UPDATE SET "views" = "RestaurantAnalytics"."views" + 1
    `;
  } catch {
    // Analytics table may not exist yet — fail silently
  }
}

export async function getAvailableRestaurants(): Promise<
  Array<{ name: string; slug: string }>
> {
  return db.restaurant.findMany({
    where: { active: true },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
