/**
 * D17 Payment Integration (Monetik)
 *
 * D17 is a Tunisian mobile payment system supporting:
 * - D17 Wallet
 * - CCP/Poste
 * - Carte Bleue
 *
 * API Docs: https://dev.d17.tn/
 */

import { env } from "@/lib/env";

export type D17PaymentRequest = {
  amount: number;
  orderId: string;
  description: string;
  customerPhone?: string;
  redirectUrl: string;
  callbackUrl: string;
};

export type D17PaymentResponse = {
  success: boolean;
  paymentId?: string;
  payUrl?: string;
  error?: string;
};

export type D17WebhookEvent = {
  order_id: string;
  transaction_id: string;
  amount: number;
  status: "pending" | "success" | "failed" | "cancelled";
  payment_method: string;
  date: string;
};

const D17_API_URL = "https://api.d17.tn/v1";

function getCredentials() {
  const merchantId = env.D17_MERCHANT_ID;
  const secretKey = env.D17_SECRET_KEY;

  if (!merchantId || !secretKey) {
    throw new Error("D17 credentials not configured");
  }

  return { merchantId, secretKey };
}

function sign(merchantId: string, orderId: string, amount: number, secretKey: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(`${merchantId}${orderId}${amount}${secretKey}`)
    .digest("hex");
}

export async function createD17Payment(
  request: D17PaymentRequest,
): Promise<D17PaymentResponse> {
  const { merchantId, secretKey } = getCredentials();
  const signature = sign(merchantId, request.orderId, request.amount, secretKey);

  try {
    const response = await fetch(`${D17_API_URL}/payment/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        order_id: request.orderId,
        amount: request.amount,
        description: request.description,
        customer_phone: request.customerPhone,
        redirect_url: request.redirectUrl,
        callback_url: request.callbackUrl,
        signature,
      }),
    });

    const data = await response.json();

    if (data.code === 200 && data.data) {
      return {
        success: true,
        paymentId: data.data.transaction_id,
        payUrl: data.data.payment_url,
      };
    }

    return { success: false, error: data.message || "Payment creation failed" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function checkD17PaymentStatus(
  transactionId: string,
): Promise<{ success: boolean; status: string; amount?: number }> {
  const { merchantId, secretKey } = getCredentials();
  const signature = sign(merchantId, transactionId, 0, secretKey);

  try {
    const response = await fetch(
      `${D17_API_URL}/payment/status/${transactionId}?merchant_id=${merchantId}&signature=${signature}`,
    );

    const data = await response.json();

    if (data.code === 200 && data.data) {
      return {
        success: true,
        status: data.data.status,
        amount: data.data.amount,
      };
    }

    return { success: false, status: "unknown" };
  } catch {
    return { success: false, status: "error" };
  }
}

export function verifyD17Webhook(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const { merchantId, secretKey } = getCredentials();
  const expected = sign(merchantId, "", 0, secretKey);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}
