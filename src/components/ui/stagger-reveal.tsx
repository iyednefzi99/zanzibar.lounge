import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function StaggerReveal({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const delay = index * 80;

  return (
    <div
      className={cn("on-scroll", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
