import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getGuestDashboard, quickRebook } from "@/lib/guest-app";
import { getGuestSessionFromCookie } from "@/lib/guest-session";
import { ReservationStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function statusColor(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.CONFIRMED:
      return "bg-lagoon/20 text-lagoon";
    case ReservationStatus.PENDING:
      return "bg-brass/20 text-brass";
    case ReservationStatus.SEATED:
      return "bg-lagoon text-deep";
    case ReservationStatus.COMPLETED:
      return "bg-shell/10 text-shell-dim";
    case ReservationStatus.CANCELLED:
    case ReservationStatus.NO_SHOW:
      return "bg-coral/20 text-coral";
    default:
      return "bg-shell/10 text-shell-dim";
  }
}

function statusLabel(status: ReservationStatus, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    CONFIRMED: { fr: "Confirmée", ar: "مؤكدة", en: "Confirmed" },
    PENDING: { fr: "En attente", ar: "في الانتظار", en: "Pending" },
    SEATED: { fr: "Installé", ar: "تم الجلوس", en: "Seated" },
    COMPLETED: { fr: "Terminée", ar: "مكتملة", en: "Completed" },
    CANCELLED: { fr: "Annulée", ar: "ملغاة", en: "Cancelled" },
    NO_SHOW: { fr: "Absente", ar: "لم يحضر", en: "No show" },
  };
  return labels[status]?.[locale] ?? status;
}

function formatPrice(millimes: number): string {
  return `${(millimes / 1000).toFixed(3)} DT`;
}

