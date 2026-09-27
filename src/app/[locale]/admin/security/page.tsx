import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Security" subtitle="Manage authentication and access controls" />

      <div className="mt-6 space-y-6">
        {[
          { label: "Two-Factor Authentication", desc: "Add an extra layer of security to your account", enabled: true },
          { label: "API Keys", desc: "Manage API keys for external integrations", enabled: false },
          { label: "Audit Log", desc: "Track all admin actions and changes", enabled: true },
          { label: "Session Management", desc: "View and revoke active sessions", enabled: false },
        ].map((item) => (
          <div key={item.label} className="glass-card flex items-center justify-between rounded-xl p-5">
            <div>
              <h3 className="text-shell">{item.label}</h3>
              <p className="mt-1 text-sm text-shell-dim">{item.desc}</p>
            </div>
            <div className={`h-6 w-11 rounded-sm transition-colors ${item.enabled ? "bg-lagoon" : "bg-shell/20"}`}>
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${item.enabled ? "translate-x-5.5 mt-0.5" : "translate-x-0.5 mt-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
