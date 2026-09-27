import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";
import { getStaffSession } from "@/lib/staff-session";

import { StaffLoginForm } from "./login-form";

export default async function StaffLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getStaffSession();
  if (session) redirect(`/${locale}/staff`);

  return (
    <div className="mx-auto max-w-sm py-section">
      <PageHeader title="Staff Login" subtitle="Sign in to access the staff dashboard" />
      <div className="mt-6">
        <StaffLoginForm locale={locale} />
      </div>
    </div>
  );
}
