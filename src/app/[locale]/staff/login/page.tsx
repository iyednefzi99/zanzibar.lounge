import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function StaffLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-sm py-section">
      <PageHeader title="Staff Login" subtitle="Sign in to access the staff dashboard" />

      <form className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">Phone</label>
          <input
            type="tel"
            dir="ltr"
            placeholder="+216 20 123 456"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-brass">PIN</label>
          <input
            type="password"
            maxLength={6}
            placeholder="••••••"
            className="w-full rounded-xl border border-shell/20 bg-deep/50 px-4 py-3 text-shell outline-none transition-colors focus:border-brass"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
