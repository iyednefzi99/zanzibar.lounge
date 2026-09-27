import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

import { cn } from "@/lib/cn";

export const Card = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    glass?: boolean;
    hover?: boolean;
    accent?: boolean;
    children: ReactNode;
  }
>(
  (
    {
      glass = true,
      hover = false,
      accent = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-6",
          glass && "glass-card",
          hover && "card-hover",
          accent && "card-accent-top",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
