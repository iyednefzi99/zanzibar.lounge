import { db } from "@/lib/db";

export async function createBillSplit(
  reservationId: string,
  restaurantId: string,
  totalAmount: number,
) {
  return db.billSplit.create({
    data: { reservationId, restaurantId, totalAmount },
  });
}

export async function getBillSplit(splitId: string) {
  return db.billSplit.findUnique({
    where: { id: splitId },
    include: { items: true, reservation: true },
  });
}

export async function getBillSplitByReservation(reservationId: string) {
  return db.billSplit.findFirst({
    where: { reservationId },
    include: { items: true },
  });
}

export async function splitEvenly(splitId: string, guestCount: number) {
  const split = await db.billSplit.findUnique({ where: { id: splitId } });
  if (!split) throw new Error("Split not found");

  const perPerson = Math.floor(split.totalAmount / guestCount);
  const remainder = split.totalAmount - perPerson * guestCount;

  // Clear existing items
  await db.billSplitItem.deleteMany({ where: { splitId } });

  const items = Array.from({ length: guestCount }, (_, i) => ({
    splitId,
    orderItemId: `split-${i}`,
    amount: perPerson + (i === 0 ? remainder : 0),
  }));

  await db.billSplitItem.createMany({ data: items });

  return db.billSplit.findUnique({ where: { id: splitId }, include: { items: true } });
}

export async function addTip(splitId: string, tipAmount: number) {
  return db.billSplit.update({
    where: { id: splitId },
    data: { tipAmount, status: "completed" },
  });
}

export async function getSplitStatus(splitId: string) {
  const split = await db.billSplit.findUnique({
    where: { id: splitId },
    include: { items: true },
  });

  if (!split) return null;

  const totalAssigned = split.items.reduce((s, i) => s + i.amount, 0);
  const totalWithTip = split.totalAmount + split.tipAmount;

  return {
    ...split,
    totalAssigned,
    totalWithTip,
    isComplete: totalAssigned >= totalWithTip,
    remaining: totalWithTip - totalAssigned,
  };
}
