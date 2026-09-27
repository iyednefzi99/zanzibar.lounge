import { db } from "@/lib/db";

export async function handleInboundCall(
  restaurantId: string,
  callerNumber: string,
) {
  return db.callLog.create({
    data: {
      restaurantId,
      direction: "inbound",
      callerNumber,
      status: "completed",
      handledBy: "ai",
    },
  });
}

export async function createOutboundCall(
  restaurantId: string,
  calledNumber: string,
) {
  return db.callLog.create({
    data: {
      restaurantId,
      direction: "outbound",
      callerNumber: "system",
      calledNumber,
      status: "completed",
      handledBy: "ai",
    },
  });
}
