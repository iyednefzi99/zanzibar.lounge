import { db } from "@/lib/db";

export async function sendToKds(orderId: string) {
  return db.voiceOrder.update({
    where: { id: orderId },
    data: {
      status: "sent_to_kitchen",
      kdsSentAt: new Date(),
    },
  });
}
