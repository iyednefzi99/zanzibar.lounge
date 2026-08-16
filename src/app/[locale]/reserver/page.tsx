import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking-form";
import { OpenBadge } from "@/components/open-badge";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { isOtpRequired } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { toISODate } from "@/lib/time";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const whatsapp = normalizePhone(site.contact.whatsapp);

  // La date du jour se calcule côté serveur, dans le fuseau de la maison :
  // un client à Paris ne doit pas se voir proposer la veille tunisienne.
  const todayISO = toISODate(new Date(), site.timezone);

  return (
    <>
      <header className="mx-auto max-w-3xl px-5 pt-16 pb-10 sm:px-8">
        <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dictionary.booking.title}
        </h1>
        <p className="reveal reveal-1 mt-4 max-w-xl text-shell-dim">
          {dictionary.booking.lead}
        </p>
        <OpenBadge dictionary={dictionary} className="reveal reveal-2 mt-6" />
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <BookingForm
          locale={locale}
          dictionary={dictionary}
          todayISO={todayISO}
          requireCode={isOtpRequired()}
        />

        {whatsapp && (
          <aside className="mt-14 rounded-2xl border border-lagoon/30 bg-lagoon/5 p-6">
            <p className="text-sm text-shell-dim">{dictionary.booking.orChat}</p>
            <a
              href={`https://wa.me/${whatsapp.slice(1)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block font-medium text-lagoon hover:text-brass"
            >
              {dictionary.hero.bookWhatsapp} →
            </a>
          </aside>
        )}
      </div>
    </>
  );
}
