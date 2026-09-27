import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin-auth";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdmin();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader
        title="Kitchen Display"
        subtitle="Live order queue for kitchen staff"
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Pending", "Preparing", "Ready"].map((status) => (
          <div key={status}>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-brass">{status}</h3>
            <div className="space-y-3">
              {Array.from({ length: status === "Pending" ? 3 : status === "Preparing" ? 2 : 1 }, (_, i) => (
                <div
                  key={i}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-shell">#{String(i + 1).padStart(3, "0")}</span>
                    <span className="font-mono text-xs text-shell-dim">2 min ago</span>
                  </div>
                  <p className="mt-2 text-sm text-shell">Order #{i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
