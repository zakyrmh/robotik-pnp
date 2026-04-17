"use server";

/**
 * Server Actions — Pengaturan Open Recruitment
 *
 * Guard akses:
 * - requireModule('open-recruitment') → OR admin, admin, super_admin
 * - Beberapa fungsi read publik (tanpa auth) untuk halaman /register
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireModule, isActionError, ok, fail } from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ═══════════════════════════════════════════════════════
// TIPE
// ═══════════════════════════════════════════════════════

export interface RegistrationPeriod {
  is_open: boolean;
  period_label: string;
  start_date: string | null;
  end_date: string | null;
}

export interface RegistrationFee {
  amount: number;
}

export type CommunityPlatform = "whatsapp" | "discord" | "telegram" | "other";

export interface CommunityLinkItem {
  id: string;
  platform: CommunityPlatform;
  label: string;
  url: string;
  is_active: boolean;
}

export interface CommunityLinksConfig {
  links: CommunityLinkItem[];
}

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
}

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

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  mappedStatus: string;
  order: number;
}

// ═══════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═══════════════════════════════════════════════════════

const registrationPeriodSchema = z
  .object({
    is_open: z.boolean(),
    period_label: z
      .string()
      .min(1, "Kode periode OR wajib diisi (contoh: OR-20).")
      .max(20, "Kode periode maksimal 20 karakter."),
    start_date: z.string().datetime().nullable(),
    end_date: z.string().datetime().nullable(),
  })
  .refine(
    (d) => {
      if (d.is_open && (!d.start_date || !d.end_date)) {
        return false;
      }
      return true;
    },
    {
      message: "Tanggal mulai dan selesai wajib diisi saat pendaftaran dibuka.",
    },
  );

const registrationFeeSchema = z.object({
  amount: z.number().int().min(0, "Nominal tidak boleh negatif"),
});

const bankAccountSchema = z.object({
  id: z.string(),
  bank_name: z.string().min(1).max(100),
  account_number: z.string().min(1).max(50),
  account_name: z.string().min(1).max(100),
  is_active: z.boolean(),
});

const communityLinkSchema = z.object({
  id: z.string(),
  platform: z.enum(["whatsapp", "discord", "telegram", "other"]),
  label: z.string().min(1).max(100),
  url: z.string().url("URL tidak valid"),
  is_active: z.boolean(),
});

const announcementSchema = z.object({
  message: z.string().max(2000),
  is_active: z.boolean(),
  contacts: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      role: z.string().min(1).max(100),
      phone: z.string().min(1).max(20),
    }),
  ),
});

// ═══════════════════════════════════════════════════════
// HELPER: Upsert setting ke or_settings
// ═══════════════════════════════════════════════════════

async function upsertSetting(
  key: string,
  value: unknown,
  description: string,
  updatedBy: string,
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("or_settings").upsert(
    {
      key,
      value: value as Json,
      description,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: "key" },
  );

  if (error) return fail(error.message);
  return ok({ success: true });
}

async function getSetting<T>(
  key: string,
  defaultValue: T,
): Promise<ActionResult<T>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("or_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    // PGRST116 = row not found → return default
    if (error.code === "PGRST116") return ok(defaultValue);
    return fail(error.message);
  }

  return ok((data.value as T) ?? defaultValue);
}

// ═══════════════════════════════════════════════════════
// PERIODE PENDAFTARAN
// ═══════════════════════════════════════════════════════

/**
 * Ambil periode pendaftaran — PUBLIK (tanpa auth).
 * Dipakai di halaman /register untuk cek buka/tutup.
 */
export async function getPublicRegistrationPeriod(): Promise<
  ActionResult<RegistrationPeriod>
> {
  try {
    return await getSetting<RegistrationPeriod>("registration_period", {
      is_open: false,
      period_label: "",
      start_date: null,
      end_date: null,
    });
  } catch (err) {
    console.error("[getPublicRegistrationPeriod]", err);
    return ok({
      is_open: false,
      period_label: "",
      start_date: null,
      end_date: null,
    });
  }
}

