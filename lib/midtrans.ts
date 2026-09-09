import crypto from "crypto";
import midtransClient from "midtrans-client";

export function getMidtransReviewConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey =
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  return { serverKey, clientKey, isProduction };
}

export function getMidtransSnapInstance() {
  const { serverKey, clientKey, isProduction } = getMidtransReviewConfig();

  return new midtransClient.Snap({
    isProduction,
    serverKey: serverKey || "dummy_server_key",
    clientKey: clientKey || "dummy_client_key",
  });
}

export interface ReviewCheckoutParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    first_name: string;
    email: string;
    phone: string;
  };
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

export interface ReviewSnapResponse {
  token: string | null;
  redirectUrl: string | null;
  orderId: string;
}

/**
 * Creates Snap transaction for Midtrans Reviewer Sandbox simulation.
 */
export async function createReviewSnapTransaction(
  params: ReviewCheckoutParams,
): Promise<ReviewSnapResponse> {
  const { serverKey } = getMidtransReviewConfig();

  if (!serverKey) {
    throw new Error(
      "MIDTRANS_SERVER_KEY is not configured in environment variables.",
    );
  }

  const snap = getMidtransSnapInstance();

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
  };

  const response = await snap.createTransaction(parameter);

  return {
    token: response.token || null,
    redirectUrl: response.redirect_url || null,
    orderId: params.orderId,
  };
}

/**
 * Verifies SHA-512 Signature Key sent by Midtrans HTTP Notification Webhook.
 * Hash formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string,
): boolean {
  if (!orderId || !statusCode || !grossAmount || !signatureKey || !serverKey) {
    return false;
  }

  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculatedHash = crypto
    .createHash("sha512")
    .update(payload)
    .digest("hex");

  return calculatedHash === signatureKey;
}
