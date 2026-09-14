import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Changelog | E-Coffee Node",
  description:
    "Suivez les évolutions d'E-Coffee Node : nouvelles fonctionnalités, améliorations et corrections.",
  openGraph: {
    title: "Changelog | E-Coffee Node",
    description:
      "Suivez les évolutions d'E-Coffee Node : nouvelles fonctionnalités, améliorations et corrections.",
  },
};

type ChangelogEntry = {
  version: string;
  date: string;
  phase: string;
  features: string[];
};

const entries: ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "Septembre 2026",
    phase: "Bêta publique",
    features: [
      "Widget de réservation intégrable",
      "Chat IA WhatsApp (assistant conversationnel)",
      "Kitchen Display System",
      "Plan de salle interactif",
    ],
  },
  {
    version: "0.8.0",
    date: "Août 2026",
    phase: "Bêta privée",
    features: [
      "Commandes en ligne",
      "CRM & gestion des clients",
      "Système de fidélité",
      "Notifications push",
      "Analytics de base",
    ],
  },
  {
    version: "0.7.0",
    date: "Juillet 2026",
    phase: "Bêta privée",
    features: [
      "Voice AI (appels sortants / entrants)",
      "POS intégré (Toast, Square)",
      "A/B testing pour les menus",
      "Système de parrainage",
      "File d'attente virtuelle",
    ],
  },
  {
    version: "0.6.0",
    date: "Juin 2026",
    phase: "Alpha",
    features: [
      "Multi-langues (10 langues)",
      "Gestion des événements",
      "Intégration Google Calendar",
      "Apple Wallet passes",
    ],
  },
  {
    version: "0.5.0",
    date: "Mai 2026",
    phase: "Alpha",
    features: [
      "Authentification staff (session HMAC)",
      "Authentification invité (basée sur le téléphone)",
      "Double authentification (2FA TOTP)",
      "Journal d'audit de sécurité",
      "Clés API & webhooks signés",
    ],
  },
  {
    version: "0.4.0",
    date: "Avril 2026",
    phase: "Prototype",
    features: [
      "Gestion des réservations (CRUD)",
      "Disponibilité en temps réel",
      "Système de menu (catégories & articles)",
      "Gestion des stocks",
    ],
  },
  {
    version: "0.3.0",
    date: "Mars 2026",
    phase: "Prototype",
    features: [
      "Architecture multi-tenancy",
      "Authentification back-office (Basic Auth)",
      "Système de rôles (owner, manager, staff)",
    ],
  },
  {
    version: "0.2.0",
    date: "Février 2026",
    phase: "Conception",
    features: [
      "Modèle de données Prisma (55+ modèles)",
      "Configuration i18n (10 locales)",
      "Système de proxy edge (locale routing, CSP nonce)",
      "Validation d'environnement au démarrage",
    ],
  },
  {
    version: "0.1.0",
    date: "Janvier 2026",
    phase: "Conception",
    features: [
      "Initialisation du projet Next.js (App Router)",
      "Configuration Docker & Kubernetes",
      "Pipeline CI (lint, typecheck, test, build)",
      "Premiers tests unitaires (time, hours, phone)",
    ],
  },
];

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <header className="text-center">
        <h1 className="font-display text-4xl text-shell sm:text-5xl">
          Changelog
        </h1>
        <p className="mt-4 text-shell-dim">
          Les évolutions d&apos;E-Coffee Node, version après version.
        </p>
      </header>

      <div className="mt-12">
        <div className="relative border-l-2 border-shell/15 ps-8">
          {entries.map((entry, i) => (
            <div key={entry.version} className="relative pb-12 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -start-[1.35rem] top-1 size-3 rounded-full border-2 border-brass bg-deep"
              />

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-sm text-brass">
                  v{entry.version}
                </span>
                <span className="font-mono text-xs text-shell-dim">
                  {entry.date}
                </span>
                <span className="rounded-full border border-shell/20 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-shell-dim">
                  {entry.phase}
                </span>
              </div>

              <ul className="mt-3 space-y-1.5">
                {entry.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-shell-dim"
                  >
                    <span className="mt-0.5 text-lagoon">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
