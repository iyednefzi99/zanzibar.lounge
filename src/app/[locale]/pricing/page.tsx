import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Pricing Plans"
        subtitle="Choose the plan that works for your restaurant"
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Starter", price: "Free", features: ["Basic booking", "Up to 50 covers/day", "Email support"] },
          { name: "Pro", price: "49 TND/mo", features: ["Unlimited bookings", "AI concierge", "WhatsApp integration", "Priority support"] },
          { name: "Enterprise", price: "Custom", features: ["Multi-location", "Custom integrations", "Dedicated support", "SLA guarantee"] },
        ].map((plan) => (
          <div
            key={plan.name}
            className={`glass-card rounded-2xl p-6 ${plan.name === "Pro" ? "ring-2 ring-brass" : ""}`}
          >
            {plan.name === "Pro" && (
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-brass">Most Popular</p>
            )}
            <h3 className="font-display text-2xl text-shell">{plan.name}</h3>
            <p className="mt-2 font-mono text-3xl text-brass">{plan.price}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-shell-dim">
                  <svg className="h-4 w-4 text-lagoon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-sm font-medium transition-all ${
                plan.name === "Pro"
                  ? "bg-brass text-deep hover:bg-brass/90"
                  : "border border-shell/25 text-shell hover:border-brass hover:text-brass"
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
