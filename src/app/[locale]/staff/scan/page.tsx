import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";
import { getStaffSession } from "@/lib/staff-session";

export default async function StaffScanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getStaffSession();
  if (!session) redirect(`/${locale}/staff/login`);

  return (
    <div>
      <PageHeader title="QR Scanner" subtitle="Scan guest QR codes for check-in" />

      <div className="mt-6">
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-12">
          <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-brass/30">
            <svg className="h-12 w-12 text-brass/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <p className="mt-6 text-shell-dim">Position QR code in front of camera</p>
          <button type="button" className="mt-6 inline-flex min-h-12 items-center rounded-sm bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90">
            Activate Camera
          </button>
        </div>
      </div>
    </div>
  );
}
