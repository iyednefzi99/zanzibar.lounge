import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarifs | E-Coffee Node",
  description:
    "Choisissez le plan adapté à votre restaurant. Gratuit, Starter à 29€/mois, Pro à 79€/mois ou Enterprise à 199€/mois.",
  openGraph: {
    title: "Tarifs | E-Coffee Node",
    description:
      "Choisissez le plan adapté à votre restaurant. Gratuit, Starter à 29€/mois, Pro à 79€/mois ou Enterprise à 199€/mois.",
  },
};

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "/mois",
    description: "Pour découvrir E-Coffee Node sans engagement.",
    features: [
      "50 réservations/mois",
      "1 membre d'équipe",
      "Widget de réservation",
      "Support par email",
    ],
    cta: "Commencer",
    ctaHref: "/onboard",
    highlight: false,
  },
  {
    name: "Starter",
    price: "29",
    period: "€/mois",
    description: "Pour les petits restaurants qui veulent se structurer.",
    features: [
      "500 réservations/mois",
      "5 membres d'équipe",
      "Gestion du menu",
      "Chat IA (WhatsApp)",
      "Statistiques de base",
      "Notifications push",
    ],
    cta: "Choisir Starter",
    ctaHref: "/onboard?plan=STARTER",
    highlight: false,
  },
  {
    name: "Pro",
    price: "79",
    period: "€/mois",
    description: "Pour les restaurants ambitieux. Notre plan le plus populaire.",
    features: [
      "Réservations illimitées",
      "15 membres d'équipe",
      "Commandes en ligne",
      "CRM & fidélité",
      "Analytics avancés",
      "Voice AI",
      "POS intégré",
      "A/B testing",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    ctaHref: "/onboard?plan=PRO",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "199",
    period: "€/mois",
    description: "Pour les groupes et chaînes multi-établissements.",
    features: [
      "Tout du plan Pro",
      "Équipes illimitées",
      "Multi-propriétés",
      "API dédiée",
      "Personnalisation blanche",
      "Successeur dédié",
      "SLA garanti",
      "Facturation sur mesure",
    ],
    cta: "Contacter l'équipe",
    ctaHref: "/contact",
    highlight: false,
  },
];

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="text-center">
        <h1 className="font-display text-4xl text-shell sm:text-5xl">
          Tarifs simples, transparents
        </h1>
        <p className="mt-4 text-lg text-shell-dim">
          Pas de frais cachés. Pas de surprises. Annulez quand vous voulez.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-xl border p-6 ${
              plan.highlight
                ? "border-brass bg-brass/5"
                : "border-shell/12 bg-deep/40"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 start-6 rounded-full bg-brass px-3 py-1 font-mono text-xs font-medium text-deep">
                Populaire
              </span>
            )}

            <h2 className="font-display text-2xl text-shell">{plan.name}</h2>
            <p className="mt-2 text-sm text-shell-dim">{plan.description}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl text-shell">
                {plan.price}
              </span>
              <span className="text-sm text-shell-dim">{plan.period}</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-shell-dim"
                >
                  <span className="mt-0.5 text-lagoon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}${plan.ctaHref}`}
              className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors ${
                plan.highlight
                  ? "border-brass bg-brass text-deep hover:bg-brass/90"
                  : "border-shell/25 text-shell hover:border-brass hover:text-brass"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-shell-dim">
          Tous les plans incluent l&apos;hébergement, les mises à jour et le
          support technique.
        </p>
        <p className="mt-2 text-sm text-shell-dim">
          Besoin d&apos;un plan sur mesure ?{" "}
          <Link href={`/${locale}/contact`} className="text-brass hover:underline">
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}
