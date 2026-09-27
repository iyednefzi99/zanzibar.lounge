import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export default async function WaitlistPage({
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
        title={dictionary.waitlist.title}
        subtitle={dictionary.waitlist.body}
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
            {dictionary.booking.fields.phone}
          </label>
          <input
            type="tel"
            placeholder={dictionary.booking.fields.phoneHint}
            dir="ltr"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          {dictionary.waitlist.join}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-shell-dim">
        {dictionary.waitlist.notificationHint}
      </p>
    </div>
  );
}
