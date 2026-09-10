import { NextResponse } from "next/server";
import { z } from "zod";
import { createReviewSnapTransaction } from "@/lib/midtrans";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  team_name: z.string().min(2, "Nama tim minimal 2 karakter"),
  leader_name: z.string().min(2, "Nama ketua minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  whatsapp: z.string().min(8, "Nomor WhatsApp tidak valid"),
  category: z.string().min(2, "Kategori harus dipilih"),
  amount: z.number().positive("Nominal harus lebih dari 0"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasi data gagal",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { team_name, leader_name, email, whatsapp, category, amount } =
      validation.data;

    const supabase = await createClient();

    // 1. Insert registration record into review_registrations
    const { data: registration, error: regError } = await supabase
      .from("review_registrations")
      .insert({
        team_name,
        leader_name,
        email,
        whatsapp,
        category,
        amount,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (regError || !registration) {
      console.error("Database insert registration error:", regError);
      return NextResponse.json(
        { success: false, error: "Gagal menyimpan data pendaftaran" },
        { status: 500 },
      );
    }

    // 2. Generate unique order_id: LOMBA-SIM-[TIMESTAMP]-[RANDOM]
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `LOMBA-SIM-${timestamp}-${randomStr}`;

    // 3. Create Snap transaction with Midtrans
    const snapResult = await createReviewSnapTransaction({
      orderId,
      grossAmount: amount,
      customerDetails: {
        first_name: leader_name,
        email,
        phone: whatsapp,
      },
      itemDetails: [
        {
          id: category.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          price: amount,
          quantity: 1,
          name: category,
        },
      ],
    });

    if (!snapResult.token) {
      return NextResponse.json(
        {
          success: false,
          error: "Gagal membuat transaksi Midtrans Snap",
        },
        { status: 500 },
      );
    }

    // 4. Save transaction to review_transactions
    const { error: txError } = await supabase
      .from("review_transactions")
      .insert({
        registration_id: registration.id,
        order_id: orderId,
        gross_amount: amount,
        snap_token: snapResult.token,
        payment_type: null,
        transaction_status: "pending",
      });

    if (txError) {
      console.error("Database insert transaction error:", txError);
      return NextResponse.json(
        { success: false, error: "Gagal menyimpan data transaksi" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        snap_token: snapResult.token,
        redirect_url: snapResult.redirectUrl,
        order_id: orderId,
        registration_id: registration.id,
      },
    });
  } catch (error: unknown) {
    console.error("Error in review checkout route:", error);
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