/** Ambil periode pendaftaran — khusus OR admin */
export async function getRegistrationPeriod(): Promise<
  ActionResult<RegistrationPeriod>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    return await getSetting<RegistrationPeriod>("registration_period", {
      is_open: false,
      period_label: "",
      start_date: null,
      end_date: null,
    });
  } catch (err) {
    console.error("[getRegistrationPeriod]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update periode pendaftaran — khusus OR admin */
export async function updateRegistrationPeriod(
  input: RegistrationPeriod,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = registrationPeriodSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const result = await upsertSetting(
      "registration_period",
      parsed.data,
      "Periode pendaftaran Open Recruitment",
      auth.userId,
    );

    if (result.error) return result;

    revalidatePath("/register");
    revalidatePath("/dashboard/or");
    return ok({ success: true });
  } catch (err) {
    console.error("[updateRegistrationPeriod]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// BIAYA PENDAFTARAN
// ═══════════════════════════════════════════════════════

/** Ambil biaya pendaftaran — khusus OR admin */
export async function getRegistrationFee(): Promise<
  ActionResult<RegistrationFee>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    return await getSetting<RegistrationFee>("registration_fee", {
      amount: 50000,
    });
  } catch (err) {
    console.error("[getRegistrationFee]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update biaya pendaftaran — khusus OR admin */
export async function saveRegistrationFee(
  input: RegistrationFee,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = registrationFeeSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    return await upsertSetting(
      "registration_fee",
      parsed.data,
      "Nominal biaya pendaftaran OR",
      auth.userId,
    );
  } catch (err) {
    console.error("[saveRegistrationFee]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// REKENING PEMBAYARAN
// ═══════════════════════════════════════════════════════

/** Ambil daftar rekening — khusus OR admin */
export async function getPaymentAccounts(): Promise<
  ActionResult<OrBankAccount[]>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    return await getSetting<OrBankAccount[]>("payment_accounts", []);
  } catch (err) {
    console.error("[getPaymentAccounts]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Ambil daftar rekening aktif — PUBLIK.
 * Dipakai caang saat upload bukti pembayaran.
 */
export async function getPublicPaymentAccounts(): Promise<
  ActionResult<OrBankAccount[]>
> {
  try {
    const result = await getSetting<OrBankAccount[]>("payment_accounts", []);
    if (result.error) return ok([]);

    // Hanya kembalikan yang aktif
    const active = (result.data ?? []).filter((a) => a.is_active);
    return ok(active);
  } catch (err) {
    console.error("[getPublicPaymentAccounts]", err);
    return ok([]);
  }
}

/** Simpan daftar rekening — khusus OR admin */
export async function savePaymentAccounts(
  accounts: OrBankAccount[],
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.array(bankAccountSchema).safeParse(accounts);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    return await upsertSetting(
      "payment_accounts",
      parsed.data,
      "Daftar rekening bank/e-wallet pembayaran OR",
      auth.userId,
    );
  } catch (err) {
    console.error("[savePaymentAccounts]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// LINK KOMUNITAS
// ═══════════════════════════════════════════════════════

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

/** Ambil link komunitas — khusus OR admin */
export async function getCommunityLinks(): Promise<
  ActionResult<CommunityLinksConfig>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    return await getSetting<CommunityLinksConfig>(
      "community_links",
      DEFAULT_COMMUNITY_CONFIG,
    );
  } catch (err) {
    console.error("[getCommunityLinks]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Ambil link komunitas aktif — PUBLIK.
 * Dipakai di dashboard caang.
 */
export async function getPublicCommunityLinks(): Promise<
  ActionResult<CommunityLinkItem[]>
> {
  try {
    const result = await getSetting<CommunityLinksConfig>(
      "community_links",
      DEFAULT_COMMUNITY_CONFIG,
    );
    if (result.error) return ok([]);

    const active = (result.data?.links ?? []).filter(
      (l) => l.is_active && l.url,
    );
    return ok(active);
  } catch (err) {
    console.error("[getPublicCommunityLinks]", err);
    return ok([]);
  }
}

/** Simpan link komunitas — khusus OR admin */
export async function saveCommunityLinks(
  config: CommunityLinksConfig,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z
      .object({
        links: z.array(communityLinkSchema),
      })
      .safeParse(config);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const result = await upsertSetting(
      "community_links",
      parsed.data,
      "Daftar link grup WhatsApp, Telegram, dan server Discord",
      auth.userId,
    );

    if (result.error) return result;

    revalidatePath("/dashboard/caang");
    return ok({ success: true });
  } catch (err) {
    console.error("[saveCommunityLinks]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// PENGUMUMAN & KONTAK
// ═══════════════════════════════════════════════════════

const DEFAULT_ANNOUNCEMENT: AnnouncementSettings = {
  message: "Selamat datang di Open Recruitment UKM Robotik PNP!",
  is_active: true,
  contacts: [
    {
      id: "1",
      name: "Sekretariat UKM",
      role: "Sekretaris OR",
      phone: "628123456789",
    },
  ],
};

/** Ambil pengumuman — khusus OR admin */
export async function getAnnouncementSettings(): Promise<
  ActionResult<AnnouncementSettings>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    return await getSetting<AnnouncementSettings>(
      "announcement_settings",
      DEFAULT_ANNOUNCEMENT,
    );
  } catch (err) {
    console.error("[getAnnouncementSettings]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Ambil pengumuman aktif — PUBLIK.
 * Dipakai di dashboard caang.
 */
export async function getPublicAnnouncement(): Promise<
  ActionResult<AnnouncementSettings | null>
> {
  try {
    const result = await getSetting<AnnouncementSettings>(
      "announcement_settings",
      DEFAULT_ANNOUNCEMENT,
    );
    if (result.error) return ok(null);
    if (!result.data?.is_active) return ok(null);
    return ok(result.data);
  } catch (err) {
    console.error("[getPublicAnnouncement]", err);
    return ok(null);
  }
}

/** Simpan pengumuman — khusus OR admin */
export async function saveAnnouncementSettings(
  settings: AnnouncementSettings,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = announcementSchema.safeParse(settings);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const result = await upsertSetting(
      "announcement_settings",
      parsed.data,
      "Pesan pengumuman dashboard caang dan daftar kontak panitia",
      auth.userId,
    );

    if (result.error) return result;

    revalidatePath("/dashboard/caang");
    return ok({ success: true });
  } catch (err) {
    console.error("[saveAnnouncementSettings]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// PIPELINE STEPS (konfigurasi tampilan timeline)
// ═══════════════════════════════════════════════════════

/**
 * Pipeline steps ini hanya untuk konfigurasi TAMPILAN timeline di UI.
 * Status aktual caang disimpan di or_registrations.pipeline_status.
 */
const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "1",
    label: "Pendaftaran & Verifikasi Berkas",
    description: "Registrasi dan verifikasi dokumen & pembayaran",
    mappedStatus: "accepted",
    order: 1,
  },
  {
    id: "2",
    label: "Pengenalan & Demo Robot",
    description: "Pengenalan organisasi dan demo robot",
    mappedStatus: "intro_demo",
    order: 2,
  },
  {
    id: "3",
    label: "Wawancara 1",
    description: "Wawancara tahap pertama",
    mappedStatus: "interview_1_passed",
    order: 3,
  },
  {
    id: "4",
    label: "Pelatihan",
    description: "Sesi pelatihan dasar robotik",
    mappedStatus: "training",
    order: 4,
  },
  {
    id: "5",
    label: "Family Gathering",
    description: "Kegiatan kebersamaan",
    mappedStatus: "family_gathering",
    order: 5,
  },
  {
    id: "6",
    label: "Project Robot",
    description: "Mengerjakan project robot secara tim",
    mappedStatus: "project",
    order: 6,
  },
  {
    id: "7",
    label: "Wawancara 2",
    description: "Wawancara tahap akhir",
    mappedStatus: "interview_2_passed",
    order: 7,
  },
  {
    id: "8",
    label: "Magang Rolling",
    description: "Magang bergiliran di semua divisi",
    mappedStatus: "internship_rolling",
    order: 8,
  },
  {
    id: "9",
    label: "Magang Tetap",
    description: "Magang di divisi pilihan sendiri",
    mappedStatus: "internship_fixed",
    order: 9,
  },
  {
    id: "10",
    label: "Pelantikan",
    description: "Resmi menjadi anggota UKM Robotik",
    mappedStatus: "inducted",
    order: 10,
  },
];

/** Ambil konfigurasi pipeline steps */
export async function getPipelineSteps(): Promise<
  ActionResult<PipelineStep[]>
> {
  try {
    return await getSetting<PipelineStep[]>(
      "pipeline_steps",
      DEFAULT_PIPELINE_STEPS,
    );
  } catch (err) {
    console.error("[getPipelineSteps]", err);
    return ok(DEFAULT_PIPELINE_STEPS);
  }
}

/** Simpan konfigurasi pipeline steps — khusus OR admin */
export async function savePipelineSteps(
  steps: PipelineStep[],
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z
      .array(
        z.object({
          id: z.string(),
          label: z.string().min(1).max(100),
          description: z.string().max(500),
          mappedStatus: z.string(),
          order: z.number().int().min(1),
        }),
      )
      .safeParse(steps);

    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const result = await upsertSetting(
      "pipeline_steps",
      parsed.data,
      "Tahapan pipeline seleksi caang (dikustomisasi per generasi)",
      auth.userId,
    );

    if (result.error) return result;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/caang");
    return ok({ success: true });
  } catch (err) {
    console.error("[savePipelineSteps]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// MAGANG (INTERNSHIP) - SETTINGS
// ═══════════════════════════════════════════════════════

export interface InternshipPeriod {
  is_open: boolean;
  start_date: string | null;
  end_date: string | null;
}

const internshipPeriodSchema = z
  .object({
    is_open: z.boolean(),
    start_date: z.string().datetime().nullable(),
    end_date: z.string().datetime().nullable(),
  })
  .refine(
    (d) => {
      if (d.is_open && (!d.start_date || !d.end_date)) {
        return false;
      }
      return true;
    },
    {
      message: "Tanggal mulai dan selesai wajib diisi saat pendaftaran dibuka.",
    },
  );

/**
 * Ambil periode pendaftaran Magang — Caang (atau publik).
 */
export async function getPublicInternshipPeriod(): Promise<
  ActionResult<InternshipPeriod>
> {
  try {
    return await getSetting<InternshipPeriod>("internship_period", {
      is_open: false,
      start_date: null,
      end_date: null,
    });
  } catch (err) {
    console.error("[getPublicInternshipPeriod]", err);
    return ok({ is_open: false, start_date: null, end_date: null });
  }
}

/** Update periode pendaftaran Magang — khusus admin OR / pengurus */
export async function updateInternshipPeriod(
  input: InternshipPeriod,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = internshipPeriodSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const result = await upsertSetting(
      "internship_period",
      parsed.data,
      "Periode pengaturan formulir pendaftaran Magang Caang",
      auth.userId,
    );

    if (result.error) return result;

    revalidatePath("/dashboard/caang/magang");
    revalidatePath("/dashboard/or/magang/setup");
    return ok({ success: true });
  } catch (err) {
    console.error("[updateInternshipPeriod]", err);
    return fail("Terjadi kesalahan.");
  }
}
