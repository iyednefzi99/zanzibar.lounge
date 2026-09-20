import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";

export const revalidate = 3600;

export const metadata = {
  title: "Zanzibar Lounge — Réservations intelligentes pour restaurants",
  description:
    "Concierge WhatsApp IA, waitlist gamifiée, upsell intelligent. La plateforme SaaS qui transforme votre restaurant en expérience digitale premium.",
  keywords: [
    "reservation restaurant tunisie",
    "whatsapp business restaurant",
    "sas reservation",
    "concierge ia restaurant",
    "waitlist gamifiee",
    "upsell restaurant",
  ],
  openGraph: {
    title: "Zanzibar Lounge — Réservations intelligentes",
    description:
      "Concierge WhatsApp IA, waitlist gamifiée, upsell intelligent pour restaurants.",
    type: "website",
    locale: "fr_TN",
    siteName: "Zanzibar Lounge",
  },
};

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-brass">
            Plateforme SaaS pour restaurants
          </p>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-shell">
            Votre restaurant,
            <br />
            <span className="text-brass">intelligent</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-shell-dim">
            Concierge WhatsApp IA, waitlist gamifiée, upsell intelligent et
            réservations en ligne. Tout ce dont votre restaurant a besoin pour
            offrir une expérience premium.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/reserver`}
              className="rounded-full bg-brass px-8 py-4 font-medium text-deep transition-all hover:bg-brass/90 hover:shadow-xl hover:shadow-brass/25"
            >
              Réserver une démo
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-shell/20 px-8 py-4 font-medium text-shell transition-all hover:border-shell/40"
            >
              Découvrir les fonctionnalités
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-shell/10 bg-charcoal/30">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 py-12 sm:px-8 md:grid-cols-4">
          {[
            { value: "+40%", label: "Réservations" },
            { value: "-60%", label: "No-shows" },
            { value: "+25%", label: "Chiffre d'affaires" },
            { value: "24/7", label: "Concierge IA" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-brass">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-shell-dim">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-shell md:text-4xl">
          Tout-en-un pour votre restaurant
        </h2>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {[
            {
              icon: "💬",
              title: "Concierge WhatsApp IA",
              description:
                "Répond aux clients 24/7 en arabe, français et anglais. Gère les réservations, modifications, annulations et FAQs automatiquement.",
            },
            {
              icon: "🎮",
              title: "Waitlist Gamifiée",
              description:
                "Transformez l'attente en expérience. Les clients gagnent des points, débloquent des récompenses et partagent leur position.",
            },
            {
              icon: "🎯",
              title: "Upsell Intelligent",
              description:
                "Suggestions contextuelles basées sur l'heure, la météo et l'historique. Augmentez votre panier moyen de 25%.",
            },
            {
              icon: "📊",
              title: "Analytics Avancés",
              description:
                "Tableau de bord complet avec prédictions de demande, heatmap du floor, et métriques en temps réel.",
            },
            {
              icon: "💳",
              title: "Paiements Intégrés",
              description:
                "Flouci, D17, Stripe. Pré-autorisation, acomptes, et gestion des no-shows automatique.",
            },
            {
              icon: "🌍",
              title: "Multi-langues",
              description:
                "10 langues supportées dont arabe, français, anglais, allemand, et plus. Interface adaptée au Maghreb.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-shell/10 bg-charcoal/40 p-8 transition-all hover:border-brass/30"
            >
              <span className="text-4xl">{feature.icon}</span>
              <h3 className="mt-4 font-display text-xl font-bold text-shell">
                {feature.title}
              </h3>
              <p className="mt-3 leading-relaxed text-shell-dim">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-shell/10 bg-charcoal/20">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-shell md:text-4xl">
            Tarification transparente
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "299",
                description: "Pour les petits restaurants",
                features: [
                  "Réservations en ligne",
                  "Concierge WhatsApp (100 conversations/mois)",
                  "Analytics de base",
                  "Support par email",
                ],
              },
              {
                name: "Pro",
                price: "699",
                description: "Pour les restaurants établis",
                features: [
                  "Tout du Starter",
                  "Waitlist gamifiée",
                  "Upsell intelligent",
                  "Concierge IA illimité",
                  "Analytics avancés",
                  "Support prioritaire",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "1499",
                description: "Pour les groupes et chaînes",
                features: [
                  "Tout du Pro",
                  "Multi-propriétés",
                  "API personnalisée",
                  "Manager dédié",
                  "SLA 99.9%",
                  "Intégrations sur mesure",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-brass bg-brass/10"
                    : "border-shell/10 bg-charcoal/40"
                }`}
              >
                <h3 className="font-display text-xl font-bold text-shell">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-shell-dim">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="font-display text-4xl font-bold text-brass">
                    {plan.price}
                  </span>
                  <span className="text-shell-dim"> DT/mois</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-shell-dim">
                      <span className="text-brass">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/reserver`}
                  className={`mt-8 block rounded-full py-3 text-center font-medium transition-all ${
                    plan.highlighted
                      ? "bg-brass text-deep hover:bg-brass/90"
                      : "border border-shell/20 text-shell hover:border-shell/40"
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8">
        <h2 className="font-display text-3xl font-bold text-shell md:text-4xl">
          Prêt à transformer votre restaurant ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-shell-dim">
          Rejoignez les restaurants tunisiens qui ont déjà adopté Zanzibar
          Lounge. Configuration en 15 minutes, sans engagement.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/reserver`}
            className="rounded-full bg-brass px-8 py-4 font-medium text-deep transition-all hover:bg-brass/90 hover:shadow-xl hover:shadow-brass/25"
          >
            Réserver une démo gratuite
          </Link>
          <Link
            href="#features"
            className="rounded-full border border-shell/20 px-8 py-4 font-medium text-shell transition-all hover:border-shell/40"
          >
            Voir la démo
          </Link>
        </div>
      </section>
    </>
  );
}
