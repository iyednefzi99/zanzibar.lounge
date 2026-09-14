import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getShifts } from "@/lib/staff/scheduling";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDate = weekStart.toISOString().split("T")[0];
  const endDate = weekEnd.toISOString().split("T")[0];

  const [shifts, staff] = await Promise.all([
    getShifts(restaurantId, startDate, endDate),
    db.staff.findMany({
      where: { restaurantId, active: true },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-shell">Planning</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Semaine du {startDate} au {endDate}
        </p>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-px rounded-xl border border-shell/10 bg-shell/10 min-w-[700px]">
          {days.map((day, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];
            const dayShifts = shifts.filter(
              (s) => s.date.toISOString().split("T")[0] === dateStr,
            );

            return (
              <div key={i} className="bg-deep/80 p-3 min-h-[120px]">
                <p className="font-mono text-xs uppercase text-brass">
                  {day} {date.getDate()}
                </p>
                <div className="mt-2 space-y-1">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`rounded px-2 py-1 text-xs ${
                        shift.status === "confirmed"
                          ? "bg-lagoon/10 text-lagoon"
                          : shift.status === "completed"
                            ? "bg-shell/10 text-shell-dim"
                            : "bg-brass/10 text-brass"
                      }`}
                    >
                      <p className="font-medium">{shift.staff.name}</p>
                      <p className="text-[0.6rem] opacity-70">
                        {shift.startTime}-{shift.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff list */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Équipe ({staff.length})
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-shell/10 bg-deep/40 p-4"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-shell/10 text-sm font-medium text-shell">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-shell">{s.name}</p>
                <p className="text-xs text-shell-dim capitalize">{s.role.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
