import { SectionHeader } from "@/components/ui/section-header";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import { fill } from "@/i18n";
import type { Locale } from "@/i18n/config";

const zoneGradients: Record<string, string> = {
  terrasse: "from-lagoon/20 via-night to-deep",
  salle: "from-brass/15 via-night to-deep",
  salon: "from-coral/15 via-night to-deep",
};

const zoneIcons: Record<string, React.ReactNode> = {
  terrasse: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  salle: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  salon: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
};

export function AboutSection({
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const zones: Array<"terrasse" | "salle" | "salon"> = ["terrasse", "salle", "salon"];

  return (
    <section className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader
        eyebrow={dictionary.about.zones.title}
        title={dictionary.about.title}
      />

      <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-shell-dim">
        {dictionary.about.body}
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {zones.map((zoneId) => {
          const zone = dictionary.about.zones[zoneId];
          const capacity = site.zones.find((z) => z.id === zoneId)?.capacity;
          return (
            <article
              key={zoneId}
              className="group relative overflow-hidden rounded-2xl border border-shell/8 card-hover"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${zoneGradients[zoneId]} opacity-60 transition-opacity duration-500 group-hover:opacity-80`} />

              <div className="relative p-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-3 text-brass">
                  {zoneIcons[zoneId]}
                </div>

                <h3 className="font-display text-2xl text-brass transition-colors duration-300 group-hover:text-brass/90">
                  {zone.name}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-shell-dim">
                  {zone.body}
                </p>

                {capacity && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-deep/60 px-3 py-1.5">
                    <svg className="h-4 w-4 text-shell-dim/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span className="font-mono text-xs tracking-widest tabular-nums text-shell-dim/80">
                      {fill(dictionary.about.covers, { count: capacity })}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="brass-rule mt-16" />
    </section>
  );
}