export default async function GuestDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getGuestSessionFromCookie();
  if (!session) redirect(`/${locale}/reserver`);

  const dashboard = await getGuestDashboard(session.guestId);
  if (!dashboard) redirect(`/${locale}/reserver`);

  const rebookData = await quickRebook(session.guestId);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      {/* Welcome */}
      <header>
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-none text-shell">
          {locale === "fr"
            ? `Bonjour, ${dashboard.profile?.displayName ?? dashboard.guest.name ?? "Zanzibar"}`
            : locale === "ar"
              ? `مرحبا، ${dashboard.profile?.displayName ?? dashboard.guest.name ?? "زنجبار"}`
              : `Hello, ${dashboard.profile?.displayName ?? dashboard.guest.name ?? "Zanzibar"}`}
        </h1>
        <p className="mt-2 text-shell-dim">
          {locale === "fr"
            ? "Bienvenue dans votre espace Zanzibar"
            : locale === "ar"
              ? "مرحبا بكم في مساحتكم في زنجبار"
              : "Welcome to your Zanzibar space"}
        </p>
      </header>

      {/* Loyalty quick view */}
      <section className="mt-8 rounded-xl border border-brass/20 bg-deep/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brass">
              {locale === "fr" ? "Fidélité" : locale === "ar" ? "الولاء" : "Loyalty"}
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-shell">
              {dashboard.loyalty.points}
              <span className="ml-1 text-sm text-shell-dim">
                {locale === "fr" ? "pts" : locale === "ar" ? "نقطة" : "pts"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              dashboard.loyalty.tier === "gold"
                ? "bg-brass/30 text-brass"
                : dashboard.loyalty.tier === "silver"
                  ? "bg-shell/20 text-shell"
                  : "bg-shell/10 text-shell-dim"
            }`}>
              {dashboard.loyalty.tier === "gold"
                ? "Or"
                : dashboard.loyalty.tier === "silver"
                  ? "Argent"
                  : "Bronze"}
            </span>
            {dashboard.loyalty.discount > 0 && (
              <p className="mt-1 text-xs text-lagoon">
                -{dashboard.loyalty.discount}%
              </p>
            )}
          </div>
        </div>
        {dashboard.loyalty.nextTier && dashboard.loyalty.pointsToNext != null && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-night">
              <div
                className="h-full rounded-full bg-brass transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((dashboard.loyalty.points - (dashboard.loyalty.tier === "bronze" ? 0 : 50)) /
                      (dashboard.loyalty.pointsToNext)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[0.65rem] text-shell-dim">
              {dashboard.loyalty.pointsToNext}{" "}
              {locale === "fr"
                ? "pts pour le palier suivant"
                : locale === "ar"
                  ? "نقطة للمستوى التالي"
                  : "pts to next tier"}
            </p>
          </div>
        )}
        <Link
          href={`/${locale}/guest/loyalty`}
          className="mt-3 block text-center text-xs text-brass underline underline-offset-2 hover:text-lagoon"
        >
          {locale === "fr" ? "Voir les détails" : locale === "ar" ? "عرض التفاصيل" : "View details"}
        </Link>
      </section>

      {/* Quick Rebook */}
      {rebookData && (
        <section className="mt-6">
          <Link
            href={`/${locale}/reserver?date=${rebookData.serviceDate}&party=${rebookData.partySize}`}
            className="block rounded-xl border border-lagoon/30 bg-lagoon/10 p-4 text-center transition-colors hover:bg-lagoon/20"
          >
            <span className="text-2xl">⚡</span>
            <p className="mt-2 font-medium text-lagoon">
              {locale === "fr"
                ? "Re-réserver"
                : locale === "ar"
                  ? "إعادة الحجز"
                  : "Quick rebook"}
            </p>
            <p className="mt-1 text-xs text-shell-dim">
              {rebookData.partySize}{" "}
              {locale === "fr"
                ? `couverts · ${rebookData.serviceDate}`
                : locale === "ar"
                  ? `مقاعد · ${rebookData.serviceDate}`
                  : `covers · ${rebookData.serviceDate}`}
            </p>
          </Link>
        </section>
      )}

      {/* Upcoming reservations */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            {locale === "fr"
              ? "Prochaines réservations"
              : locale === "ar"
                ? "الحجوزات القادمة"
                : "Upcoming reservations"}
          </h2>
          <Link
            href={`/${locale}/guest/reservations`}
            className="text-xs text-brass underline underline-offset-2 hover:text-lagoon"
          >
            {locale === "fr" ? "Tout voir" : locale === "ar" ? "عرض الكل" : "View all"}
          </Link>
        </div>
        {dashboard.upcomingReservations.length === 0 ? (
          <p className="mt-4 text-sm text-shell-dim">
            {locale === "fr"
              ? "Aucune réservation à venir."
              : locale === "ar"
                ? "لا توجد حجوزات قادمة."
                : "No upcoming reservations."}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {dashboard.upcomingReservations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-shell">
                      {r.reference}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${statusColor(r.status)}`}>
                      {statusLabel(r.status, locale)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-shell-dim">
                    {r.serviceDate} · {r.time} · {r.partySize}{" "}
                    {locale === "fr" ? "pers." : locale === "ar" ? "شخص" : "pers."}
                  </p>
                  {r.zone && (
                    <p className="mt-0.5 text-xs text-shell-dim/70 capitalize">
                      {r.zone}
                    </p>
                  )}
                </div>
                <Link
                  href={`/${locale}/guest/reservations?highlight=${r.id}`}
                  className="min-h-[44px] min-w-[44px] rounded-lg bg-brass/10 px-3 py-2 text-center text-xs font-medium text-brass transition-colors hover:bg-brass/20"
                >
                  {locale === "fr" ? "Détails" : locale === "ar" ? "تفاصيل" : "Details"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent orders */}
      {dashboard.recentOrders.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
            {locale === "fr"
              ? "Commandes récentes"
              : locale === "ar"
                ? "الطلبات الأخيرة"
                : "Recent orders"}
          </h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentOrders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-shell">
                      {o.reference}
                    </span>
                    <span className="rounded-full bg-shell/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-shell-dim">
                      {o.itemCount}{" "}
                      {locale === "fr" ? "art." : locale === "ar" ? "عنصر" : "items"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-shell-dim">
                    {formatPrice(o.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profile link */}
      <section className="mt-8 mb-8">
        <Link
          href={`/${locale}/guest/profile`}
          className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 p-4 transition-colors hover:border-brass/30"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block size-10 rounded-full bg-brass/20 text-center leading-10 text-brass font-bold">
              {(session.name ?? "Z").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-shell">
                {locale === "fr" ? "Mon profil" : locale === "ar" ? " ملفي الشخصي" : "My profile"}
              </p>
              <p className="text-xs text-shell-dim">
                {locale === "fr"
                  ? "Préférences, notifications, langue"
                  : locale === "ar"
                    ? "التفضيلات، الإشعارات، اللغة"
                    : "Preferences, notifications, language"}
              </p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-shell-dim">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
