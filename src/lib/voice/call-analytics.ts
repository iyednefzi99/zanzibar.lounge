import { db } from "@/lib/db";

export async function getCallAnalytics(
  restaurantId: string,
  days?: number,
) {
  const since = new Date();
  since.setDate(since.getDate() - (days ?? 30));

  const calls = await db.callLog.findMany({
    where: { restaurantId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const totalCalls = calls.length;
  const inboundCalls = calls.filter((c) => c.direction === "inbound").length;
  const outboundCalls = calls.filter((c) => c.direction === "outbound").length;
  const avgDuration =
    totalCalls > 0
      ? calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls
      : 0;
  const avgSentiment =
    calls.filter((c) => c.sentiment !== null).length > 0
      ? calls
          .filter((c) => c.sentiment !== null)
          .reduce((sum, c) => sum + (c.sentiment ?? 0), 0) /
        calls.filter((c) => c.sentiment !== null).length
      : 0;
  const aiHandled = calls.filter((c) => c.handledBy === "ai").length;
  const staffHandled = calls.filter((c) => c.handledBy === "staff").length;

  return {
    totalCalls,
    inboundCalls,
    outboundCalls,
    avgDuration: Math.round(avgDuration),
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    aiHandled,
    staffHandled,
    calls,
  };
}
