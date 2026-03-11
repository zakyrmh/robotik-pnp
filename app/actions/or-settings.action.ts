"use server";

import { createClient } from "@/lib/supabase/server";

export interface RegistrationPeriod {
  is_open: boolean;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Mengambil pengaturan periode pendaftaran dari database
 */
export async function getRegistrationPeriod(): Promise<{
  data: RegistrationPeriod | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "registration_period")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Jika baris belum ada, kembalikan default
        return {
          data: { is_open: false, start_date: null, end_date: null },
          error: null,
        };
      }
      return { data: null, error: error.message };
    }

    return { data: data.value as RegistrationPeriod, error: null };
  } catch (error) {
    console.error("[getRegistrationPeriod]", error);
    return { data: null, error: "Gagal memuat pengaturan pendaftaran." };
  }
}

/**
 * Mengambil pengaturan periode pendaftaran tanpa memerlukan autentikasi.
 * Digunakan oleh halaman publik /register untuk mengecek status pendaftaran.
 *
 * Catatan: Pastikan tabel `or_settings` memiliki RLS policy yang mengizinkan
 * anon role untuk membaca baris dengan key = 'registration_period'.
 */
export async function getPublicRegistrationPeriod(): Promise<{
  data: RegistrationPeriod | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "registration_period")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Belum ada data → anggap pendaftaran ditutup
        return {
          data: { is_open: false, start_date: null, end_date: null },
          error: null,
        };
      }
      // Error lain (termasuk RLS block) → fallback ke ditutup
      return {
        data: { is_open: false, start_date: null, end_date: null },
        error: null,
      };
    }

    return { data: data.value as RegistrationPeriod, error: null };
  } catch (error) {
    console.error("[getPublicRegistrationPeriod]", error);
    // Jika terjadi error tak terduga, tampilkan pendaftaran ditutup
    return {
      data: { is_open: false, start_date: null, end_date: null },
      error: null,
    };
  }
}

/**
 * Memperbarui pengaturan periode pendaftaran OR
 */
export async function updateRegistrationPeriod(
  periodData: RegistrationPeriod,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Upsert pengaturan
    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "registration_period",
        value: periodData,
        description: "Periode pendaftaran Open Recruitment",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };

    return { success: true, error: null };
  } catch (error) {
    console.error("[updateRegistrationPeriod]", error);
    return { success: false, error: "Gagal memperbarui pengaturan." };
  }
}
