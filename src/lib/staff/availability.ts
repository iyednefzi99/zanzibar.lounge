import { db } from "@/lib/db";

export type AvailabilityEntry = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  available: boolean;
};

export async function getAvailability(staffId: string) {
  return db.staffAvailability.findMany({
    where: { staffId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function updateAvailability(staffId: string, restaurantId: string, availability: AvailabilityEntry[]) {
  // Delete existing
  await db.staffAvailability.deleteMany({ where: { staffId } });

  // Create new
  return db.staffAvailability.createMany({
    data: availability.map((a) => ({
      staffId,
      restaurantId,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      available: a.available,
    })),
  });
}

export async function checkAvailability(
  staffId: string,
  date: Date,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  const dayOfWeek = date.getDay();

  const availability = await db.staffAvailability.findFirst({
    where: { staffId, dayOfWeek },
  });

  if (!availability || !availability.available) return false;

  // Check time overlap
  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = timeToMinutes(endTime);
  const availableStart = timeToMinutes(availability.startTime);
  const availableEnd = timeToMinutes(availability.endTime);

  return requestedStart >= availableStart && requestedEnd <= availableEnd;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
