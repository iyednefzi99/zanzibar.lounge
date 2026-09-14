import Link from "next/link";
import { notFound } from "next/navigation";

import { PlanBadge } from "@/components/plan-badge";
import { Studs } from "@/components/studs";
import { UsageBar } from "@/components/usage-bar";
import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantBySlug, getRestaurantUsage } from "@/lib/saas";
import type { SubscriptionPlan } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(await isAdminOrOwner())) notFound();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) notFound();

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const usage = await getRestaurantUsage(restaurant.id);

  return (
    <div className="space-y-10">
      {/* Header with plan */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-3xl text-shell sm:text-4xl">
          Tableau de bord
        </h1>
        <PlanBadge plan={restaurant.plan as SubscriptionPlan} />
      </div>

      {/* Usage bar */}
      <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
        <UsageBar
          used={restaurant.monthlyReservationCount}
          limit={restaurant.monthlyReservationLimit}
          label="Réservations ce mois"
        />
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Réservations"
          value={String(restaurant.monthlyReservationCount)}
        />
        <StatCard
          label="Limite"
          value={
            restaurant.monthlyReservationLimit === 999_999
              ? "∞"
              : String(restaurant.monthlyReservationLimit)
          }
        />
        <StatCard label="Équipe" value={String(restaurant.staffCount)} />
        <StatCard
          label="Abonnement"
          value={restaurant.subscriptionStatus ?? "—"}
        />
      </section>

      <Studs />

      {/* Navigation cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href={`/${locale}/owner/settings`}
          title="Paramètres"
          description="Nom, adresse, fuseau horaire, logo, couleur et domaine personnalisé."
        />
        <DashboardCard
          href={`/${locale}/owner/team`}
          title="Équipe"
          description="Gérer les membres du personnel, leurs rôles et accès."
        />
        <DashboardCard
          href={`/${locale}/owner/billing`}
          title="Facturation"
          description="Plan, abonnement, statistiques d'utilisation et portail Stripe."
        />
      </section>

      {/* Detailed usage */}
      {usage && (
        <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
            Statistiques du mois
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                Commandes
              </p>
              <p
                className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell"
                dir="ltr"
              >
                {usage.ordersThisMonth}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                Clients
              </p>
              <p
                className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell"
                dir="ltr"
              >
                {usage.guestsThisMonth}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                Revenu
              </p>
              <p
                className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell"
                dir="ltr"
              >
                {formatRevenue(usage.revenueThisMonth)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                Réservations
              </p>
              <p
                className="mt-2 font-mono text-2xl leading-none tabular-nums text-shell"
                dir="ltr"
              >
                {usage.reservationsThisMonth}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-shell/12 bg-deep/40 p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-xl leading-none tabular-nums text-shell"
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-shell/12 bg-deep/40 p-6 transition-colors hover:border-brass/40"
    >
      <h3 className="font-display text-xl text-shell group-hover:text-brass transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-shell-dim">{description}</p>
      <p className="mt-4 font-mono text-xs text-brass">Ouvrir →</p>
    </Link>
  );
}

function formatRevenue(amount: number): string {
  return `${(amount / 1000).toFixed(3)} DT`;
}

async function isAdminOrOwner(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
