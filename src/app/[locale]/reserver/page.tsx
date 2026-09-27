import { notFound } from "next/navigation";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = await getDictionary(locale);
  return { title: dictionary.booking.title };
}

export default async function ReserverPage({
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
      <div className="mb-10 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-brass">
          {dictionary.booking.lead}
        </p>
        <div className="brass-rule mx-auto mb-8 max-w-16" />
        <h1 className="font-display text-4xl text-shell sm:text-5xl">
          {dictionary.booking.title}
        </h1>
        <p className="mt-4 text-shell-dim">{dictionary.booking.orChat}</p>
      </div>

      <BookingWizard locale={typedLocale} dictionary={dictionary} />
    </div>
  );
}
