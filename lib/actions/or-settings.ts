"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface PanitiaContact {
  name: string;
  phone_number: string;
}

export interface CommunityLinks {
  whatsapp_url: string;
  discord_url: string;
}

export interface TimelineEvent {
  title: string;
  start_date: string; // ISO String
  end_date: string; // ISO String
  description: string;
}

export interface OrSettingsData {
  periode_recruitment: string;
  status_pendaftaran: boolean;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  biaya_pendaftaran: number;
  rekening_penerima: BankAccount[];
  kontak_panitia: PanitiaContact[];
  link_komunitas: CommunityLinks;
  timeline: TimelineEvent[];
}

const SETTINGS_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Fetch OR Settings.
 * Accessible by any authenticated user (e.g. Caang needs registration info).
 */
export async function getOrSettings(): Promise<ServerActionResponse<OrSettingsData>> {
  try {
    const supabase = await createClient();

    // Verify session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

    const { data, error } = await supabase
      .from("or_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single();

    if (error) {
      return {
        success: false,
        message: "Gagal mengambil pengaturan OR dari database.",
        error: { code: "DATABASE_ERROR", details: error.message }
      };
    }

    return {
      success: true,
      message: "Pengaturan OR berhasil diambil.",
      data: {
        periode_recruitment: data.periode_recruitment,
        status_pendaftaran: data.status_pendaftaran,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        biaya_pendaftaran: data.biaya_pendaftaran,
        rekening_penerima: data.rekening_penerima as BankAccount[],
        kontak_panitia: data.kontak_panitia as PanitiaContact[],
        link_komunitas: data.link_komunitas as CommunityLinks,
        timeline: data.timeline as TimelineEvent[]
      }
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat mengambil pengaturan OR.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * Save OR Settings.
 * Accessible only by Admin OR or Super Admin.
 */
export async function saveOrSettings(
  data: Partial<OrSettingsData>
): Promise<ServerActionResponse<OrSettingsData>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

    // 2. Authorize user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Profil tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Profile not found" }
      };
    }

    const allowedRoles = ["admin-or", "super-admin"];
    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat mengubah pengaturan OR.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" }
      };
    }

    // 3. Validation
    if (data.periode_recruitment !== undefined && !data.periode_recruitment.trim()) {
      return {
        success: false,
        message: "Periode recruitment tidak boleh kosong.",
        error: { code: "BAD_REQUEST", details: "periode_recruitment is empty" }
      };
    }

    if (data.biaya_pendaftaran !== undefined && data.biaya_pendaftaran < 0) {
      return {
        success: false,
        message: "Biaya pendaftaran tidak boleh negatif.",
        error: { code: "BAD_REQUEST", details: "biaya_pendaftaran < 0" }
      };
    }

    if (data.rekening_penerima !== undefined) {
      for (const account of data.rekening_penerima) {
        if (!account.bank_name.trim() || !account.account_number.trim() || !account.account_holder.trim()) {
          return {
            success: false,
            message: "Data rekening penerima tidak lengkap.",
            error: { code: "BAD_REQUEST", details: "Invalid account entry" }
          };
        }
      }
    }

    if (data.kontak_panitia !== undefined) {
      for (const contact of data.kontak_panitia) {
        if (!contact.name.trim() || !contact.phone_number.trim()) {
          return {
            success: false,
            message: "Data kontak panitia tidak lengkap.",
            error: { code: "BAD_REQUEST", details: "Invalid contact entry" }
          };
        }
      }
    }

    if (data.timeline !== undefined) {
      for (const event of data.timeline) {
        if (!event.title.trim() || !event.start_date || !event.end_date) {
          return {
            success: false,
            message: "Data timeline tidak lengkap.",
            error: { code: "BAD_REQUEST", details: "Invalid timeline event" }
          };
        }
      }
    }

    // Prepare update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.periode_recruitment !== undefined) updatePayload.periode_recruitment = data.periode_recruitment;
    if (data.status_pendaftaran !== undefined) updatePayload.status_pendaftaran = data.status_pendaftaran;
    if (data.tanggal_mulai !== undefined) updatePayload.tanggal_mulai = data.tanggal_mulai;
    if (data.tanggal_selesai !== undefined) updatePayload.tanggal_selesai = data.tanggal_selesai;
    if (data.biaya_pendaftaran !== undefined) updatePayload.biaya_pendaftaran = data.biaya_pendaftaran;
    if (data.rekening_penerima !== undefined) updatePayload.rekening_penerima = data.rekening_penerima;
    if (data.kontak_panitia !== undefined) updatePayload.kontak_panitia = data.kontak_panitia;
    if (data.link_komunitas !== undefined) updatePayload.link_komunitas = data.link_komunitas;
    if (data.timeline !== undefined) updatePayload.timeline = data.timeline;

    // 4. Update Database
    const { data: updatedData, error: updateError } = await supabase
      .from("or_settings")
      .update(updatePayload)
      .eq("id", SETTINGS_ID)
      .select("*")
      .single();

    if (updateError || !updatedData) {
      return {
        success: false,
        message: "Gagal memperbarui pengaturan OR ke database.",
        error: { code: "DATABASE_ERROR", details: updateError?.message || "Returned null" }
      };
    }

    return {
      success: true,
      message: "Pengaturan OR berhasil diperbarui.",
      data: {
        periode_recruitment: updatedData.periode_recruitment,
        status_pendaftaran: updatedData.status_pendaftaran,
        tanggal_mulai: updatedData.tanggal_mulai,
        tanggal_selesai: updatedData.tanggal_selesai,
        biaya_pendaftaran: updatedData.biaya_pendaftaran,
        rekening_penerima: updatedData.rekening_penerima as BankAccount[],
        kontak_panitia: updatedData.kontak_panitia as PanitiaContact[],
        link_komunitas: updatedData.link_komunitas as CommunityLinks,
        timeline: updatedData.timeline as TimelineEvent[]
      }
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat memperbarui pengaturan OR.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
