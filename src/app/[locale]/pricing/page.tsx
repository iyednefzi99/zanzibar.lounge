import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs | E-Coffee Node",
  description: "Choisissez le plan adapté à votre restaurant",
};

const plans = [
  {
    name: "Starter",
    price: "29",
    period: "/mois",
    description: "Pour les petits restaurants",
    features: [
      "Réservations en ligne",
      "Jusqu'à 50 réservations/mois",
      "1 compte staff",
      "Widget de réservation",
      "Notifications email",
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Professional",
    price: "79",
    period: "/mois",
    description: "Le plus populaire",
    features: [
      "Réservations illimitées",
      "10 comptes staff",
      "Gestion du floor plan",
      "POS integration",
      "CRM & campagnes",
      "Analytics avancés",
      "Support prioritaire",
    ],
    cta: "Essayer 14 jours",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "199",
    period: "/mois",
    description: "Pour les chaînes et groupes",
    features: [
      "Multi-sites",
      "Staff illimité",
      "API complète",
      "Intégrations avancées",
      "White-label",
      "Account manager dédié",
      "SLA garanti",
    ],
    cta: "Contacter les ventes",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div className="text-center">
        <h1 className="font-display text-4xl text-shell">Des tarifs simples</h1>
        <p className="mt-4 text-shell-dim">
          Pas de frais cachés. Annulez quand vous voulez.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-6 ${
              plan.popular
                ? "border-brass bg-brass/5 ring-2 ring-brass"
                : "border-shell/10 bg-deep/40"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brass px-3 py-1 text-xs font-medium text-deep">
                Populaire
              </div>
            )}
            <p className="font-display text-lg text-shell">{plan.name}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-shell">{plan.price}</span>
              <span className="text-sm text-shell-dim">DT{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-shell-dim">{plan.description}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-shell-dim">
                  <span className="text-brass">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                plan.popular
                  ? "bg-brass text-deep hover:bg-brass-glow"
                  : "border border-shell/10 text-shell hover:bg-shell/5"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="font-display text-2xl text-shell">Questions fréquentes</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
            <p className="font-medium text-shell">Puis-je changer de plan ?</p>
            <p className="mt-2 text-sm text-shell-dim">
              Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment.
            </p>
          </div>
          <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
            <p className="font-medium text-shell">Y a-t-il un engagement ?</p>
            <p className="mt-2 text-sm text-shell-dim">
              Non, tous nos plans sont sans engagement. Annulez quand vous voulez.
            </p>
          </div>
          <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
            <p className="font-medium text-shell">Offrez-vous une réduction annuelle ?</p>
            <p className="mt-2 text-sm text-shell-dim">
              Oui, payez annuellement et économisez 20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
