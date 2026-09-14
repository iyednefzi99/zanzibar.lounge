import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { TIERS, type TierName } from "@/lib/loyalty";
import { getOrCreateAccount, getTransactionHistory } from "@/lib/loyalty";
import { getGuestSessionFromCookie } from "@/lib/guest-session";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const REWARDS = [
  { id: "discount_5", name: { fr: "5% de réduction", ar: "خصم 5%", en: "5% discount" }, cost: 50, icon: "🏷️" },
  { id: "discount_10", name: { fr: "10% de réduction", ar: "خصم 10%", en: "10% discount" }, cost: 150, icon: "🎉" },
  { id: "free_dessert", name: { fr: "Dessert offert", ar: "حلوى مجانية", en: "Free dessert" }, cost: 30, icon: "🍰" },
  { id: "free_drink", name: { fr: "Boisson offerte", ar: "مشروب مجاني", en: "Free drink" }, cost: 20, icon: "🍹" },
  { id: "priority", name: { fr: "Réservation prioritaire", ar: "حجز أولوية", en: "Priority booking" }, cost: 100, icon: "⭐" },
] as const;

function tierLabel(tier: TierName, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    bronze: { fr: "Bronze", ar: "برونزي", en: "Bronze" },
    silver: { fr: "Argent", ar: "فضي", en: "Silver" },
    gold: { fr: "Or", ar: "ذهبي", en: "Gold" },
  };
  return labels[tier]?.[locale] ?? tier;
}

function reasonLabel(reason: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    reservation_completed: { fr: "Réservation", ar: "حجز", en: "Reservation" },
    review: { fr: "Avis", ar: "تقييم", en: "Review" },
    referral: { fr: "Parrainage", ar: "إحالة", en: "Referral" },
    order_completed: { fr: "Commande", ar: "طلب", en: "Order" },
    redeemed: { fr: "Échange", ar: "استبدال", en: "Redeemed" },
    bonus: { fr: "Bonus", ar: "مكافأة", en: "Bonus" },
  };
  return labels[reason]?.[locale] ?? reason;
}

