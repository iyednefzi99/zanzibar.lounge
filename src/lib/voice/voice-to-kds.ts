import { db } from "@/lib/db";

type KdsOrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  notes?: string;
};

export async function sendToKds(orderId: string) {
  return db.voiceOrder.update({
    where: { id: orderId },
    data: {
      status: "sent_to_kitchen",
      kdsSentAt: new Date(),
    },
  });
}

export async function createKitchenOrder(
  restaurantId: string,
  reservationId: string | null,
  items: KdsOrderItem[],
  tableNumber?: string,
) {
  const order = await db.voiceOrder.create({
    data: {
      restaurantId,
      reservationId: reservationId ?? null,
      items: items as unknown as Record<string, string>,
      tableNumber: tableNumber ?? null,
      status: "sent_to_kitchen",
      kdsSentAt: new Date(),
    },
  });

  return order;
}

export async function updateKdsOrderStatus(
  orderId: string,
  status: "pending" | "sent_to_kitchen" | "completed" | "cancelled",
) {
  return db.voiceOrder.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function getKdsOrders(restaurantId: string) {
  return db.voiceOrder.findMany({
    where: {
      restaurantId,
      status: { in: ["pending", "sent_to_kitchen"] },
    },
    orderBy: { kdsSentAt: "asc" },
  });
}

export async function getKdsOrderStats(restaurantId: string) {
  const orders = await db.voiceOrder.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(
    (o) => o.createdAt >= todayStart,
  );

  const statusCounts = {
    pending: todayOrders.filter((o) => o.status === "pending").length,
    sent_to_kitchen: todayOrders.filter((o) => o.status === "sent_to_kitchen").length,
    completed: todayOrders.filter((o) => o.status === "completed").length,
  };

  const completedOrders = todayOrders.filter((o) => o.status === "completed");
  const avgPrepTimeMs =
    completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          if (o.kdsSentAt) {
            return sum + (o.updatedAt.getTime() - o.kdsSentAt.getTime());
          }
          return sum;
        }, 0) / completedOrders.length
      : 0;

  return {
    totalToday: todayOrders.length,
    ...statusCounts,
    avgPrepTimeMinutes: Math.round(avgPrepTimeMs / 60000),
  };
}
