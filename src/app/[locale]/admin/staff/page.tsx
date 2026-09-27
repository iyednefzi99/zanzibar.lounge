import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Staff Management" subtitle="Manage team members and schedules" />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {[
          { name: "Ahmed B.", role: "Manager", status: "Active" },
          { name: "Fatima M.", role: "Waitress", status: "Active" },
          { name: "Youssef K.", role: "Chef", status: "Active" },
          { name: "Salma H.", role: "Waitress", status: "Off duty" },
        ].map((staff) => (
          <div key={staff.name} className="glass-card flex items-center gap-4 rounded-xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brass/10 font-display text-lg text-brass">
              {staff.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-shell">{staff.name}</p>
              <p className="text-sm text-shell-dim">{staff.role}</p>
            </div>
            <span className={`rounded-sm px-2 py-0.5 text-xs ${staff.status === "Active" ? "bg-lagoon/10 text-lagoon" : "bg-shell/10 text-shell-dim"}`}>
              {staff.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
