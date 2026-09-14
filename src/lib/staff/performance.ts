import { db } from "@/lib/db";

export type ServerPerformance = {
  staffId: string;
  staffName: string;
  totalShifts: number;
  totalHours: number;
  totalCovers: number;
  avgRating: number;
};

export async function getServerPerformance(
  restaurantId: string,
  startDate: string,
  endDate: string,
): Promise<ServerPerformance[]> {
  const staff = await db.staff.findMany({
    where: { restaurantId, active: true },
    select: { id: true, name: true },
  });

  const performances: ServerPerformance[] = [];

  for (const s of staff) {
    const shifts = await db.shift.findMany({
      where: {
        staffId: s.id,
        restaurantId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
        status: "completed",
      },
    });

    const timeEntries = await db.timeEntry.findMany({
      where: {
        staffId: s.id,
        clockIn: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });

    const reservations = await db.reservation.findMany({
      where: {
        restaurantId,
        seatedAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: { partySize: true },
    });

    const reviews = await db.review.findMany({
      where: {
        approved: true,
        reservation: { restaurantId },
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: { rating: true },
    });

    const totalHours = timeEntries.reduce((s, e) => s + (e.totalHours ?? 0), 0);
    const totalCovers = reservations.reduce((s, r) => s + r.partySize, 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    performances.push({
      staffId: s.id,
      staffName: s.name,
      totalShifts: shifts.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalCovers,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  }

  return performances.sort((a, b) => b.totalCovers - a.totalCovers);
}

export async function getShiftReport(restaurantId: string, date: string) {
  const shifts = await db.shift.findMany({
    where: {
      restaurantId,
      date: new Date(date),
    },
    include: { staff: { select: { name: true, role: true } } },
  });

  const reservations = await db.reservation.findMany({
    where: {
      restaurantId,
      serviceDate: date,
    },
    select: { partySize: true, status: true },
  });

  const orders = await db.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) },
    },
    select: { total: true, status: true },
  });

  return {
    date,
    staffCount: shifts.length,
    totalCovers: reservations.reduce((s, r) => s + r.partySize, 0),
    totalRevenue: orders.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + o.total, 0),
    reservations: {
      total: reservations.length,
      completed: reservations.filter((r) => r.status === "COMPLETED").length,
      noShow: reservations.filter((r) => r.status === "NO_SHOW").length,
    },
    shifts: shifts.map((s) => ({
      name: s.staff.name,
      role: s.staff.role,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    })),
  };
}
