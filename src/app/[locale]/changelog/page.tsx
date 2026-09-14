import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | E-Coffee Node",
  description: "Dernières mises à jour et nouveautés",
};

const entries = [
  {
    version: "2.0",
    date: "Septembre 2026",
    title: "Phase 19 — Paiements & Anti No-Show",
    changes: [
      "Configuration des paiements (acompte, pré-autorisation)",
      "Split de addition entre convives",
      "Frais d'annulation et no-show configurables",
      "Intégration Stripe pour pré-autorisations",
    ],
  },
  {
    version: "2.0",
    date: "Septembre 2026",
    title: "Phase 18 — CRM & Marketing",
    changes: [
      "Segmentation clients (VIP, réguliers, occasionnels, nouveaux)",
      "Système de tags pour les invités",
      "Notes et timeline par invité",
      "Campagnes email automatiques",
      "Vue Guest360 complète",
    ],
  },
  {
    version: "2.0",
    date: "Septembre 2026",
    title: "Phase 17 — POS & Intégrations",
    changes: [
      "Intégration Toast POS",
      "Intégration Square POS",
      "Synchronisation automatique des commandes",
      "Email transactionnels via Resend",
      "Google Maps pour géocodage",
    ],
  },
  {
    version: "2.0",
    date: "Septembre 2026",
    title: "Phase 16 — Marketplace & Découverte",
    changes: [
      "Page de découverte avec recherche avancée",
      "Filtres par cuisine, prix, localisation",
      "Restaurants mis en avant",
      "SEO optimisé avec schema.org",
      "Réservation directe depuis la découverte",
    ],
  },
  {
    version: "1.0",
    date: "Août 2026",
    title: "Lancement initial",
    changes: [
      "Réservations en ligne",
      "Gestion du menu",
      "Affichage cuisine (KDS)",
      "Widget de réservation",
      "Chat IA multilingue",
      "Application mobile staff",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-shell">Changelog</h1>
        <p className="mt-2 text-sm text-shell-dim">Dernières mises à jour de la plateforme</p>
      </div>

      <div className="space-y-8">
        {entries.map((entry, i) => (
          <div key={i} className="relative pl-8">
            {/* Timeline line */}
            {i < entries.length - 1 && (
              <div className="absolute left-3 top-8 bottom-0 w-px bg-shell/10" />
            )}
            {/* Dot */}
            <div className="absolute left-1 top-1.5 size-3 rounded-full bg-brass" />

            <div className="rounded-xl border border-shell/10 bg-deep/40 p-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-brass">v{entry.version}</span>
                <span className="text-xs text-shell-dim">{entry.date}</span>
              </div>
              <h2 className="mt-2 font-display text-lg text-shell">{entry.title}</h2>
              <ul className="mt-3 space-y-1">
                {entry.changes.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-shell-dim">
                    <span className="mt-0.5 text-brass">→</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
