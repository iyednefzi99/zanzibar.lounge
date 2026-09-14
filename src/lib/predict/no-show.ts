import { db } from "@/lib/db";

export async function predictNoShow(
  restaurantId: string,
  reservationData: {
    guestId?: string | null;
    partySize: number;
    leadTimeHours: number;
    isWeekend: boolean;
    hasVisitedBefore: boolean;
  },
): Promise<{ probability: number; factors: string[] }> {
  const factors: string[] = [];
  let probability = 0.1; // base 10%

  if (reservationData.leadTimeHours > 48) {
    probability += 0.15;
    factors.push("long_lead_time");
  }

  if (!reservationData.hasVisitedBefore) {
    probability += 0.1;
    factors.push("first_visit");
  }

  if (reservationData.partySize > 6) {
    probability += 0.08;
    factors.push("large_group");
  }

  if (!reservationData.isWeekend) {
    probability += 0.05;
    factors.push("weekday");
  }

  if (reservationData.guestId) {
    const history = await db.reservation.findMany({
      where: {
        restaurantId,
        guestId: reservationData.guestId,
        status: { in: ["CANCELLED", "NO_SHOW"] },
      },
      take: 5,
    });

    if (history.length > 2) {
      probability += 0.2;
      factors.push("history_cancellations");
    }
  }

  return { probability: Math.min(probability, 0.95), factors };
}
