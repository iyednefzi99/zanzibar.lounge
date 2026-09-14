import { db } from "@/lib/db";

export type ShiftData = {
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  role?: string;
  notes?: string;
};

export async function getShifts(restaurantId: string, startDate: string, endDate: string) {
  return db.shift.findMany({
    where: {
      restaurantId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: { staff: { select: { id: true, name: true, role: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getShiftsByStaff(staffId: string, startDate: string, endDate: string) {
  return db.shift.findMany({
    where: {
      staffId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function createShift(restaurantId: string, data: ShiftData) {
  return db.shift.create({
    data: {
      restaurantId,
      staffId: data.staffId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      role: data.role ?? "SERVER",
      notes: data.notes,
    },
  });
}

export async function updateShift(shiftId: string, data: Partial<ShiftData>) {
  return db.shift.update({
    where: { id: shiftId },
    data: {
      ...(data.staffId && { staffId: data.staffId }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.endTime && { endTime: data.endTime }),
      ...(data.role && { role: data.role }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function deleteShift(shiftId: string) {
  return db.shift.delete({ where: { id: shiftId } });
}

export async function confirmShift(shiftId: string) {
  return db.shift.update({ where: { id: shiftId }, data: { status: "confirmed" } });
}

export async function cancelShift(shiftId: string) {
  return db.shift.update({ where: { id: shiftId }, data: { status: "cancelled" } });
}

export async function bulkCreateShifts(restaurantId: string, shifts: ShiftData[]) {
  return db.shift.createMany({
    data: shifts.map((s) => ({
      restaurantId,
      staffId: s.staffId,
      date: new Date(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      role: s.role ?? "SERVER",
      notes: s.notes,
    })),
  });
}

export async function copyWeekSchedule(
  restaurantId: string,
  weekStart: string,
  targetWeekStart: string,
) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const shifts = await getShifts(restaurantId, weekStart, end.toISOString().split("T")[0]);

  const targetStart = new Date(targetWeekStart);
  const newShifts = shifts.map((s) => {
    const dayOffset = Math.floor((s.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const newDate = new Date(targetStart);
    newDate.setDate(newDate.getDate() + dayOffset);

    return {
      staffId: s.staffId,
      date: newDate.toISOString().split("T")[0],
      startTime: s.startTime,
      endTime: s.endTime,
      role: s.role,
      notes: s.notes ?? undefined,
    };
  });

  return bulkCreateShifts(restaurantId, newShifts);
}
