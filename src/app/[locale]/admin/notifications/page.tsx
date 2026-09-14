import Link from "next/link";
import { notFound } from "next/navigation";

import { NotificationItem } from "@/components/notification-item";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getNotifications, type NotificationTypeValue } from "@/lib/notifications";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const TYPE_FILTERS: Array<{ label: string; value: NotificationTypeValue | null }> = [
  { label: "Tout", value: null },
  { label: "Réservations", value: "RESERVATION_REMINDER" },
  { label: "Commandes", value: "ORDER_READY" },
  { label: "Promotions", value: "FLASH_OFFER" },
  { label: "Système", value: "SYSTEM" },
];

export default async function AdminNotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const { page: pageStr, type: typeStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const type = typeStr as NotificationTypeValue | undefined;

  const validTypes: NotificationTypeValue[] = [
    "RESERVATION_REMINDER",
    "ORDER_READY",
    "FLASH_OFFER",
    "BIRTHDAY",
    "SYSTEM",
    "ANNOUNCEMENT",
  ];

  const restaurantId = await getDefaultRestaurantId();
  const result = await getNotifications(restaurantId, {
    page,
    limit: 20,
    type: type && validTypes.includes(type) ? type : undefined,
  });

  const totalPages = Math.ceil(result.total / 20);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Notifications</h1>
        <div className="flex items-baseline gap-4">
          {result.unreadCount > 0 && (
            <form action="/api/notifications/read-all" method="POST">
              <button
                type="submit"
                className="text-sm text-brass hover:text-brass/80"
              >
                Tout marquer lu ({result.unreadCount})
              </button>
            </form>
          )}
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            ← Retour au service
          </Link>
        </div>
      </header>

      <Studs className="mt-8" />

      {/* Filters */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer par type">
        {TYPE_FILTERS.map((filter) => {
          const active = filter.value === (type ?? null);
          const href = filter.value
            ? `/${locale}/admin/notifications?type=${filter.value}`
            : `/${locale}/admin/notifications`;
          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                active
                  ? "border-brass bg-brass font-medium text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {/* Notification list */}
      {result.notifications.length === 0 ? (
        <p className="py-16 text-center text-shell-dim">
          Aucune notification.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {result.notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem
                notification={{
                  ...notification,
                  createdAt: notification.createdAt.toISOString(),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={`/${locale}/admin/notifications?page=${page - 1}${type ? `&type=${type}` : ""}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-shell/20 px-4 text-sm text-shell-dim hover:border-brass hover:text-brass"
            >
              ← Précédent
            </Link>
          )}
          <span className="font-mono text-sm text-shell-dim">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/${locale}/admin/notifications?page=${page + 1}${type ? `&type=${type}` : ""}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-shell/20 px-4 text-sm text-shell-dim hover:border-brass hover:text-brass"
            >
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
