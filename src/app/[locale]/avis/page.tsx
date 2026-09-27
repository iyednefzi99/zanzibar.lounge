import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export default async function AvisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <div className="mx-auto max-w-2xl px-5 py-section sm:px-8">
      <SectionHeader
        as="h1"
        title={dictionary.reviews.title}
        subtitle={dictionary.reviews.lead}
      />

      <form className="mt-10 space-y-6">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.reviews.titleField}
          </label>
          <input
            type="text"
            placeholder={dictionary.reviews.namePlaceholder}
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.reviews.rating}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="h-8 w-8 text-shell/30 transition-colors hover:text-brass"
              >
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.reviews.comment}
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass resize-none"
          />
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          {dictionary.reviews.submit}
        </button>
      </form>
    </div>
  );
}
