import { db } from "@/lib/db";

export async function clockIn(staffId: string, restaurantId: string) {
  return db.timeEntry.create({
    data: {
      staffId,
      restaurantId,
      clockIn: new Date(),
    },
  });
}

export async function clockOut(staffId: string) {
  const entry = await db.timeEntry.findFirst({
    where: { staffId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (!entry) return null;

  const now = new Date();
  const totalHours = (now.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

  return db.timeEntry.update({
    where: { id: entry.id },
    data: {
      clockOut: now,
      totalHours: Math.round(totalHours * 100) / 100,
    },
  });
}

export async function addBreak(timeEntryId: string, minutes: number) {
  return db.timeEntry.update({
    where: { id: timeEntryId },
    data: { breakMinutes: { increment: minutes } },
  });
}

export async function getCurrentEntry(staffId: string) {
  return db.timeEntry.findFirst({
    where: { staffId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}

export async function getTimeEntries(staffId: string, startDate: string, endDate: string) {
  return db.timeEntry.findMany({
    where: {
      staffId,
      clockIn: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    orderBy: { clockIn: "desc" },
  });
}

export async function getHoursWorked(staffId: string, startDate: string, endDate: string) {
  const entries = await getTimeEntries(staffId, startDate, endDate);
  return entries.reduce((total, e) => total + (e.totalHours ?? 0), 0);
}
