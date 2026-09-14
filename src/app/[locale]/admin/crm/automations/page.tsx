import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import AutomationsInterface from "./automations-interface";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automatisations",
};

const DEFAULT_RULES = [
  {
    id: "welcome_email",
    name: "Email de bienvenue",
    description: "Envoyer un email de bienvenue lors de la première visite",
    type: "welcome",
  },
  {
    id: "birthday_offer",
    name: "Offre anniversaire",
    description: "Envoyer une offre spéciale le jour de l'anniversaire du client",
    type: "birthday",
  },
  {
    id: "reengagement_30d",
    name: "Réengagement après 30 jours",
    description: "Relancer les clients inactifs depuis 30 jours",
    type: "reengagement",
  },
  {
    id: "post_visit_review",
    name: "Demande d'avis",
    description: "Demander un avis 24h après la visite",
    type: "review",
  },
  {
    id: "loyalty_reward",
    name: "Récompense fidélité",
    description: "Notifier le client lorsqu'il atteint un palier de fidélité",
    type: "loyalty",
  },
];

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();

  const existing = await db.liveMetric.findMany({
    where: {
      restaurantId,
      metricType: { startsWith: "automation:" },
    },
    select: { metricType: true, value: true },
  });

  const rules = DEFAULT_RULES.map((def) => {
    const dbRule = existing.find((e) => e.metricType === `automation:${def.id}`);
    return {
      ...def,
      enabled: dbRule?.value === 1,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Automatisations</h1>
        <Link
          href={`/${locale}/admin/crm`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au CRM
        </Link>
      </header>

      <p className="mt-4 text-sm text-shell-dim">
        Configurez des règles automatiques pour fidéliser vos clients et
        améliorer leur expérience.
      </p>

      <div className="mt-8">
        <AutomationsInterface rules={rules} restaurantId={restaurantId} />
      </div>
    </div>
  );
}
