import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function StaffOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Orders" subtitle="Active orders to manage" />

      <div className="mt-6 space-y-3">
        {[
          { id: "#101", items: "2x Espresso, 1x Cappuccino", table: "T3", time: "2 min ago", status: "Pending" },
          { id: "#100", items: "1x Zanzibar Burger, 1x Fries", table: "T7", time: "8 min ago", status: "Preparing" },
          { id: "#099", items: "3x Mint Tea", table: "T1", time: "12 min ago", status: "Ready" },
        ].map((order) => (
          <div key={order.id} className="glass-card flex items-center gap-4 rounded-xl p-4">
            <div className="w-12 text-center">
              <p className="font-mono text-sm text-brass">{order.id}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-shell">{order.items}</p>
              <p className="text-xs text-shell-dim">Table {order.table} · {order.time}</p>
            </div>
            <span className={`rounded-sm px-2 py-0.5 text-xs ${
              order.status === "Ready" ? "bg-lagoon/10 text-lagoon" :
              order.status === "Preparing" ? "bg-brass/10 text-brass" :
              "bg-shell/10 text-shell-dim"
            }`}>
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