export default async function GuestLoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getGuestSessionFromCookie();
  if (!session) redirect(`/${locale}/reserver`);

  const restaurantId = await getDefaultRestaurantId();
  const [account, transactions] = await Promise.all([
    getOrCreateAccount(session.guestId, restaurantId),
    getTransactionHistory(session.guestId, 30, restaurantId),
  ]);

  const currentConfig = TIERS[account.tier];
  const nextTier = currentConfig.next as TierName | null;
  const progressPercent = nextTier
    ? Math.min(
        100,
        ((account.points - currentConfig.min) /
          (currentConfig.pointsToNext ?? 1)) *
          100,
      )
    : 100;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-shell">
        {locale === "fr" ? "Fidélité" : locale === "ar" ? "الولاء" : "Loyalty"}
      </h1>

      {/* Points & Tier */}
      <section className="mt-8 rounded-xl border border-brass/20 bg-deep/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brass">
              {locale === "fr" ? "Solde" : locale === "ar" ? "الرصيد" : "Balance"}
            </p>
            <p className="mt-2 font-mono text-5xl tabular-nums text-shell">
              {account.points}
            </p>
            <p className="mt-1 text-sm text-shell-dim">
              {locale === "fr" ? "points" : locale === "ar" ? "نقطة" : "points"}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider ${
              account.tier === "gold"
                ? "bg-brass/30 text-brass"
                : account.tier === "silver"
                  ? "bg-shell/20 text-shell"
                  : "bg-shell/10 text-shell-dim"
            }`}>
              {tierLabel(account.tier, locale)}
            </span>
            {account.discount > 0 && (
              <p className="mt-2 text-sm text-lagoon">
                -{account.discount}%{" "}
                {locale === "fr" ? "de réduction" : locale === "ar" ? "خصم" : "discount"}
              </p>
            )}
          </div>
        </div>

        {/* Tier progress */}
        {nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-shell-dim">
              <span>{tierLabel(account.tier, locale)}</span>
              <span>{tierLabel(nextTier, locale)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-night">
              <div
                className="h-full rounded-full bg-brass transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-shell-dim">
              {account.pointsToNext != null
                ? `${account.pointsToNext} ${
                    locale === "fr"
                      ? "pts pour le palier suivant"
                      : locale === "ar"
                        ? "نقطة للمستوى التالي"
                        : "pts to next tier"
                  }`
                : locale === "fr"
                  ? "Palier maximum atteint !"
                  : locale === "ar"
                    ? "تم الوصول إلى المستوى الأقصى!"
                    : "Max tier reached!"}
            </p>
          </div>
        )}
      </section>

      {/* Tier cards */}
      <section className="mt-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {locale === "fr" ? "Les paliers" : locale === "ar" ? "المستويات" : "Tiers"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["bronze", "silver", "gold"] as const).map((tier) => {
            const config = TIERS[tier];
            const isCurrent = tier === account.tier;
            return (
              <div
                key={tier}
                className={`rounded-xl border p-4 ${
                  isCurrent
                    ? "border-brass/50 bg-brass/10"
                    : "border-shell/10 bg-deep/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm uppercase tracking-widest text-brass">
                    {tierLabel(tier, locale)}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-brass/30 px-2 py-0.5 text-[0.6rem] font-bold text-brass">
                      {locale === "fr" ? "ACTUEL" : locale === "ar" ? "الحالي" : "CURRENT"}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-mono text-lg tabular-nums text-shell">
                  {config.min}+ pts
                </p>
                <p className="mt-1 text-xs text-shell-dim">
                  {config.discount > 0
                    ? `-${config.discount}% ${locale === "fr" ? "sur les repas" : locale === "ar" ? "على الوجبات" : "on meals"}`
                    : locale === "fr"
                      ? "Base"
                      : locale === "ar"
                        ? "الأساس"
                        : "Base"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rewards catalog */}
      <section className="mt-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {locale === "fr" ? "Récompenses" : locale === "ar" ? "المكافآت" : "Rewards"}
        </h2>
        <div className="mt-4 space-y-2">
          {REWARDS.map((reward) => {
            const canRedeem = account.points >= reward.cost;
            return (
              <div
                key={reward.id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  canRedeem
                    ? "border-lagoon/30 bg-lagoon/5"
                    : "border-shell/10 bg-deep/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-shell">
                      {reward.name[locale as keyof typeof reward.name]}
                    </p>
                    <p className="text-xs text-shell-dim">
                      {reward.cost}{" "}
                      {locale === "fr" ? "points" : locale === "ar" ? "نقطة" : "points"}
                    </p>
                  </div>
                </div>
                <button
                  disabled={!canRedeem}
                  className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    canRedeem
                      ? "bg-brass text-deep hover:bg-brass/90"
                      : "bg-shell/10 text-shell-dim cursor-not-allowed"
                  }`}
                >
                  {locale === "fr" ? "Échanger" : locale === "ar" ? "استبدال" : "Redeem"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction history */}
      <section className="mt-8 mb-8">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {locale === "fr" ? "Historique" : locale === "ar" ? "السجل" : "History"}
        </h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-shell-dim">
            {locale === "fr"
              ? "Aucune transaction."
              : locale === "ar"
                ? "لا توجد معاملات."
                : "No transactions yet."}
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-shell">
                    {reasonLabel(tx.reason, locale)}
                  </p>
                  {tx.metadata && (
                    <p className="mt-0.5 font-mono text-[0.65rem] text-shell-dim/60">
                      {tx.metadata}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono text-sm tabular-nums ${
                      tx.points > 0 ? "text-lagoon" : "text-coral"
                    }`}
                  >
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </p>
                  <p className="text-[0.6rem] text-shell-dim/60">
                    {new Date(tx.createdAt).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : locale === "ar" ? "ar-TN" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
