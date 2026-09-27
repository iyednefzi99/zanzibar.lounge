"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "glass-card rounded-xl p-0 shadow-2xl backdrop:bg-midnight/80 backdrop:backdrop-blur-sm",
        "max-w-lg w-full",
        className,
      )}
    >
      {children}
    </dialog>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pt-6 pb-4", className)}>{children}</div>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pb-6", className)}>{children}</div>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-shell/10 px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
