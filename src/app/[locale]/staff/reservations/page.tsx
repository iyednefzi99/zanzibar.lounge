import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function StaffReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Today's reservation list" />

      <div className="mt-6 space-y-3">
        {[
          { time: "19:00", name: "Ahmed B.", party: 4, zone: "Terrasse", status: "Confirmed" },
          { time: "19:30", name: "Fatima M.", party: 2, zone: "Salle", status: "Confirmed" },
          { time: "20:00", name: "Youssef K.", party: 6, zone: "Salon", status: "Pending" },
          { time: "20:30", name: "Salma H.", party: 3, zone: "Terrasse", status: "Confirmed" },
          { time: "21:00", name: "Karim D.", party: 5, zone: "Salle", status: "Confirmed" },
        ].map((res, i) => (
          <div key={i} className="glass-card flex items-center gap-4 rounded-xl p-4">
            <div className="w-16 text-center">
              <p className="font-mono text-lg text-brass">{res.time}</p>
            </div>
            <div className="flex-1">
              <p className="text-shell">{res.name}</p>
              <p className="text-sm text-shell-dim">{res.party} guests · {res.zone}</p>
            </div>
            <span className={`rounded-sm px-2 py-0.5 text-xs ${res.status === "Confirmed" ? "bg-lagoon/10 text-lagoon" : "bg-brass/10 text-brass"}`}>
              {res.status}
            </span>
            <button type="button" className="rounded-lg border border-shell/20 px-2 py-1 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass">
              Seat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
