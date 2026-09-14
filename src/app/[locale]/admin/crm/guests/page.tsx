import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CrmGuestsPage() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();

  const guests = await db.guest.findMany({
    where: {
      reservations: { some: { restaurantId } },
    },
    include: {
      profile: { select: { displayName: true, birthday: true, emailOptIn: true } },
      tags: { include: { tag: { select: { name: true, color: true } } } },
      reservations: {
        where: { restaurantId, status: "COMPLETED" },
        select: { startsAt: true, partySize: true },
      },
      loyaltyAccounts: {
        where: { restaurantId },
        select: { points: true, tier: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-shell">Clients</h1>
          <p className="mt-2 text-sm text-shell-dim">{guests.length} clients enregistrés</p>
        </div>
      </div>

      <div className="space-y-2">
        {guests.map((guest) => {
          const visitCount = guest.reservations.length;
          const loyalty = guest.loyaltyAccounts[0];
          return (
            <div
              key={guest.id}
              className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4 transition-colors hover:border-brass/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-shell/10 text-sm font-medium text-shell">
                  {(guest.profile?.displayName ?? guest.name ?? guest.phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-shell">
                    {guest.profile?.displayName ?? guest.name ?? "Anonyme"}
                  </p>
                  <p className="text-xs text-shell-dim" dir="ltr">{guest.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {guest.tags.length > 0 && (
                  <div className="flex gap-1">
                    {guest.tags.slice(0, 3).map((t) => (
                      <span
                        key={t.tag.name}
                        className="rounded-full px-2 py-0.5 text-[0.6rem] font-medium"
                        style={{ backgroundColor: `${t.tag.color}20`, color: t.tag.color }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm text-shell">{visitCount} visites</p>
                  <p className="text-xs text-shell-dim">
                    {loyalty?.points ?? 0} pts · {loyalty?.tier ?? "bronze"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
