import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  as: Heading = "h2",
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-brass">
          {eyebrow}
        </p>
      )}
      <div className={cn("brass-rule mx-auto mb-8 max-w-16", align === "left" && "mx-0")} />
      <Heading className="font-display text-4xl text-shell sm:text-5xl">{title}</Heading>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-shell-dim">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
