import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <div className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader
        title={dictionary.discover.title}
        subtitle={dictionary.discover.description}
      />

      {/* Search bar */}
      <div className="mt-8 flex gap-3">
        <input
          type="text"
          placeholder={dictionary.discover.search}
          className="flex-1 rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
        />
        <button
          type="button"
          className="inline-flex min-h-12 items-center rounded-full bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      {/* Featured restaurants placeholder */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="glass-card group overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
          >
            <div className="aspect-[16/9] bg-gradient-to-br from-lagoon/10 via-deep to-brass/10" />
            <div className="p-5">
              <h3 className="font-display text-lg text-shell">Restaurant {i + 1}</h3>
              <p className="mt-1 text-sm text-shell-dim">Medjez el Bab, Tunisia</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
