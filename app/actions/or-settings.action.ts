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

/** Tahapan pipeline seleksi caang (bisa dikustomisasi per generasi) */
export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  /** Status OR yang dipetakan ke step ini */
  mappedStatus: string;
  order: number;
}

/** Link komunitas (WhatsApp, Discord, dll) */
export interface CommunityLinks {
  whatsapp: string;
  discord: string;
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

// ═══════════════════════════════════════════════
// PIPELINE STEPS (Tahapan Seleksi Caang) — Dinamis per generasi
// ═══════════════════════════════════════════════

const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "1",
    label: "Pendaftaran",
    description: "Registrasi dan verifikasi berkas",
    mappedStatus: "accepted",
    order: 1,
  },
  {
    id: "2",
    label: "Demo Robot & Perkenalan",
    description: "Pengenalan organisasi dan demo robot",
    mappedStatus: "training",
    order: 2,
  },
  {
    id: "3",
    label: "Pelatihan",
    description: "Sesi pelatihan dasar robotik",
    mappedStatus: "training",
    order: 3,
  },
  {
    id: "4",
    label: "Wawancara 1",
    description: "Wawancara tahap pertama",
    mappedStatus: "interview_1",
    order: 4,
  },
  {
    id: "5",
    label: "Project Robot",
    description: "Mengerjakan project robot secara tim",
    mappedStatus: "project_phase",
    order: 5,
  },
  {
    id: "6",
    label: "Wawancara 2",
    description: "Wawancara tahap akhir",
    mappedStatus: "interview_2",
    order: 6,
  },
  {
    id: "7",
    label: "Pelantikan Anggota Muda",
    description: "Resmi menjadi anggota muda UKM Robotik",
    mappedStatus: "graduated",
    order: 7,
  },
  {
    id: "8",
    label: "Penentuan Jabatan",
    description: "Penempatan di divisi organisasi",
    mappedStatus: "graduated",
    order: 8,
  },
];

/**
 * Mengambil konfigurasi pipeline steps seleksi caang
 */
export async function getPipelineSteps(): Promise<{
  data: PipelineStep[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: DEFAULT_PIPELINE_STEPS, error: null };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "pipeline_steps")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: DEFAULT_PIPELINE_STEPS, error: null };
      }
      return { data: DEFAULT_PIPELINE_STEPS, error: error.message };
    }

    return {
      data: (data.value as PipelineStep[]) || DEFAULT_PIPELINE_STEPS,
      error: null,
    };
  } catch (error) {
    console.error("[getPipelineSteps]", error);
    return {
      data: DEFAULT_PIPELINE_STEPS,
      error: "Gagal memuat pipeline steps.",
    };
  }
}

/**
 * Menyimpan konfigurasi pipeline steps seleksi caang (admin only)
 */
export async function savePipelineSteps(
  steps: PipelineStep[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "pipeline_steps",
        value: steps as unknown as string,
        description:
          "Tahapan pipeline seleksi caang (dikustomisasi per generasi)",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error) {
    console.error("[savePipelineSteps]", error);
    return { success: false, error: "Gagal menyimpan pipeline steps." };
  }
}

// ═══════════════════════════════════════════════
// COMMUNITY LINKS (WhatsApp & Discord)
// ═══════════════════════════════════════════════

/**
 * Mengambil link komunitas (WhatsApp, Discord)
 */
export async function getCommunityLinks(): Promise<{
  data: CommunityLinks;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: { whatsapp: "", discord: "" }, error: null };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "community_links")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: { whatsapp: "", discord: "" }, error: null };
      }
      return { data: { whatsapp: "", discord: "" }, error: error.message };
    }

    return {
      data: (data.value as CommunityLinks) || { whatsapp: "", discord: "" },
      error: null,
    };
  } catch (error) {
    console.error("[getCommunityLinks]", error);
    return {
      data: { whatsapp: "", discord: "" },
      error: "Gagal memuat link komunitas.",
    };
  }
}

/**
 * Menyimpan link komunitas (WhatsApp, Discord) — admin only
 */
export async function saveCommunityLinks(
  links: CommunityLinks,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "community_links",
        value: links as unknown as string,
        description: "Link grup WhatsApp dan server Discord",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error) {
    console.error("[saveCommunityLinks]", error);
    return { success: false, error: "Gagal menyimpan link komunitas." };
  }
}
