import { notFound } from "next/navigation";
import Link from "next/link";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale, type Locale } from "@/i18n/config";

export default async function GuestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        title="My Account"
        subtitle="Manage your reservations, profile, and loyalty points"
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href={`/${typedLocale}/guest/reservations`}
          className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
        >
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-3 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-shell">Reservations</h3>
          <p className="mt-2 text-sm text-shell-dim">View and manage your upcoming bookings</p>
        </Link>

        <Link
          href={`/${typedLocale}/guest/profile`}
          className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
        >
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-3 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-shell">Profile</h3>
          <p className="mt-2 text-sm text-shell-dim">Update your personal information</p>
        </Link>

        <Link
          href={`/${typedLocale}/guest/loyalty`}
          className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
        >
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-3 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-shell">Loyalty</h3>
          <p className="mt-2 text-sm text-shell-dim">Check your points and rewards</p>
        </Link>

        <Link
          href={`/${typedLocale}/avis`}
          className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
        >
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brass/10 p-3 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-shell">Reviews</h3>
          <p className="mt-2 text-sm text-shell-dim">Share your experience</p>
        </Link>
      </div>
    </div>
  );
}
