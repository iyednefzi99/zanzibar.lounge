import { requireAdmin } from "@/lib/admin-auth";
import { getTemplateList } from "@/lib/onboarding/templates";
import { OnboardingWizard } from "@/components/onboarding/onboarding-steps";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requireAdmin();
  const templates = getTemplateList();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-shell">Configuration</h1>
        <p className="mt-2 text-sm text-shell-dim">Configurez votre restaurant en quelques étapes</p>
      </div>
      <OnboardingWizard onComplete={async () => {}} templates={templates} />
    </div>
  );
}
