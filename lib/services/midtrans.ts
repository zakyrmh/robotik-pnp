import midtransClient from "midtrans-client";

export function getMidtransSnap() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    console.warn("MIDTRANS_SERVER_KEY is not configured.");
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey: serverKey || "dummy_server_key",
    clientKey: clientKey || "dummy_client_key",
  });
}

export interface CreateSnapTransactionParams {
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

export async function createMidtransSnapTransaction(params: CreateSnapTransactionParams) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    // Graceful fallback for missing key session
    return {
      token: `mock_snap_token_${params.orderId}`,
      redirect_url: `#mock-payment-url-${params.orderId}`,
    };
  }

  const snap = getMidtransSnap();
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    credit_card: {
      secure: true,
    },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
  };

  const transaction = await snap.createTransaction(parameter);
  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  };
}
