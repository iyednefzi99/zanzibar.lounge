import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { site } from "@/content/site";

export default async function GaleriePage({
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
        eyebrow={dictionary.gallery.lead}
        title={dictionary.gallery.title}
      />

      {/* Placeholder gallery grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="glass-card group relative aspect-[4/3] overflow-hidden rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brass/10 via-deep to-lagoon/10 transition-opacity group-hover:opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-12 w-12 text-shell/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Instagram link */}
      <div className="mt-10 text-center">
        <a
          href={site.social.instagram}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-shell/25 px-8 text-sm text-shell transition-all hover:border-brass hover:text-brass"
        >
          {dictionary.gallery.instagram}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      <div className="brass-rule mt-16" />
    </div>
  );
}
