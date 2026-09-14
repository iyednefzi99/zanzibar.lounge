import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getStaffSession } from "@/lib/staff-session";
import { StaffLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getStaffSession();
  if (session) {
    redirect(`/${locale}/staff`);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-night px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl text-shell">Zanzibar</h1>
          <p className="mt-2 text-sm text-shell-dim">Espace personnel</p>
        </div>
        <StaffLoginForm locale={locale} />
      </div>
    </div>
  );
}
