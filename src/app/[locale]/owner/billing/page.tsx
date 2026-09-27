import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function OwnerBillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader title="Billing" subtitle="Manage your subscription and payments" />

      <div className="mt-10 space-y-6">
        {/* Current plan */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Current Plan</p>
              <p className="mt-2 font-display text-2xl text-shell">Pro</p>
              <p className="text-sm text-shell-dim">49 TND/month</p>
            </div>
            <button type="button" className="rounded-full border border-shell/25 px-5 py-2 text-sm text-shell transition-colors hover:border-brass hover:text-brass">
              Change Plan
            </button>
          </div>
        </div>

        {/* Payment method */}
        <div className="glass-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Payment Method</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-shell/10 font-mono text-xs text-shell-dim">
              •••• 4242
            </div>
            <div>
              <p className="text-sm text-shell">Visa ending in 4242</p>
              <p className="text-xs text-shell-dim">Expires 12/2027</p>
            </div>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="glass-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Recent Invoices</p>
          <div className="mt-4 space-y-3">
            {[
              { date: "Sep 2026", amount: "49 TND", status: "Paid" },
              { date: "Aug 2026", amount: "49 TND", status: "Paid" },
              { date: "Jul 2026", amount: "49 TND", status: "Paid" },
            ].map((invoice) => (
              <div key={invoice.date} className="flex items-center justify-between border-b border-shell/10 py-3 last:border-0">
                <span className="text-sm text-shell">{invoice.date}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brass">{invoice.amount}</span>
                  <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-xs text-lagoon">{invoice.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
