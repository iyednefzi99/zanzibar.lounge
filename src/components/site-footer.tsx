import Link from "next/link";

import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatPhone } from "@/lib/phone";

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const social = [
    { href: site.social.instagram, label: "Instagram" },
    { href: site.social.facebook, label: "Facebook" },
    { href: site.social.tripadvisor, label: "TripAdvisor" },
  ];

  return (
    <footer className="mt-24 bg-deep">
      <Studs />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-2xl text-shell">{site.name}</p>
          <p className="mt-2 text-sm text-shell-dim">
            {dictionary.footer.tagline}
          </p>
        </div>

        <address className="text-sm not-italic text-shell-dim">
          {site.address.street}
          <br />
          {site.address.postalCode} {site.address.city}
          <br />
          {site.address.region}
          <br />
          <a
            href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
            className="mt-3 inline-flex min-h-11 items-center font-mono text-shell hover:text-brass"
          >
            {formatPhone(site.contact.phone.replace(/\s/g, ""))}
          </a>
        </address>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
            {dictionary.footer.follow}
          </p>
          <ul className="mt-3 text-sm">
            {social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center text-shell hover:text-brass"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href={`/${locale}/reserver`}
                className="inline-flex min-h-11 items-center text-shell hover:text-brass"
              >
                {dictionary.nav.book}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <p className="font-mono text-xs text-shell-dim/80">
          © {new Date().getFullYear()} {site.name}. {dictionary.footer.rights}
        </p>
      </div>
    </footer>
  );
}
