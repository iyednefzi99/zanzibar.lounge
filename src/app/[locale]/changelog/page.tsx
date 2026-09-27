import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Changelog"
        subtitle="What's new at E-Coffee Node"
      />

      <div className="mt-10 space-y-8">
        {[
          { date: "September 2026", version: "2.0", changes: ["Complete frontend redesign", "New booking wizard", "Glass morphism UI system", "10 language support"] },
          { date: "August 2026", version: "1.5", changes: ["AI concierge launch", "WhatsApp integration", "Kitchen display system"] },
          { date: "July 2026", version: "1.0", changes: ["Initial launch", "Online booking", "Menu management"] },
        ].map((release) => (
          <div key={release.version} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brass/10 px-3 py-1 font-mono text-xs text-brass">v{release.version}</span>
              <span className="text-sm text-shell-dim">{release.date}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {release.changes.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-shell-dim">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
