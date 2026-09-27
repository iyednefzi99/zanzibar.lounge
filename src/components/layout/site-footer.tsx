import Link from "next/link";

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
    {
      href: site.social.instagram,
      label: "Instagram",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      href: site.social.facebook,
      label: "Facebook",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      href: site.social.tripadvisor,
      label: "TripAdvisor",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.006 4.295c-2.67 0-5.338.784-7.654 2.353H0l1.973 2.155c.276-.159.578-.288.902-.387l-.396-2.354h2.772c2.135-1.403 4.665-2.153 7.293-2.153h4.82l-2.063 2.155c.317.095.613.22.885.375L18.89 4.295h-6.884zM5.465 8.164a8.207 8.207 0 00-.435.029 7.932 7.932 0 00-3.846 1.27L3.15 11.59a7.935 7.935 0 013.783-1.12c.16 0 .318.004.476.013l-1.944-2.319zm13.07 0l-1.944 2.32c.159-.01.317-.014.477-.014a7.935 7.935 0 013.782 1.12l1.764-2.127a7.933 7.933 0 00-3.847-1.27 8.221 8.221 0 00-.232-.03zM12 8.481a5.523 5.523 0 00-5.519 5.519A5.523 5.523 0 0012 19.52a5.523 5.523 0 005.519-5.52A5.523 5.523 0 0012 8.481zm0 9.195a3.676 3.676 0 01-3.676-3.676A3.676 3.676 0 0112 10.324a3.676 3.676 0 013.676 3.676A3.676 3.676 0 0112 17.676zm5.468-9.512a1.838 1.838 0 100 3.676 1.838 1.838 0 000-3.676zm-10.936 0a1.838 1.838 0 100 3.676 1.838 1.838 0 000-3.676z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="mt-24 bg-deep">
      <div className="brass-rule" />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl text-shell">{site.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-shell-dim">
            {dictionary.footer.tagline}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {social.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-shell/20 text-shell-dim transition-all duration-300 hover:border-brass hover:bg-brass/10 hover:text-brass hover:shadow-lg hover:shadow-brass/10"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <address className="text-sm not-italic text-shell-dim">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.footer.follow}
          </p>
          {site.address.street}
          <br />
          {site.address.postalCode} {site.address.city}
          <br />
          {site.address.region}
          <br />
          <a
            href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-shell transition-colors duration-200 hover:text-brass"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {formatPhone(site.contact.phone.replace(/\s/g, ""))}
          </a>
        </address>

        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {dictionary.footer.follow}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/carte`} className="inline-flex min-h-11 items-center text-shell transition-colors duration-200 hover:text-brass">
                {dictionary.nav.menu}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/reserver`} className="inline-flex min-h-11 items-center text-shell transition-colors duration-200 hover:text-brass">
                {dictionary.nav.book}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/galerie`} className="inline-flex min-h-11 items-center text-shell transition-colors duration-200 hover:text-brass">
                {dictionary.nav.gallery}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-shell/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8">
          <p className="font-mono text-xs text-shell-dim/80">
            © {new Date().getFullYear()} {site.name}. {dictionary.footer.rights}
          </p>
          <p className="font-mono text-xs text-shell-dim/60">
            Crafted with care in Medjez el Bab
          </p>
        </div>
      </div>
    </footer>
  );
}
