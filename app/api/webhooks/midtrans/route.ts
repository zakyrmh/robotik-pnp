import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { sendETicketEmail } from "@/lib/services/resend";
import type { EventRegistration } from "@/types/event-registration";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

    // 1. Verify SHA-512 Signature
    if (serverKey) {
      const hashInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
      const expectedSignature = crypto.createHash("sha512").update(hashInput).digest("hex");

      if (signature_key !== expectedSignature) {
        return NextResponse.json(
          { success: false, message: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const adminSupabase = createAdminClient();

    // 2. Fetch existing registration
    const { data: reg, error: fetchError } = await (adminSupabase
      .from("event_registrations" as any)
      .select(`
        *,
        category:event_categories(*)
      `)
      .eq("midtrans_order_id", order_id)
      .single() as unknown as Promise<{ data: EventRegistration | null; error: unknown }>);

    if (fetchError || !reg) {
      return NextResponse.json(
        { success: false, message: "Registration record not found" },
        { status: 404 }
      );
    }

    // 3. Idempotent check: skip if already paid
    if (reg.payment_status === "paid") {
      return NextResponse.json({ success: true, message: "Transaction already processed as paid" });
    }

    let newStatus: "pending" | "paid" | "expired" | "failed" = reg.payment_status;

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        newStatus = "pending";
      } else if (fraud_status === "accept") {
        newStatus = "paid";
      }
    } else if (transaction_status === "settlement") {
      newStatus = "paid";
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      newStatus = "failed";
    } else if (transaction_status === "expire") {
      newStatus = "expired";
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    }

    // Update database
    const updatePayload: Record<string, unknown> = {
      payment_status: newStatus,
      midtrans_payment_type: payment_type || reg.midtrans_payment_type,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updatePayload.paid_at = new Date().toISOString();
    }

    await (adminSupabase
      .from("event_registrations" as any)
      .update(updatePayload)
      .eq("id", reg.id));

    // Send E-Ticket if transition to paid
    if (newStatus === "paid") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendETicketEmail({
        toEmail: reg.team_email,
        teamName: reg.team_name,
        registrationCode: reg.registration_code,
        categoryName: reg.category?.name || "Minangkabau Robot Contest",
        accessToken: reg.access_token,
        appBaseUrl: appUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Webhook processed successfully. Status: ${newStatus}`,
    });
  } catch (err: unknown) {
    console.error("Error handling Midtrans webhook:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
