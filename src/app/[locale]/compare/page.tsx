import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparaison | E-Coffee Node vs Concurrence",
  description: "Découvrez pourquoi E-Coffee Node est la meilleure solution",
};

const features = [
  { name: "Réservations en ligne", ecoffee: true, opentable: true, resy: true, fork: true },
  { name: "Widget personnalisable", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "Chat IA multilingue", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "Voice AI (Twilio)", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "CRM intégré", ecoffee: true, opentable: true, resy: false, fork: false },
  { name: "Marketing automation", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "POS integration", ecoffee: true, opentable: true, resy: false, fork: true },
  { name: "Kitchen Display System", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "Staff scheduling", ecoffee: true, opentable: true, resy: false, fork: false },
  { name: "Multi-tenant (SaaS)", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "Open source", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "API complète", ecoffee: true, opentable: true, resy: true, fork: false },
  { name: "Blanc / White-label", ecoffee: true, opentable: false, resy: false, fork: false },
  { name: "Analytics IA", ecoffee: true, opentable: true, resy: true, fork: false },
  { name: "10 langues", ecoffee: true, opentable: true, resy: false, fork: false },
  { name: "Prix", ecoffee: "29-199€", opentable: "249$+", resy: "Invitation", fork: "Sur devis" },
];

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="font-display text-4xl text-shell">Pourquoi E-Coffee Node ?</h1>
        <p className="mt-4 text-shell-dim">
          Comparaison avec les alternatives du marché
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shell/10">
              <th className="p-4 text-left text-shell-dim">Fonctionnalité</th>
              <th className="p-4 text-center text-brass font-bold">E-Coffee</th>
              <th className="p-4 text-center text-shell-dim">OpenTable</th>
              <th className="p-4 text-center text-shell-dim">Resy</th>
              <th className="p-4 text-center text-shell-dim">TheFork</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.name} className="border-b border-shell/5">
                <td className="p-4 text-shell">{f.name}</td>
                <td className="p-4 text-center">
                  {typeof f.ecoffee === "boolean" ? (
                    f.ecoffee ? (
                      <span className="text-brass text-lg">✓</span>
                    ) : (
                      <span className="text-shell-dim">✗</span>
                    )
                  ) : (
                    <span className="text-brass font-medium">{f.ecoffee}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {typeof f.opentable === "boolean" ? (
                    f.opentable ? (
                      <span className="text-brass text-lg">✓</span>
                    ) : (
                      <span className="text-shell-dim">✗</span>
                    )
                  ) : (
                    <span className="text-shell-dim">{f.opentable}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {typeof f.resy === "boolean" ? (
                    f.resy ? (
                      <span className="text-brass text-lg">✓</span>
                    ) : (
                      <span className="text-shell-dim">✗</span>
                    )
                  ) : (
                    <span className="text-shell-dim">{f.resy}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {typeof f.fork === "boolean" ? (
                    f.fork ? (
                      <span className="text-brass text-lg">✓</span>
                    ) : (
                      <span className="text-shell-dim">✗</span>
                    )
                  ) : (
                    <span className="text-shell-dim">{f.fork}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
