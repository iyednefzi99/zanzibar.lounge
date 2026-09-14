import type { SubscriptionPlan } from "@/generated/prisma/client";

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  FREE: { bg: "bg-shell/10", text: "text-shell-dim", border: "border-shell/25" },
  STARTER: { bg: "bg-lagoon/10", text: "text-lagoon", border: "border-lagoon/40" },
  PRO: { bg: "bg-brass/10", text: "text-brass", border: "border-brass/40" },
  ENTERPRISE: { bg: "bg-coral/10", text: "text-coral", border: "border-coral/40" },
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export function PlanBadge({
  plan,
  className = "",
}: {
  plan: SubscriptionPlan;
  className?: string;
}) {
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES.FREE;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}
