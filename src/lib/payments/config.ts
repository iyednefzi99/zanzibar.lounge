import { db } from "@/lib/db";

export type PaymentConfig = {
  depositRequired: boolean;
  depositAmount: number; // millimes per person
  preAuthRequired: boolean;
  preAuthAmount: number; // millimes per person
  noShowFeeAmount: number; // millimes
  cancellationHours: number; // hours before for free cancellation
};

const DEFAULT_CONFIG: PaymentConfig = {
  depositRequired: false,
  depositAmount: 0,
  preAuthRequired: false,
  preAuthAmount: 0,
  noShowFeeAmount: 0,
  cancellationHours: 24,
};

export async function getPaymentConfig(restaurantId: string): Promise<PaymentConfig> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { integrationSettings: true },
  });

  if (!restaurant?.integrationSettings) return DEFAULT_CONFIG;

  const settings = restaurant.integrationSettings as Record<string, unknown>;
  const payments = settings.payments as Record<string, unknown> | undefined;

  if (!payments) return DEFAULT_CONFIG;

  return {
    depositRequired: (payments.depositRequired as boolean) ?? false,
    depositAmount: (payments.depositAmount as number) ?? 0,
    preAuthRequired: (payments.preAuthRequired as boolean) ?? false,
    preAuthAmount: (payments.preAuthAmount as number) ?? 0,
    noShowFeeAmount: (payments.noShowFeeAmount as number) ?? 0,
    cancellationHours: (payments.cancellationHours as number) ?? 24,
  };
}

export async function updatePaymentConfig(
  restaurantId: string,
  config: Partial<PaymentConfig>,
) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { integrationSettings: true },
  });

  const existing = (restaurant?.integrationSettings as Record<string, unknown>) ?? {};
  const payments = (existing.payments as Record<string, unknown>) ?? {};

  await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      integrationSettings: {
        ...existing,
        payments: { ...payments, ...config },
      } as unknown as Record<string, string>,
    },
  });
}

export function calculateDepositAmount(config: PaymentConfig, partySize: number): number {
  if (!config.depositRequired) return 0;
  return config.depositAmount * partySize;
}

export function calculatePreAuthAmount(config: PaymentConfig, partySize: number): number {
  if (!config.preAuthRequired) return 0;
  return config.preAuthAmount * partySize;
}
