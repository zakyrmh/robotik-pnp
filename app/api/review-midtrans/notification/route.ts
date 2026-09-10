import { NextResponse } from "next/server";
import {
  getMidtransReviewConfig,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { createClient } from "@/lib/supabase/server";

interface MidtransNotificationBody {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MidtransNotificationBody;
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { success: false, error: "Payload webhook tidak lengkap" },
        { status: 400 },
      );
    }

    const { serverKey } = getMidtransReviewConfig();

    // Verify SHA-512 Signature Key
    const isValidSignature = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
      serverKey,
    );

    if (!isValidSignature && serverKey) {
      console.warn(
        `[Midtrans Webhook] Signature key mismatch for order_id: ${order_id}`,
      );
      return NextResponse.json(
        { success: false, error: "Invalid signature key" },
        { status: 403 },
      );
    }

    // Determine registration & transaction statuses
    let txStatus = transaction_status || "pending";
    let regStatus = "PENDING";

    if (txStatus === "capture") {
      if (fraud_status === "challenge") {
        txStatus = "challenge";
        regStatus = "PENDING";
      } else if (fraud_status === "accept") {
        txStatus = "settlement";
        regStatus = "SETTLEMENT";
      }
    } else if (txStatus === "settlement") {
      regStatus = "SETTLEMENT";
    } else if (
      txStatus === "cancel" ||
      txStatus === "deny" ||
      txStatus === "expire"
    ) {
      regStatus = txStatus.toUpperCase(); // CANCEL, DENY, EXPIRE
    } else if (txStatus === "pending") {
      regStatus = "PENDING";
    }

    const supabase = await createClient();

    // 1. Fetch transaction record to get registration_id
    const { data: transaction, error: fetchError } = await supabase
      .from("review_transactions")
      .select("id, registration_id")
      .eq("order_id", order_id)
      .maybeSingle();

    if (fetchError) {
      console.error(
        `[Midtrans Webhook] Error fetching transaction for order_id ${order_id}:`,
        fetchError,
      );
      return NextResponse.json(
        { success: false, error: "Gagal memproses transaksi" },
        { status: 500 },
      );
    }

    if (!transaction) {
      console.warn(
        `[Midtrans Webhook] Transaction not found for order_id: ${order_id}`,
      );
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // 2. Update review_transactions
    const { error: updateTxError } = await supabase
      .from("review_transactions")
      .update({
        transaction_status: txStatus,
        payment_type: payment_type || null,
        raw_response: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order_id);

    if (updateTxError) {
      console.error(
        `[Midtrans Webhook] Error updating review_transactions:`,
        updateTxError,
      );
    }

    // 3. Update review_registrations
    if (transaction.registration_id) {
      const { error: updateRegError } = await supabase
        .from("review_registrations")
        .update({
          status: regStatus,
        })
        .eq("id", transaction.registration_id);

      if (updateRegError) {
        console.error(
          `[Midtrans Webhook] Error updating review_registrations:`,
          updateRegError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification status processed successfully",
      order_id,
      transaction_status: txStatus,
      registration_status: regStatus,
    });
  } catch (error: unknown) {
    console.error("[Midtrans Webhook Error]:", error);
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
