import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Events"
        subtitle="Live music, themed nights, and special gatherings at E-Coffee Node"
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Live Acoustic Night", date: "Every Friday", desc: "Unwind with live acoustic performances from local artists" },
          { title: "Shisha & Jazz", date: "Every Saturday", desc: "Smooth jazz paired with our premium shisha selection" },
          { title: "Brunch Sundays", date: "Every Sunday", desc: "Special brunch menu with unlimited fresh juices" },
        ].map((event) => (
          <article
            key={event.title}
            className="glass-card group overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
          >
            <div className="aspect-[16/9] bg-gradient-to-br from-brass/15 via-deep to-lagoon/10" />
            <div className="p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">{event.date}</p>
              <h3 className="mt-2 font-display text-xl text-shell">{event.title}</h3>
              <p className="mt-2 text-sm text-shell-dim">{event.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
