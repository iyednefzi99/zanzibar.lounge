import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Compare Plans"
        subtitle="See what's included in each plan"
      />

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-shell/20">
              <th className="py-4 pr-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">Feature</th>
              <th className="py-4 px-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">Starter</th>
              <th className="py-4 px-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">Pro</th>
              <th className="py-4 pl-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">Enterprise</th>
            </tr>
          </thead>
          <tbody className="text-shell-dim">
            {[
              { f: "Online Booking", s: true, p: true, e: true },
              { f: "AI Concierge", s: false, p: true, e: true },
              { f: "WhatsApp", s: false, p: true, e: true },
              { f: "Multi-location", s: false, p: false, e: true },
              { f: "Custom Integrations", s: false, p: false, e: true },
            ].map((row) => (
              <tr key={row.f} className="border-b border-shell/10">
                <td className="py-3 pr-4 text-shell">{row.f}</td>
                <td className="py-3 px-4">{row.s ? "✓" : "—"}</td>
                <td className="py-3 px-4">{row.p ? "✓" : "—"}</td>
                <td className="py-3 pl-4">{row.e ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
