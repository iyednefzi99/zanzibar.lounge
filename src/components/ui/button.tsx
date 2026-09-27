import Link from "next/link";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brass text-deep hover:bg-brass/90 hover:shadow-lg hover:shadow-brass/20 active:scale-[0.98]",
  secondary:
    "border border-lagoon/60 text-lagoon hover:border-lagoon hover:bg-lagoon/10",
  ghost: "text-shell-dim hover:text-shell hover:bg-shell/5",
  danger: "bg-coral text-white hover:bg-coral/90 active:scale-[0.98]",
  outline:
    "border border-shell/25 text-shell hover:border-brass hover:bg-brass/5 hover:text-brass",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      href,
      ...props
    },
    ref,
  ) => {
    const classes = cn(baseClasses, variants[variant], sizes[size], className);

    if (href) {
      return (
        <Link href={href} className={classes}>
          {loading && <Spinner />}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
