import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-section sm:px-8">
      <SectionHeader
        title="My Profile"
        subtitle="Update your personal information"
      />

      <form className="mt-10 space-y-6">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">Name</label>
          <input
            type="text"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">Phone</label>
          <input
            type="tel"
            dir="ltr"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
