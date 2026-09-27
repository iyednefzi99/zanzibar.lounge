import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "brass" | "lagoon" | "coral" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-shell/10 text-shell-dim",
  brass: "border border-brass/30 bg-brass/5 text-brass",
  lagoon: "border border-lagoon/30 bg-lagoon/5 text-lagoon",
  coral: "border border-coral/30 bg-coral/5 text-coral",
  outline: "border border-shell/20 text-shell-dim",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
