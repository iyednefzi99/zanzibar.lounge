import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantBySlug, type RestaurantSummary } from "@/lib/saas";

const OWNER_NAV = [
  { href: "settings", label: "Paramètres" },
  { href: "team", label: "Équipe" },
  { href: "billing", label: "Facturation" },
] as const;

export default async function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(await isAdminOrOwner())) notFound();

  const restaurant = await getFirstRestaurant();
  if (!restaurant) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/owner`}
            className="font-display text-2xl text-shell hover:text-brass transition-colors"
          >
            {restaurant.name}
          </Link>
        </div>
      </header>

      <nav
        aria-label="Navigation propriétaire"
        className="mt-6 flex flex-wrap items-center gap-2"
      >
        {OWNER_NAV.map((item) => {
          const href = `/${locale}/owner/${item.href}`;
          return (
            <Link
              key={item.href}
              href={href}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-shell/20 px-4 text-sm text-shell-dim transition-colors hover:border-brass hover:text-brass"
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-brass/20 pt-8">{children}</div>
    </div>
  );
}

async function isAdminOrOwner(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

async function getFirstRestaurant(): Promise<RestaurantSummary | null> {
  // The owner auth is Basic Auth tied to a single restaurant context.
  // We query by slug from the environment or find the first active restaurant.
  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (slug) return getRestaurantBySlug(slug);
  return null;
}
