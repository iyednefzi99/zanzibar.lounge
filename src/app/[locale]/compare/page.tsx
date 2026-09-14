import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comparaison | E-Coffee Node vs OpenTable vs Resy vs TheFork",
  description:
    "Comparez E-Coffee Node avec OpenTable, Resy et TheFork. Découvrez pourquoi E-Coffee Node est la meilleure solution pour les restaurants modernes.",
  openGraph: {
    title: "Comparaison | E-Coffee Node vs OpenTable vs Resy vs TheFork",
    description:
      "Comparez E-Coffee Node avec OpenTable, Resy et TheFork.",
  },
};

type Feature = {
  name: string;
  eccoffee: boolean;
  opentable: boolean;
  resy: boolean;
  thefork: boolean;
};

const features: Feature[] = [
  { name: "Réservations en ligne", eccoffee: true, opentable: true, resy: true, thefork: true },
  { name: "Widget personnalisable", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Chat IA WhatsApp", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Voice AI", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Commandes en ligne", eccoffee: true, opentable: false, resy: false, thefork: true },
  { name: "CRM & fidélité", eccoffee: true, opentable: false, resy: true, thefork: false },
  { name: "POS intégré", eccoffee: true, opentable: true, resy: false, thefork: false },
  { name: "Plan de salle", eccoffee: true, opentable: true, resy: true, thefork: false },
  { name: "Kitchen Display System", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Analytics avancés", eccoffee: true, opentable: true, resy: true, thefork: true },
  { name: "A/B testing", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Multi-propriétés", eccoffee: true, opentable: true, resy: false, thefork: true },
  { name: "API ouverte", eccoffee: true, opentable: true, resy: true, thefork: false },
  { name: "Notifications push", eccoffee: true, opentable: false, resy: true, thefork: false },
  { name: "Événements", eccoffee: true, opentable: false, resy: true, thefork: false },
  { name: "Parrainage & waitlist", eccoffee: true, opentable: false, resy: false, thefork: false },
  { name: "Multi-langues (10)", eccoffee: true, opentable: true, resy: false, thefork: true },
  { name: "Tarification transparente", eccoffee: true, opentable: false, resy: false, thefork: false },
];

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="text-center">
        <h1 className="font-display text-4xl text-shell sm:text-5xl">
          Comparaison
        </h1>
        <p className="mt-4 text-lg text-shell-dim">
          Voir pourquoi les restaurateurs choisissent E-Coffee Node.
        </p>
      </header>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-shell/12">
              <th className="py-4 pe-4 font-display text-lg text-shell">
                Fonctionnalité
              </th>
              <th className="px-4 py-4 text-center">
                <span className="inline-block rounded-full border border-brass bg-brass/10 px-3 py-1 font-display text-sm text-brass">
                  E-Coffee Node
                </span>
              </th>
              <th className="px-4 py-4 text-center font-display text-sm text-shell-dim">
                OpenTable
              </th>
              <th className="px-4 py-4 text-center font-display text-sm text-shell-dim">
                Resy
              </th>
              <th className="px-4 py-4 text-center font-display text-sm text-shell-dim">
                TheFork
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shell/8">
            {features.map((feature) => (
              <tr key={feature.name} className="hover:bg-deep/30">
                <td className="py-3 pe-4 text-shell">{feature.name}</td>
                <td className="px-4 py-3 text-center">
                  <CheckMark checked={feature.eccoffee} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckMark checked={feature.opentable} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckMark checked={feature.resy} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckMark checked={feature.thefork} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-display text-xl text-shell">Pourquoi E-Coffee Node ?</h2>
          <ul className="mt-4 space-y-3 text-sm text-shell-dim">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lagoon">✓</span>
              Tout-en-un : réservations, commandes, CRM, voix IA
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lagoon">✓</span>
              Tarification fixe, pas de commissions par réservation
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lagoon">✓</span>
              IA conversationnelle multilingue intégrée
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lagoon">✓</span>
              Données 100% propriétaires, RGPD natif
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-display text-xl text-shell">Les inconvénients des autres</h2>
          <ul className="mt-4 space-y-3 text-sm text-shell-dim">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-coral">✕</span>
              OpenTable : commissions élevées par couvert
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-coral">✕</span>
              Resy : orienté grandes villes, peu flexible
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-coral">✕</span>
              TheFork : commission par réservation, moins d&apos;outils
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href={`/${locale}/pricing`}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          Voir les tarifs
        </Link>
      </div>
    </div>
  );
}

function CheckMark({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-lagoon/15 text-lagoon">
      ✓
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-coral/10 text-coral/60">
      ✕
    </span>
  );
}
