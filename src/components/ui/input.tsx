import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    helper?: string;
  }
>(({ label, error, helper, className, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;
  const describedBy =
    [error ? errorId : null, !error && helper ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-shell-dim"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-md border bg-deep/60 px-4 py-3 text-shell placeholder:text-shell-dim/50",
          "transition-colors duration-200",
          "focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass/30",
          error
            ? "border-coral"
            : "border-shell/10 hover:border-shell/20",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-xs text-shell-dim/60">
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
