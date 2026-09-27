import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function GuestLoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-section sm:px-8">
      <SectionHeader
        as="h1"
        title="Loyalty Program"
        subtitle="Earn points with every visit and unlock rewards"
      />

      <div className="mt-10">
        {/* Points card */}
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Your Points</p>
          <p className="mt-4 font-display text-6xl text-brass">0</p>
          <p className="mt-2 text-sm text-shell-dim">Sign in to start earning</p>
        </div>

        {/* Tiers */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { name: "Bronze", points: "0-99", perks: "5% off" },
            { name: "Silver", points: "100-299", perks: "10% off" },
            { name: "Gold", points: "300+", perks: "15% off + free dessert" },
          ].map((tier) => (
            <div key={tier.name} className="glass-card rounded-xl p-5 text-center">
              <h3 className="font-display text-lg text-shell">{tier.name}</h3>
              <p className="mt-1 font-mono text-xs text-brass">{tier.points} pts</p>
              <p className="mt-2 text-sm text-shell-dim">{tier.perks}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
