import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getStaffSession } from "@/lib/staff-session";
import { StaffNav } from "@/components/staff-nav";

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getStaffSession();
  if (!session) {
    redirect(`/${locale}/staff/login`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-night">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brass/20 bg-deep/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="inline-block size-7 rounded-full bg-brass/20 text-center leading-7 text-brass font-bold text-sm">
            {session.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-shell">
              {session.name}
            </p>
            <p className="truncate text-[0.65rem] text-shell-dim">
              {session.role === "OWNER" ? "Propriétaire" : session.role === "MANAGER" ? "Gérant" : "Équipe"}
            </p>
          </div>
        </div>
        <form action="/api/staff/logout" method="post">
          <button
            type="submit"
            className="min-h-11 min-w-[44px] rounded-lg px-3 text-xs text-shell-dim transition-colors hover:text-coral"
          >
            Quitter
          </button>
        </form>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <StaffNav locale={locale} />
    </div>
  );
}
