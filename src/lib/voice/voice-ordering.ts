import { db } from "@/lib/db";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
};

type VoiceOrderInput = {
  restaurantId: string;
  reservationId?: string;
  tableNumber?: string;
  items: OrderItem[];
  language?: string;
  transcript?: string;
};

export async function processVoiceOrder(input: VoiceOrderInput) {
  const totalCents = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return db.voiceOrder.create({
    data: {
      restaurantId: input.restaurantId,
      reservationId: input.reservationId,
      tableNumber: input.tableNumber,
      items: input.items,
      totalCents,
      language: input.language ?? "fr",
      transcript: input.transcript,
      status: "pending",
    },
  });
}
