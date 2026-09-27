import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function OwnerOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-section sm:px-8">
      <SectionHeader title="Onboarding" subtitle="Complete your restaurant setup" />
      <div className="mt-10 space-y-6">
        {["Restaurant Profile", "Menu Setup", "Staff Invites", "Payment Setup", "Go Live"].map((step, i) => (
          <div key={step} className="glass-card flex items-center gap-4 rounded-xl p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/10 font-mono text-sm text-brass">
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-shell">{step}</p>
            </div>
            {i < 2 ? (
              <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-xs text-lagoon">Done</span>
            ) : (
              <span className="rounded-full bg-shell/10 px-2 py-0.5 text-xs text-shell-dim">Pending</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
