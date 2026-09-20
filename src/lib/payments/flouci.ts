/**
 * Flouci Payment Integration
 *
 * Flouci is a Tunisian payment gateway supporting:
 * - Credit/Debit cards (Visa, Mastercard, CIB)
 * - Flouci Wallet
 * - D17 (Monetik)
 *
 * API Docs: https://docs.flouci.com/
 */

import { env } from "@/lib/env";

// ─── Types ────────────────────────────────────────────────────────────

export type FlouciPaymentRequest = {
  amount: number; // Amount in millimes (1 DT = 1000 millimes)
  currency: string; // "TND"
  orderId: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  redirectUrl: string;
  webhookUrl: string;
};

export type FlouciPaymentResponse = {
  success: boolean;
  paymentId?: string;
  payUrl?: string;
  error?: string;
};

export type FlouciWebhookEvent = {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  payment_method: string;
  created_at: string;
  updated_at: string;
};

// ─── Configuration ────────────────────────────────────────────────────

const FLOUCI_API_URL = "https://api.flouci.com/v1";

function getCredentials() {
  const appId = env.FLOUCI_APP_ID;
  const appSecret = env.FLOUCI_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Flouci credentials not configured");
  }

  return { appId, appSecret };
}

// ─── Payment Creation ────────────────────────────────────────────────

export async function createFlouciPayment(
  request: FlouciPaymentRequest,
): Promise<FlouciPaymentResponse> {
  const { appId, appSecret } = getCredentials();

  try {
    const response = await fetch(`${FLOUCI_API_URL}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appSecret}`,
      },
      body: JSON.stringify({
        app_token: appId,
        amount: request.amount,
        currency: request.currency || "TND",
        order_id: request.orderId,
        description: request.description,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        customer_phone: request.customerPhone,
        redirect_url: request.redirectUrl,
        webhook_url: request.webhookUrl,
      }),
    });

    const data = await response.json();

    if (data.code === "200" && data.result) {
      return {
        success: true,
        paymentId: data.result.payment_id,
        payUrl: data.result.pay_url,
      };
    }

    return {
      success: false,
      error: data.message || "Payment creation failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ─── Payment Verification ────────────────────────────────────────────

export async function verifyFlouciPayment(
  paymentId: string,
): Promise<{ success: boolean; status: string; amount?: number }> {
  const { appSecret } = getCredentials();

  try {
    const response = await fetch(
      `${FLOUCI_API_URL}/payment/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${appSecret}`,
        },
      },
    );

    const data = await response.json();

    if (data.code === "200" && data.result) {
      return {
        success: true,
        status: data.result.status,
        amount: data.result.amount,
      };
    }

    return {
      success: false,
      status: "unknown",
    };
  } catch {
    return {
      success: false,
      status: "error",
    };
  }
}

// ─── Webhook Signature Verification ──────────────────────────────────

export function verifyFlouciWebhook(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const { appSecret } = getCredentials();

  // Flouci uses HMAC-SHA256 for webhook verification
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

// ─── Refund ──────────────────────────────────────────────────────────

export async function refundFlouciPayment(
  paymentId: string,
  amount?: number, // Partial refund if specified
): Promise<{ success: boolean; error?: string }> {
  const { appSecret } = getCredentials();

  try {
    const response = await fetch(
      `${FLOUCI_API_URL}/payment/${paymentId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appSecret}`,
        },
        body: JSON.stringify(amount ? { amount } : {}),
      },
    );

    const data = await response.json();

    if (data.code === "200") {
      return { success: true };
    }

    return {
      success: false,
      error: data.message || "Refund failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
