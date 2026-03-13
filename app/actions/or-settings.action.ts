"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

/** Tipe platform komunitas */
export type CommunityPlatform = "whatsapp" | "discord" | "telegram" | "other";

/** Item link komunitas satuan */
export interface CommunityLinkItem {
  id: string;
  platform: CommunityPlatform;
  label: string;
  url: string;
  is_active: boolean;
}

/** Daftar link komunitas */
export interface CommunityLinksConfig {
  links: CommunityLinkItem[];
}

/** Kontak panitia yang bisa dihubungi */
export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
}

/** Pengumuman dan kontak OR */
export interface AnnouncementSettings {
  message: string;
  is_active: boolean;
  contacts: ContactPerson[];
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
        return {
          data: { is_open: false, start_date: null, end_date: null },
          error: null,
        };
      }
      return {
        data: { is_open: false, start_date: null, end_date: null },
        error: null,
      };
    }
    return { data: data.value as RegistrationPeriod, error: null };
  } catch (error) {
    console.error("[getPublicRegistrationPeriod]", error);
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
 * Mengambil daftar rekening pembayaran
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
      if (error.code === "PGRST116") return { data: [], error: null };
      return { data: [], error: error.message };
    }
    return { data: (data.value as OrBankAccount[]) || [], error: null };
  } catch (error) {
    console.error("[getPaymentAccounts]", error);
    return { data: [], error: "Gagal memuat data rekening." };
  }
}

/**
 * Menyimpan seluruh daftar rekening pembayaran
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
      if (error.code === "PGRST116")
        return { data: { amount: 50000 }, error: null };
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
// PIPELINE STEPS
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
      if (error.code === "PGRST116")
        return { data: DEFAULT_PIPELINE_STEPS, error: null };
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/caang");

    return { success: true, error: null };
  } catch (error) {
    console.error("[savePipelineSteps]", error);
    return { success: false, error: "Gagal menyimpan pipeline steps." };
  }
}

// ═══════════════════════════════════════════════
// COMMUNITY LINKS (CRUD)
// ═══════════════════════════════════════════════

const DEFAULT_COMMUNITY_CONFIG: CommunityLinksConfig = {
  links: [
    {
      id: "1",
      platform: "whatsapp",
      label: "Grup WhatsApp Resmi",
      url: "",
      is_active: true,
    },
    {
      id: "2",
      platform: "discord",
      label: "Server Discord UKM",
      url: "",
      is_active: true,
    },
  ],
};

export async function getCommunityLinks(): Promise<{
  data: CommunityLinksConfig;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: DEFAULT_COMMUNITY_CONFIG, error: null };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "community_links")
      .single();
    if (error) {
      if (error.code === "PGRST116")
        return { data: DEFAULT_COMMUNITY_CONFIG, error: null };
      return { data: DEFAULT_COMMUNITY_CONFIG, error: error.message };
    }
    return {
      data: (data.value as CommunityLinksConfig) || DEFAULT_COMMUNITY_CONFIG,
      error: null,
    };
  } catch (error) {
    console.error("[getCommunityLinks]", error);
    return {
      data: DEFAULT_COMMUNITY_CONFIG,
      error: "Gagal memuat link komunitas.",
    };
  }
}

export async function saveCommunityLinks(
  config: CommunityLinksConfig,
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
        value: config as unknown as string,
        description: "Daftar link grup WhatsApp, Telegram, dan server Discord",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/caang");
    return { success: true, error: null };
  } catch (error) {
    console.error("[saveCommunityLinks]", error);
    return { success: false, error: "Gagal menyimpan link komunitas." };
  }
}

// ═══════════════════════════════════════════════
// ANNOUNCEMENT & CONTACTS
// ═══════════════════════════════════════════════

const DEFAULT_ANNOUNCEMENT: AnnouncementSettings = {
  message:
    "Selamat datang di Open Recruitment UKM Robotik PNP! Pantau terus timeline seleksi untuk informasi terbaru.",
  is_active: true,
  contacts: [
    {
      id: "1",
      name: "Sekretariat UKM",
      role: "Seketaris OR",
      phone: "628123456789",
    },
  ],
};

export async function getAnnouncementSettings(): Promise<{
  data: AnnouncementSettings;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: DEFAULT_ANNOUNCEMENT, error: null };

    const { data, error } = await supabase
      .from("or_settings")
      .select("value")
      .eq("key", "announcement_settings")
      .single();
    if (error) {
      if (error.code === "PGRST116")
        return { data: DEFAULT_ANNOUNCEMENT, error: null };
      return { data: DEFAULT_ANNOUNCEMENT, error: error.message };
    }
    return {
      data: (data.value as AnnouncementSettings) || DEFAULT_ANNOUNCEMENT,
      error: null,
    };
  } catch (error) {
    console.error("[getAnnouncementSettings]", error);
    return { data: DEFAULT_ANNOUNCEMENT, error: "Gagal memuat pengumuman." };
  }
}

export async function saveAnnouncementSettings(
  settings: AnnouncementSettings,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("or_settings").upsert(
      {
        key: "announcement_settings",
        value: settings as unknown as string,
        description:
          "Pesan pengumuman dashboard caang dan daftar kontak panitia",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/caang");
    return { success: true, error: null };
  } catch (error) {
    console.error("[saveAnnouncementSettings]", error);
    return { success: false, error: "Gagal menyimpan pengumuman." };
  }
}
