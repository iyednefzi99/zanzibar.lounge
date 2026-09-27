import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function OwnerSchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader title="Schedule" subtitle="Staff scheduling and shifts" />
      <div className="mt-10 glass-card rounded-2xl p-6">
        <p className="text-shell-dim">Schedule management coming soon</p>
      </div>
    </div>
  );
}
