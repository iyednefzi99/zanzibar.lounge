"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ locale }: { locale: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/staff/logout", { method: "POST" });
        router.push(`/${locale}/staff/login`);
        router.refresh();
      }}
      className="flex w-full items-center rounded-sm px-2.5 py-1.5 text-sm text-shell-dim transition-colors hover:bg-shell/5 hover:text-coral"
    >
      Sign out
    </button>
  );
}
