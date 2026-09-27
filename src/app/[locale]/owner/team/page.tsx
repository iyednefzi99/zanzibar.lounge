import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function OwnerTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader title="Team Management" subtitle="Manage your staff and roles" />

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-shell">Team Members</h3>
          <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-brass px-5 text-sm font-medium text-deep transition-colors hover:bg-brass/90">
            + Add Member
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {[
            { name: "Ahmed B.", role: "Manager", email: "ahmed@e-coffee.tn" },
            { name: "Fatima M.", role: "Waitress", email: "fatima@e-coffee.tn" },
            { name: "Youssef K.", role: "Chef", email: "youssef@e-coffee.tn" },
            { name: "Salma H.", role: "Waitress", email: "salma@e-coffee.tn" },
          ].map((member) => (
            <div key={member.email} className="glass-card flex items-center gap-4 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/10 font-display text-brass">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-shell">{member.name}</p>
                <p className="text-sm text-shell-dim">{member.email}</p>
              </div>
              <span className="rounded-full border border-shell/20 px-3 py-1 text-xs text-shell-dim">{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
