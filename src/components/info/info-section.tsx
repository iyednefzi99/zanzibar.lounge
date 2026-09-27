import { SectionHeader } from "@/components/ui/section-header";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatPhone, normalizePhone } from "@/lib/phone";

export function InfoSection({
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const whatsapp = normalizePhone(site.contact.whatsapp);

  return (
    <section id="infos" className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader title={dictionary.info.title} />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Address */}
        <div className="group card-accent-top glass-card rounded-2xl p-6 card-hover">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-2.5 text-brass">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.info.address}
          </h3>
          <address className="mt-3 text-sm leading-relaxed text-shell not-italic">
            {site.address.street}<br />
            {site.address.postalCode} {site.address.city}<br />
            {site.address.region}
          </address>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${site.address.lat},${site.address.lng}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-lagoon transition-colors duration-200 hover:text-brass"
          >
            {dictionary.info.directions}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

        {/* Hours */}
        <div className="group card-accent-top glass-card rounded-2xl p-6 card-hover">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-2.5 text-brass">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.info.hours}
          </h3>
          <ul className="mt-3 space-y-1.5 font-mono text-sm">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const hours = site.hours.find((h) => h.day === day);
              return (
                <li key={day} className="flex justify-between gap-6">
                  <span className="text-shell-dim">{dictionary.days.short[day]}</span>
                  <span className="tabular-nums text-shell" dir="ltr">
                    {hours
                      ? `${hours.open} – ${hours.close.replace("26:00", "02:00")}`
                      : dictionary.info.closed}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Contact */}
        <div className="group card-accent-top glass-card rounded-2xl p-6 card-hover">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-2.5 text-brass">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.info.contact}
          </h3>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <a
                href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-shell transition-colors duration-200 hover:text-brass"
                dir="ltr"
              >
                <svg className="h-4 w-4 text-shell-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {formatPhone(site.contact.phone)}
              </a>
            </li>
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.slice(1)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-shell transition-colors duration-200 hover:text-brass"
                >
                  <svg className="h-4 w-4 text-shell-dim" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {dictionary.info.whatsapp}
                </a>
              </li>
            )}
            <li>
              <a
                href={site.social.tripadvisor}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-shell-dim transition-colors duration-200 hover:text-brass"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                {dictionary.info.reviews}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
