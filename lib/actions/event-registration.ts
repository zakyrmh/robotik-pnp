"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import {
  eventRegistrationSchema,
  type EventRegistrationInput,
} from "@/lib/schemas/event-registration";
import {
  createMidtransQrisCharge,
  createMidtransSnapTransaction,
  checkMidtransTransactionStatus,
} from "@/lib/services/midtrans";
import { sendETicketEmail } from "@/lib/services/resend";
import { mrcUploadRateLimiter } from "@/lib/redis";
import {
  getActiveBatch,
  getCategoryBatchFee,
  BATCH_LABELS,
} from "@/lib/event-batch";
import {
  processAndUploadMrcImage,
  MrcImageValidationError,
} from "@/lib/server/mrc-image-pipeline";
import type { MrcImageKind } from "@/lib/mrc-image-config";
import { untypedFrom, untypedRpc } from "@/lib/supabase/untyped";
import type {
  ActionResult,
  EventRegistration,
  EventCategory,
  EventSettings,
} from "@/types/event-registration";

function generateRegistrationCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `MRC-${Date.now().toString().slice(-6)}-${randomSuffix}`;
}

function generateOrderId(registrationCode: string): string {
  return `ORDER-${registrationCode}-${Math.floor(Math.random() * 1000)}`;
}

export async function registerEventAction(
  payload: EventRegistrationInput,
): Promise<
  ActionResult<{
    registrationId: string;
    registrationCode: string;
    accessToken: string;
    qrUrl: string | null;
  }>
> {
  const validated = eventRegistrationSchema.safeParse(payload);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validated.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    const hasMemberError = Object.keys(fieldErrors).some((k) =>
      k.startsWith("members"),
    );
    // Server mencatat detail agar kegagalan validasi bisa ditelusuri dari log.
    console.error(
      "registerEventAction validation failed:",
      JSON.stringify(fieldErrors),
    );
    return {
      success: false,
      error: hasMemberError
        ? "Data anggota tim tidak valid (nama, pas foto, atau kartu identitas). Coba unggah ulang foto anggota, lalu kirim lagi."
        : "Input pendaftaran tidak valid. Mohon periksa kembali data Anda.",
      fieldErrors,
    };
  }

  const adminSupabase = createAdminClient();

  // Get category to fetch fee
  const { data: categoryData, error: catError } = await (untypedFrom(
    adminSupabase,
    "event_categories",
  )
    .select("*")
    .eq("id", validated.data.category_id)
    .single() as unknown as Promise<{
    data: EventCategory | null;
    error: unknown;
  }>);

  if (catError || !categoryData) {
    return { success: false, error: "Kategori lomba tidak ditemukan." };
  }

  if (!categoryData.is_active) {
    return {
      success: false,
      error: "Pendaftaran untuk kategori lomba ini sudah ditutup.",
    };
  }

  // Tentukan batch aktif dari settings global → biaya batch 1 / batch 2
  const { data: settings } = await (untypedFrom(adminSupabase, "event_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle() as unknown as Promise<{ data: EventSettings | null }>);

  const activeBatch = getActiveBatch(settings);
  if (!activeBatch) {
    return {
      success: false,
      error: "Pendaftaran sedang ditutup (di luar periode Batch 1 / Batch 2).",
    };
  }

  const totalAmount = getCategoryBatchFee(categoryData, activeBatch);

  const regCode = generateRegistrationCode();

  try {
    // Call DB RPC register_team for atomic quota lock
    const { data: regId, error: rpcError } = await untypedRpc<{
      data: string | null;
      error: { message: string } | null;
    }>(adminSupabase, "register_team", {
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
    });

    if (rpcError) {
      if (rpcError.message?.includes("quota_full")) {
        return {
          success: false,
          error: "Maaf, kuota pendaftaran untuk kategori ini sudah penuh.",
        };
      }
      return {
        success: false,
        error: `Gagal mendaftarkan tim: ${rpcError.message}`,
      };
    }

    if (!regId) {
      return {
        success: false,
        error: "Terjadi kesalahan sistem saat mendaftar.",
      };
    }

    // Catat batch pendaftaran ( dipakai untuk audit & nominal Midtrans )
    await untypedFrom(adminSupabase, "event_registrations")
      .update({ registration_batch: activeBatch })
      .eq("id", regId);

    const orderId = generateOrderId(regCode);

    // Buat tagihan QRIS dinamis (satu-satunya metode pembayaran) bila ada biaya
    let currentRegRecord: EventRegistration | null = null;
    const qrUrl: string | null = null;

    let snapToken: string | null = null;

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
            name: `Biaya Lomba ${categoryData.name} (${BATCH_LABELS[activeBatch]})`,
          },
        ],
      });
      snapToken = snapRes.token;

      // Update registration record with order_id and Snap token
      const { data: updatedReg } = await (untypedFrom(
        adminSupabase,
        "event_registrations",
      )
        .update({
          midtrans_order_id: orderId,
          midtrans_snap_token: snapRes.token,
          midtrans_payment_type: "snap",
        })
        .eq("id", regId)
        .select("*")
        .single() as unknown as Promise<{ data: EventRegistration | null }>);

      currentRegRecord = updatedReg;

      // Send pending registration confirmation email with access link
      if (currentRegRecord) {
        const appUrl =
          process.env.APP_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.SITE_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "http://localhost:3000";
        await sendETicketEmail({
          toEmail: currentRegRecord.team_email,
          teamName: currentRegRecord.team_name,
          registrationCode: currentRegRecord.registration_code,
          categoryName: categoryData.name,
          accessToken: currentRegRecord.access_token,
          appBaseUrl: appUrl,
          paymentStatus: "pending",
        });
      }
    } else {
      // Free registration -> set paid directly
      const { data: regRecord } = await (untypedFrom(
        adminSupabase,
        "event_registrations",
      )
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", regId)
        .select("*")
        .single() as unknown as Promise<{ data: EventRegistration | null }>);

      currentRegRecord = regRecord;

      if (regRecord) {
        const appUrl =
          process.env.APP_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.SITE_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "http://localhost:3000";
        await sendETicketEmail({
          toEmail: regRecord.team_email,
          teamName: regRecord.team_name,
          registrationCode: regRecord.registration_code,
          categoryName: categoryData.name,
          accessToken: regRecord.access_token,
          appBaseUrl: appUrl,
          paymentStatus: "paid",
        });
      }
    }

    revalidatePath("/manajemen-event");

    return {
      success: true,
      data: {
        registrationId: regId,
        registrationCode: regCode,
        accessToken: currentRegRecord?.access_token || "",
        qrUrl,
      },
      message: "Pendaftaran berhasil disimpan.",
    };
  } catch (err: unknown) {
    console.error("registerEventAction error:", err);
    return {
      success: false,
      error: (err as Error).message || "Terjadi kesalahan server.",
    };
  }
}

