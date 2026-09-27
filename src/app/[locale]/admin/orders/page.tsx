import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage incoming orders" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {["Pending", "Preparing", "Ready"].map((status) => (
          <div key={status}>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">{status}</h3>
            <div className="space-y-3">
              {Array.from({ length: status === "Pending" ? 3 : status === "Preparing" ? 2 : 1 }, (_, i) => (
                <div key={i} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-shell">#{String(i + 101).padStart(3, "0")}</span>
                    <span className="font-mono text-xs text-shell-dim">5 min ago</span>
                  </div>
                  <p className="mt-2 text-sm text-shell">2x Espresso, 1x Cappuccino</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="rounded-lg bg-brass/10 px-2 py-1 text-xs text-brass transition-colors hover:bg-brass hover:text-deep">
                      Next →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
