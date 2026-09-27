import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function GradientText({
  children,
  variant = "default",
  as: Tag = "span",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "warm";
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        variant === "warm" ? "text-gradient-warm" : "text-gradient",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