/**
 * Menerbitkan ulang QRIS dinamis untuk pendaftaran yang QR-nya kedaluwarsa
 * atau gagal. Membuat order_id baru (Midtrans tidak mengizinkan charge ulang
 * order_id yang sama untuk QR baru) dan mengembalikan status ke pending.
 */
export async function refreshQrisChargeAction(
  accessToken: string,
): Promise<ActionResult<{ qrUrl: string | null }>> {
  if (!accessToken) {
    return { success: false, error: "Token akses tidak valid." };
  }

  const clientIp = await getUploadClientIp();
  const { success: withinLimit } = await mrcUploadRateLimiter.limit(
    `${clientIp}:${accessToken}`,
  );
  if (!withinLimit) {
    return {
      success: false,
      error:
        "Terlalu banyak permintaan QR baru. Silakan coba lagi dalam beberapa menit.",
    };
  }

  const adminSupabase = createAdminClient();

  const { data: reg } = await (untypedFrom(adminSupabase, "event_registrations")
    .select(
      `
      *,
      category:event_categories(*)
    `,
    )
    .eq("access_token", accessToken)
    .single() as unknown as Promise<{ data: EventRegistration | null }>);

  if (!reg) {
    return { success: false, error: "Data pendaftaran tidak ditemukan." };
  }
  if (reg.payment_status === "paid") {
    return { success: false, error: "Pendaftaran ini sudah lunas." };
  }
  if (reg.total_amount <= 0) {
    return {
      success: false,
      error: "Pendaftaran ini gratis, tidak perlu QR pembayaran.",
    };
  }

  const orderId = `${generateOrderId(reg.registration_code)}-R${Date.now().toString().slice(-4)}`;

  try {
    const snapRes = await createMidtransSnapTransaction({
      orderId,
      grossAmount: reg.total_amount,
      customerDetails: {
        first_name: reg.team_name,
        email: reg.team_email,
        phone: reg.team_whatsapp,
      },
      itemDetails: [
        {
          id: reg.category_id,
          price: reg.total_amount,
          quantity: 1,
          name: `Biaya Lomba ${reg.category?.name || "MRC"}`,
        },
      ],
    });

    await untypedFrom(adminSupabase, "event_registrations")
      .update({
        midtrans_order_id: orderId,
        midtrans_snap_token: snapRes.token,
        midtrans_payment_type: "snap",
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reg.id);

    revalidatePath("/manajemen-event");

    return { success: true, data: { qrUrl: null } };
  } catch (err: unknown) {
    console.error("refreshQrisChargeAction error:", err);
    return {
      success: false,
      error: "Gagal membuat sesi pembayaran baru. Silakan coba lagi.",
    };
  }
}

export async function getRegistrationByAccessTokenAction(
  accessToken: string,
): Promise<ActionResult<EventRegistration>> {
  if (!accessToken) {
    return { success: false, error: "Token akses tidak valid." };
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .select(
      `
      *,
      category:event_categories(*),
      members:event_team_members(*)
    `,
    )
    .eq("access_token", accessToken)
    .single() as unknown as Promise<{
    data: EventRegistration | null;
    error: unknown;
  }>);

  if (error || !data) {
    return {
      success: false,
      error: "Data pendaftaran tidak ditemukan atau token tidak valid.",
    };
  }

  // Active Sync: If status is still pending, check Midtrans REST API status to auto-update
  if (data.payment_status === "pending" && data.midtrans_order_id) {
    const midtransData = await checkMidtransTransactionStatus(
      data.midtrans_order_id,
    );
    if (midtransData) {
      const status = midtransData.transaction_status;
      let newStatus: "pending" | "paid" | "expired" | "failed" = "pending";

      if (
        status === "settlement" ||
        (status === "capture" && midtransData.fraud_status === "accept")
      ) {
        newStatus = "paid";
      } else if (status === "expire") {
        newStatus = "expired";
      } else if (status === "deny" || status === "cancel") {
        newStatus = "failed";
      }

      if (newStatus !== "pending") {
        const updatePayload: Record<string, unknown> = {
          payment_status: newStatus,
          midtrans_payment_type:
            midtransData.payment_type || data.midtrans_payment_type,
          updated_at: new Date().toISOString(),
        };

        if (newStatus === "paid") {
          updatePayload.paid_at = new Date().toISOString();
        }

        await untypedFrom(adminSupabase, "event_registrations")
          .update(updatePayload)
          .eq("id", data.id);

        data.payment_status = newStatus;
        if (midtransData.payment_type) {
          data.midtrans_payment_type = midtransData.payment_type;
        }

        if (newStatus === "paid") {
          const appUrl =
            process.env.APP_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.SITE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000";
          await sendETicketEmail({
            toEmail: data.team_email,
            teamName: data.team_name,
            registrationCode: data.registration_code,
            categoryName: data.category?.name || "Minangkabau Robot Contest",
            accessToken: data.access_token,
            appBaseUrl: appUrl,
            paymentStatus: "paid",
          });
        }
      }
    }
  }

  return { success: true, data };
}

export async function submitManualPaymentProofAction(
  registrationId: string,
  proofUrl: string,
): Promise<ActionResult<{ success: boolean }>> {
  if (!registrationId || !proofUrl) {
    return {
      success: false,
      error: "ID Pendaftaran dan URL Bukti Bayar wajib diisi.",
    };
  }

  const adminSupabase = createAdminClient();

  const { error } = await (untypedFrom(adminSupabase, "event_registrations")
    .update({
      manual_payment_proof_url: proofUrl,
    })
    .eq("id", registrationId) as unknown as Promise<{ error: unknown }>);

  if (error) {
    return {
      success: false,
      error: "Gagal menyimpan bukti pembayaran manual.",
    };
  }

  return {
    success: true,
    data: { success: true },
    message: "Bukti pembayaran berhasil diunggah. Menunggu konfirmasi panitia.",
  };
}

async function getUploadClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Jalur upload gambar MRC bersama: rate-limit → validasi magic bytes
 * (`file-type`) → normalisasi WebP via `sharp` → simpan ke Cloudflare R2.
 *
 * `File.type` dari browser TIDAK dipercaya — keputusan format memakai 100%
 * hasil inspeksi signature di `processAndUploadMrcImage`.
 */
async function handleMrcImageUpload(
  formData: FormData,
  kind: MrcImageKind,
): Promise<ActionResult<string>> {
  const emptyMessage =
    kind === "photo"
      ? "File foto tidak boleh kosong."
      : "File kartu identitas tidak boleh kosong.";

  const clientIp = await getUploadClientIp();
  const { success: withinLimit } = await mrcUploadRateLimiter.limit(clientIp);
  if (!withinLimit) {
    return {
      success: false,
      error:
        "Terlalu banyak upaya upload. Silakan coba lagi dalam beberapa menit.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: emptyMessage };
  }

  try {
    const processed = await processAndUploadMrcImage(file, kind);
    // Kontrak balik tetap URL tunggal (varian utama WebP) agar skema
    // `photo_url` / `identity_card_url` tidak berubah; thumbnail ikut
    // tersimpan di R2 sebagai `<id>-thumb.webp` untuk kebutuhan verifikasi.
    return { success: true, data: processed.url };
  } catch (err: unknown) {
    if (err instanceof MrcImageValidationError) {
      return { success: false, error: err.message };
    }
    console.error("[MRC_UPLOAD_ERROR]", err);
    return {
      success: false,
      error: "Gagal mengunggah file. Silakan coba lagi.",
    };
  }
}

export async function uploadMemberPhotoAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  return handleMrcImageUpload(formData, "photo");
}

export async function uploadMemberIdentityCardAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  return handleMrcImageUpload(formData, "identityCard");
}
