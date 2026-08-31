"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { eventRegistrationSchema, type EventRegistrationInput } from "@/lib/schemas/event-registration";
import { createMidtransSnapTransaction } from "@/lib/services/midtrans";
import { sendETicketEmail } from "@/lib/services/resend";
import type { ActionResult, EventRegistration, EventCategory } from "@/types/event-registration";

function generateRegistrationCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `MRC-${Date.now().toString().slice(-6)}-${randomSuffix}`;
}

function generateOrderId(registrationCode: string): string {
  return `ORDER-${registrationCode}-${Math.floor(Math.random() * 1000)}`;
}

export async function registerEventAction(
  payload: EventRegistrationInput
): Promise<ActionResult<{ registrationId: string; snapToken: string; redirectUrl?: string; registrationCode: string }>> {
  const validated = eventRegistrationSchema.safeParse(payload);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validated.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      success: false,
      error: "Input pendaftaran tidak valid. Mohon periksa kembali data Anda.",
      fieldErrors,
    };
  }

  const adminSupabase = createAdminClient();

  // Get category to fetch fee
  const { data: categoryData, error: catError } = await (adminSupabase
    .from("event_categories" as any)
    .select("*")
    .eq("id", validated.data.category_id)
    .single() as unknown as Promise<{ data: EventCategory | null; error: unknown }>);

  if (catError || !categoryData) {
    return { success: false, error: "Kategori lomba tidak ditemukan." };
  }

  if (!categoryData.is_active) {
    return { success: false, error: "Pendaftaran untuk kategori lomba ini sudah ditutup." };
  }

  const regCode = generateRegistrationCode();
  const totalAmount = categoryData.registration_fee;

  try {
    // Call DB RPC register_team for atomic quota lock
    const { data: regId, error: rpcError } = await (adminSupabase.rpc("register_team" as any, {
      p_category_id: validated.data.category_id,
      p_registration_code: regCode,
      p_team_name: validated.data.team_name,
      p_institution: validated.data.institution,
      p_origin_city: validated.data.origin_city,
      p_advisor_name: validated.data.advisor_name || null,
      p_team_email: validated.data.team_email,
      p_team_whatsapp: validated.data.team_whatsapp,
      p_total_amount: totalAmount,
      p_rules_version_id: validated.data.rules_version_id || null,
      p_members: validated.data.members,
    }) as unknown as Promise<{ data: string | null; error: { message: string } | null }>);

    if (rpcError) {
      if (rpcError.message?.includes("quota_full")) {
        return { success: false, error: "Maaf, kuota pendaftaran untuk kategori ini sudah penuh." };
      }
      return { success: false, error: `Gagal mendaftarkan tim: ${rpcError.message}` };
    }

    if (!regId) {
      return { success: false, error: "Terjadi kesalahan sistem saat mendaftar." };
    }

    const orderId = generateOrderId(regCode);

    // Create Midtrans Snap Transaction if fee > 0
    let snapToken = "";
    let redirectUrl = "";

    if (totalAmount > 0) {
      const snapRes = await createMidtransSnapTransaction({
        orderId,
        grossAmount: totalAmount,
        customerDetails: {
          first_name: validated.data.team_name,
          email: validated.data.team_email,
          phone: validated.data.team_whatsapp,
        },
        itemDetails: [
          {
            id: categoryData.id,
            price: totalAmount,
            quantity: 1,
            name: `Biaya Lomba ${categoryData.name}`,
          },
        ],
      });
      snapToken = snapRes.token;
      redirectUrl = snapRes.redirect_url;

      // Update registration record with order_id and snap_token
      await (adminSupabase
        .from("event_registrations" as any)
        .update({
          midtrans_order_id: orderId,
          midtrans_snap_token: snapToken,
        })
        .eq("id", regId));
    } else {
      // Free registration -> set paid directly
      const { data: regRecord } = await (adminSupabase
        .from("event_registrations" as any)
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", regId)
        .select("*")
        .single() as unknown as Promise<{ data: EventRegistration | null }>);

      if (regRecord) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendETicketEmail({
          toEmail: regRecord.team_email,
          teamName: regRecord.team_name,
          registrationCode: regRecord.registration_code,
          categoryName: categoryData.name,
          accessToken: regRecord.access_token,
          appBaseUrl: appUrl,
        });
      }
    }

    revalidatePath("/manajemen-event");

    return {
      success: true,
      data: {
        registrationId: regId,
        snapToken,
        redirectUrl,
        registrationCode: regCode,
      },
      message: "Pendaftaran berhasil disimpan.",
    };
  } catch (err: unknown) {
    console.error("registerEventAction error:", err);
    return { success: false, error: (err as Error).message || "Terjadi kesalahan server." };
  }
}

export async function getRegistrationByAccessTokenAction(
  accessToken: string
): Promise<ActionResult<EventRegistration>> {
  if (!accessToken) {
    return { success: false, error: "Token akses tidak valid." };
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await (adminSupabase
    .from("event_registrations" as any)
    .select(`
      *,
      category:event_categories(*),
      members:event_team_members(*)
    `)
    .eq("access_token", accessToken)
    .single() as unknown as Promise<{ data: EventRegistration | null; error: unknown }>);

  if (error || !data) {
    return { success: false, error: "Data pendaftaran tidak ditemukan atau token tidak valid." };
  }

  return { success: true, data };
}

export async function submitManualPaymentProofAction(
  registrationId: string,
  proofUrl: string
): Promise<ActionResult<{ success: boolean }>> {
  if (!registrationId || !proofUrl) {
    return { success: false, error: "ID Pendaftaran dan URL Bukti Bayar wajib diisi." };
  }

  const adminSupabase = createAdminClient();

  const { error } = await (adminSupabase
    .from("event_registrations" as any)
    .update({
      manual_payment_proof_url: proofUrl,
    })
    .eq("id", registrationId) as unknown as Promise<{ error: unknown }>);

  if (error) {
    return { success: false, error: "Gagal menyimpan bukti pembayaran manual." };
  }

  return { success: true, data: { success: true }, message: "Bukti pembayaran berhasil diunggah. Menunggu konfirmasi panitia." };
}

export async function uploadMemberPhotoAction(formData: FormData): Promise<ActionResult<string>> {
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "File foto tidak boleh kosong." };
  }

  // Use Admin Client (service_role) to allow unauthenticated public registrants to upload member photos
  const adminSupabase = createAdminClient();
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `photos/${fileName}`;

  const { error: uploadError } = await adminSupabase.storage
    .from("event-member-photos")
    .upload(filePath, file, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return { success: false, error: `Gagal mengunggah foto: ${uploadError.message}` };
  }

  const { data: publicUrlData } = adminSupabase.storage
    .from("event-member-photos")
    .getPublicUrl(filePath);

  return { success: true, data: publicUrlData.publicUrl };
}
