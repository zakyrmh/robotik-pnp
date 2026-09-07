import midtransClient from "midtrans-client";

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey =
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    console.warn("MIDTRANS_SERVER_KEY is not configured.");
  }

  return { serverKey, clientKey, isProduction };
}

function getMidtransCoreApi() {
  const { serverKey, clientKey, isProduction } = getMidtransConfig();

  return new midtransClient.CoreApi({
    isProduction,
    serverKey: serverKey || "dummy_server_key",
    clientKey: clientKey || "dummy_client_key",
  });
}

export interface CreateQrisChargeParams {
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

export interface QrisChargeResult {
  /** URL gambar QR dinamis dari Midtrans (null bila kunci belum dikonfigurasi). */
  qrUrl: string | null;
  /** Waktu kedaluwarsa QR dari Midtrans (format "YYYY-MM-DD HH:mm:ss", +07:00). */
  expiryTime: string | null;
  transactionId: string | null;
  orderId: string;
}

/**
 * Membuat transaksi QRIS dinamis via Midtrans Core API (VT-Direct).
 * HANYA QRIS yang dipakai — tidak ada pilihan metode lain.
 * Nominal mengikuti grossAmount (biaya batch aktif saat pendaftaran).
 */
export async function createMidtransQrisCharge(
  params: CreateQrisChargeParams,
): Promise<QrisChargeResult> {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) {
    // Graceful fallback: registrasi tetap tersimpan, halaman bayar
    // menampilkan pemberitahuan mode pengembangan + jalur manual.
    return {
      qrUrl: null,
      expiryTime: null,
      transactionId: null,
      orderId: params.orderId,
    };
  }

  const coreApi = getMidtransCoreApi();
  const parameter = {
    payment_type: "qris",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
  };

  const charge = await coreApi.charge(parameter);
  return {
    qrUrl: charge.qr_url || null,
    expiryTime: charge.expiry_time || null,
    transactionId: charge.transaction_id || null,
    orderId: charge.order_id || params.orderId,
  };
}

export async function checkMidtransTransactionStatus(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return null;

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  try {
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
    const res = await fetch(`${baseUrl}/${orderId}/status`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data as {
      transaction_status?: string;
      payment_type?: string;
      fraud_status?: string;
    };
  } catch (err) {
    console.error("Error checking Midtrans transaction status:", err);
    return null;
  }
}
