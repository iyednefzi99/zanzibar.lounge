import { db } from "@/lib/db";

type Suggestion = {
  staffId: string;
  shift: string;
  reason: string;
  confidence: number;
};

type ShiftSlot = {
  start: string;
  end: string;
  role: string;
};

const DEFAULT_SHIFTS: Record<string, ShiftSlot[]> = {
  weekday: [
    { start: "07:00", end: "14:00", role: "morning" },
    { start: "12:00", end: "20:00", role: "afternoon" },
    { start: "18:00", end: "23:00", role: "evening" },
  ],
  weekend: [
    { start: "08:00", end: "16:00", role: "morning" },
    { start: "12:00", end: "22:00", role: "afternoon" },
    { start: "17:00", end: "00:00", role: "evening" },
  ],
};

export async function suggestSchedule(
  restaurantId: string,
  weekStart: Date,
  suggestions: Suggestion[],
) {
  return db.scheduleSuggestion.upsert({
    where: {
      restaurantId_weekStart: { restaurantId, weekStart },
    },
    create: {
      restaurantId,
      weekStart,
      suggestions: suggestions as unknown as Record<string, string>,
    },
    update: {
      suggestions: suggestions as unknown as Record<string, string>,
    },
  });
}

export async function generateScheduleSuggestions(
  restaurantId: string,
  weekStart: Date,
): Promise<Suggestion[]> {
  const staff = await db.staff.findMany({
    where: { restaurantId, active: true },
    select: { id: true, name: true, role: true },
  });

  if (staff.length === 0) return [];

  // Get demand forecast for the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const forecasts = await db.demandForecast.findMany({
    where: {
      restaurantId,
      date: { gte: weekStart, lte: weekEnd },
    },
    orderBy: [{ date: "asc" }, { hour: "asc" }],
  });

  // Get staff availability
  const availability = await db.staffAvailability.findMany({
    where: {
      staffId: { in: staff.map((s) => s.id) },
    },
  });

  const availabilityMap = new Map<string, Record<string, boolean>>();
  for (const a of availability) {
    const dayMap = availabilityMap.get(a.staffId) ?? {};
    dayMap[a.dayOfWeek] = a.available;
    availabilityMap.set(a.staffId, dayMap);
  }

  // Get historical no-show rate for staff shifts
  const suggestions: Suggestion[] = [];
  const daysOfWeek = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIdx);
    const dow = daysOfWeek[dayIdx];
    const isWeekend = dow === 0 || dow === 6;
    const shiftType = isWeekend ? "weekend" : "weekday";
    const shifts = DEFAULT_SHIFTS[shiftType];

    // Get demand for this day
    const dayForecasts = forecasts.filter(
      (f) => f.date.toDateString() === dayDate.toDateString(),
    );
    const avgDemand =
      dayForecasts.length > 0
        ? dayForecasts.reduce((sum, f) => sum + f.predictedCovers, 0) /
          dayForecasts.length
        : 0;

    // Determine staff needed based on demand
    const staffNeeded = Math.max(2, Math.ceil(avgDemand / 15));

    // Pick staff based on availability and role
    const availableStaff = staff.filter((s) => {
      const dayAvail = availabilityMap.get(s.id);
      return dayAvail?.[String(dow)] !== false;
    });

    for (const shift of shifts) {
      const assignCount = Math.min(staffNeeded, availableStaff.length);
      const candidates = availableStaff.slice(0, assignCount);

      for (const member of candidates) {
        const hasConflict = suggestions.some(
          (s) =>
            s.staffId === member.id &&
            s.shift.includes(dayDate.toISOString().split("T")[0]),
        );
        if (hasConflict) continue;

        const confidence = avgDemand > 30 ? 0.9 : avgDemand > 15 ? 0.75 : 0.6;

        suggestions.push({
          staffId: member.id,
          shift: `${dayDate.toISOString().split("T")[0]} ${shift.start}-${shift.end}`,
          reason: `Demande prévue: ${Math.round(avgDemand)} couverts`,
          confidence,
        });
      }
    }
  }

  // Save suggestions
  await suggestSchedule(restaurantId, weekStart, suggestions);

  return suggestions;
}

export async function getSuggestionsForWeek(
  restaurantId: string,
  weekStart: Date,
) {
  const record = await db.scheduleSuggestion.findUnique({
    where: { restaurantId_weekStart: { restaurantId, weekStart } },
  });

  return (record?.suggestions as Suggestion[]) ?? [];
}
