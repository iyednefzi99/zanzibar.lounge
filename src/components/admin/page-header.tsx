import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-shell/10 pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl leading-tight text-shell sm:text-[1.7rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-shell-dim">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
