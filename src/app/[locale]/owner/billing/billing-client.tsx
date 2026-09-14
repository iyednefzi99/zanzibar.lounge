"use client";

import { useTransition } from "react";

import { PlanBadge } from "@/components/plan-badge";
import { UsageBar } from "@/components/usage-bar";
import type { SubscriptionPlan } from "@/generated/prisma/client";
import type { RestaurantSummary } from "@/lib/saas";

const PLANS = [
  {
    name: "Gratuit",
    plan: "FREE" as SubscriptionPlan,
    price: "0",
    features: ["50 réservations/mois", "1 membre d'équipe", "Support par email"],
  },
  {
    name: "Starter",
    plan: "STARTER" as SubscriptionPlan,
    price: "29",
    features: [
      "500 réservations/mois",
      "5 membres d'équipe",
      "Support prioritaire",
      "Domaine personnalisé",
    ],
  },
  {
    name: "Pro",
    plan: "PRO" as SubscriptionPlan,
    price: "79",
    features: [
      "Réservations illimitées",
      "25 membres d'équipe",
      "Support dédié",
      "Domaine personnalisé",
      "Logo et couleurs",
    ],
  },
  {
    name: "Enterprise",
    plan: "ENTERPRISE" as SubscriptionPlan,
    price: "199",
    features: [
      "Réservations illimitées",
      "Équipe illimitée",
      "Support téléphonique",
      "White-label complet",
      "API publique",
      "SLA garanti",
    ],
  },
];

export function BillingClient({
  restaurant,
  getPortalUrlAction,
  getCheckoutUrlAction,
}: {
  restaurant: RestaurantSummary;
  getPortalUrlAction: () => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
  }>;
  getCheckoutUrlAction: (
    plan: string,
  ) => Promise<{ ok: boolean; url?: string; error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleManageSubscription = async () => {
    startTransition(async () => {
      const result = await getPortalUrlAction();
      if (result.ok && result.url) {
        window.location.href = result.url;
      }
    });
  };

  const handleUpgrade = async (plan: string) => {
    startTransition(async () => {
      const result = await getCheckoutUrlAction(plan);
      if (result.ok && result.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-shell">Facturation</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Gérez votre abonnement et suivez votre consommation.
        </p>
      </header>

      {/* Current plan & usage */}
      <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
              Plan actuel
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <PlanBadge plan={restaurant.plan as SubscriptionPlan} />
              {restaurant.subscriptionStatus &&
                restaurant.subscriptionStatus !== "inactive" && (
                  <span className="font-mono text-xs text-shell-dim">
                    {restaurant.subscriptionStatus}
                  </span>
                )}
            </div>
          </div>
          {restaurant.plan !== "FREE" && (
            <button
              onClick={handleManageSubscription}
              disabled={isPending}
              className="rounded-full border border-shell/25 px-5 py-2.5 text-sm text-shell transition-colors hover:border-brass hover:text-brass disabled:opacity-50"
            >
              {isPending ? "Redirection…" : "Gérer via Stripe"}
            </button>
          )}
        </div>

        <div className="mt-6">
          <UsageBar
            used={restaurant.monthlyReservationCount}
            limit={restaurant.monthlyReservationLimit}
            label="Réservations ce mois"
          />
        </div>
      </section>

      {/* Plans comparison */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
          Changer de plan
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const isCurrent = restaurant.plan === p.plan;
            const isUpgrade =
              PLANS.findIndex((x) => x.plan === restaurant.plan) <
              PLANS.findIndex((x) => x.plan === p.plan);

            return (
              <div
                key={p.plan}
                className={`rounded-2xl border p-6 transition-colors ${
                  isCurrent
                    ? "border-brass bg-brass/5"
                    : "border-shell/12 bg-deep/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-shell">{p.name}</h3>
                  {isCurrent && (
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-brass">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="mt-3 font-mono text-3xl tabular-nums text-shell">
                  {p.price}
                  <span className="text-sm text-shell-dim"> €/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-shell-dim"
                    >
                      <span className="mt-0.5 text-lagoon">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && isUpgrade && (
                  <button
                    onClick={() => handleUpgrade(p.plan)}
                    disabled={isPending}
                    className="mt-6 w-full rounded-full bg-brass py-2.5 text-sm font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100 disabled:opacity-50"
                  >
                    {isPending ? "…" : "Passer à ce plan"}
                  </button>
                )}
                {!isCurrent && !isUpgrade && (
                  <p className="mt-6 text-center text-xs text-shell-dim">
                    Plan inférieur
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
