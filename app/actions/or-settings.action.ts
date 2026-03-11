"use server";

import { createClient } from "@/lib/supabase/server";

export interface RegistrationPeriod {
  is_open: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface RegistrationFee {
  amount: number;
}

export interface OrBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
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

/**
 * Mengambil daftar rekening pembayaran (JSON array) dari tabel or_settings
 */
export async function getPaymentAccounts(): Promise<{
  data: OrBankAccount[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Unauthorized" };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "payment_accounts")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: [], error: null };
      }
      return { data: [], error: error.message };
    }

    return { data: (data.value as OrBankAccount[]) || [], error: null };
  } catch (error) {
    console.error("[getPaymentAccounts]", error);
    return { data: [], error: "Gagal memuat data rekening." };
  }
}

/**
 * Menyimpan seluruh daftar rekening pembayaran ke tabel or_settings
 */
export async function savePaymentAccounts(
  accounts: OrBankAccount[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "payment_accounts",
        value: accounts as unknown as string,
        description: "Daftar rekening bank/e-wallet pembayaran OR",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };

    return { success: true, error: null };
  } catch (error) {
    console.error("[savePaymentAccounts]", error);
    return { success: false, error: "Gagal menyimpan data rekening." };
  }
}

/**
 * Mengambil nominal biaya pendaftaran OR
 */
export async function getRegistrationFee(): Promise<{
  data: RegistrationFee;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: { amount: 0 }, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "registration_fee")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: { amount: 50000 }, error: null }; // Default 50rb jika belum diatur
      }
      return { data: { amount: 0 }, error: error.message };
    }

    return {
      data: (data.value as RegistrationFee) || { amount: 0 },
      error: null,
    };
  } catch (error) {
    console.error("[getRegistrationFee]", error);
    return { data: { amount: 0 }, error: "Gagal memuat biaya pendaftaran." };
  }
}

/**
 * Menyimpan nominal biaya pendaftaran OR
 */
export async function saveRegistrationFee(
  fee: RegistrationFee,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "registration_fee",
        value: fee as unknown as string,
        description: "Nominal biaya pendaftaran OR",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };

    return { success: true, error: null };
  } catch (error) {
    console.error("[saveRegistrationFee]", error);
    return { success: false, error: "Gagal menyimpan biaya pendaftaran." };
  }
}
