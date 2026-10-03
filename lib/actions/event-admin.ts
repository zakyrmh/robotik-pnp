"use server";

import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { untypedFrom, untypedRpc } from "@/lib/supabase/untyped";
import {
  eventCategorySchema,
  eventPaymentBankSchema,
  eventSettingsSchema,
  reviewChangeRequestSchema,
  type EventCategoryInput,
  type EventSettingsInput,
  type ReviewChangeRequestInput,
} from "@/lib/schemas/event-registration";
import { sendETicketEmail } from "@/lib/services/resend";
import { recordAuditLog } from "@/lib/audit";
import type {
  ActionResult,
  BankAccount,
  EventCategory,
  EventRegistration,
  EventRegistrationMetrics,
  EventRegistrationPage,
  EventRegistrationSummary,
  EventSettings,
  EventTeamMember,
  PaymentStatus,
  RegistrationChangeRequest,
  RoleEvent,
} from "@/types/event-registration";
import { REGISTRATIONS_PAGE_SIZE } from "@/types/event-registration";

async function checkEventRole(allowedRoles: RoleEvent[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      error: "Anda harus login terlebih dahulu.",
      user: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_event")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super-admin";
  const hasEventRole =
    profile?.role_event &&
    allowedRoles.includes(profile.role_event as RoleEvent);

  if (!isSuperAdmin && !hasEventRole) {
    return {
      authorized: false,
      error: "Anda tidak memiliki akses ke fitur panitia event ini.",
      user,
    };
  }

  return {
    authorized: true,
    user,
    isSuperAdmin,
    roleEvent: profile?.role_event,
  };
}

// --------------------------------------------------------
// Global Event Settings (rentang Batch 1 / Batch 2 / Acara / Mode Pembayaran)
// --------------------------------------------------------

const EVENT_SETTINGS_ID = 1;

function toNullableIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/**
 * Pengaturan event global (singleton) — jarang berubah.
 *
 * Di-cache lintas request dengan `unstable_cache` (memakai admin client tanpa
 * cookie, jadi aman) untuk memangkas round-trip Supabase tiap kali dashboard
 * dibuka. Cache di-invalidasi via tag `event-settings` pada setiap mutasi
 * (`updateEventSettingsAction`).
 */
export const getEventSettingsAction = unstable_cache(
  async (): Promise<ActionResult<EventSettings>> => {
    const adminSupabase = createAdminClient();
    const { data, error } = await (untypedFrom(adminSupabase, "event_settings")
      .select("*")
      .eq("id", EVENT_SETTINGS_ID)
      .maybeSingle() as unknown as Promise<{
      data: EventSettings | null;
      error: unknown;
    }>);

    if (error || !data) {
      return { success: false, error: "Gagal mengambil pengaturan event." };
    }

    return { success: true, data };
  },
  ["event-settings"],
  { tags: ["event-settings"], revalidate: 300 },
);

export async function updateEventSettingsAction(
  payload: Partial<EventSettingsInput>,
): Promise<ActionResult<EventSettings>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const currentSettingsRes = await getEventSettingsAction();
  const currentSettings = currentSettingsRes.success
    ? currentSettingsRes.data
    : null;

  const mergedPayload: EventSettingsInput = {
    timeline_release_date:
      payload.timeline_release_date !== undefined
        ? payload.timeline_release_date
        : (currentSettings?.timeline_release_date ?? null),
    batch1_start:
      payload.batch1_start !== undefined
        ? payload.batch1_start
        : (currentSettings?.batch1_start ?? null),
    batch1_end:
      payload.batch1_end !== undefined
        ? payload.batch1_end
        : (currentSettings?.batch1_end ?? null),
    batch2_start:
      payload.batch2_start !== undefined
        ? payload.batch2_start
        : (currentSettings?.batch2_start ?? null),
    batch2_end:
      payload.batch2_end !== undefined
        ? payload.batch2_end
        : (currentSettings?.batch2_end ?? null),
    technical_meeting_start:
      payload.technical_meeting_start !== undefined
        ? payload.technical_meeting_start
        : (currentSettings?.technical_meeting_start ?? null),
    technical_meeting_end:
      payload.technical_meeting_end !== undefined
        ? payload.technical_meeting_end
        : (currentSettings?.technical_meeting_end ?? null),
    event_start:
      payload.event_start !== undefined
        ? payload.event_start
        : (currentSettings?.event_start ?? null),
    event_end:
      payload.event_end !== undefined
        ? payload.event_end
        : (currentSettings?.event_end ?? null),
    payment_mode:
      payload.payment_mode !== undefined
        ? payload.payment_mode
        : (currentSettings?.payment_mode ?? "midtrans"),
    bank_name:
      payload.bank_name !== undefined
        ? payload.bank_name
        : (currentSettings?.bank_name ?? undefined),
    bank_account_number:
      payload.bank_account_number !== undefined
        ? payload.bank_account_number
        : (currentSettings?.bank_account_number ?? undefined),
    bank_account_holder:
      payload.bank_account_holder !== undefined
        ? payload.bank_account_holder
        : (currentSettings?.bank_account_holder ?? undefined),
    bank_accounts:
      payload.bank_accounts !== undefined
        ? payload.bank_accounts
        : (currentSettings?.bank_accounts ?? undefined),
  };

  const validated = eventSettingsSchema.safeParse(mergedPayload);
  if (!validated.success) {
    const firstIssue = validated.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Input pengaturan event tidak valid.",
    };
  }

  const adminSupabase = createAdminClient();
  const updatePayload = {
    timeline_release_date: toNullableIso(validated.data.timeline_release_date),
    batch1_start: toNullableIso(validated.data.batch1_start),
    batch1_end: toNullableIso(validated.data.batch1_end),
    batch2_start: toNullableIso(validated.data.batch2_start),
    batch2_end: toNullableIso(validated.data.batch2_end),
    technical_meeting_start: toNullableIso(
      validated.data.technical_meeting_start,
    ),
    technical_meeting_end: toNullableIso(validated.data.technical_meeting_end),
    event_start: toNullableIso(validated.data.event_start),
    event_end: toNullableIso(validated.data.event_end),
    payment_mode: validated.data.payment_mode,
    bank_name: validated.data.bank_name || null,
    bank_account_number: validated.data.bank_account_number || null,
    bank_account_holder: validated.data.bank_account_holder || null,
    bank_accounts: validated.data.bank_accounts || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (untypedFrom(adminSupabase, "event_settings")
    .update(updatePayload)
    .eq("id", EVENT_SETTINGS_ID)
    .select("*")
    .single() as unknown as Promise<{
    data: EventSettings | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal menyimpan pengaturan event." };
  }

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath("/manajemen-event/timeline");
  revalidatePath("/manajemen-event/pembayaran");
  revalidatePath("/mrc");
  // Invalidasi cache settings agar `getEventSettingsAction` tidak menyajikan
  // data lama setelah pengaturan diubah.
  updateTag("event-settings");
  return {
    success: true,
    data,
    message: "Pengaturan berhasil disimpan.",
  };
}

// --------------------------------------------------------
// Category Management
// --------------------------------------------------------

/**
 * Daftar kategori lomba — jarang berubah.
 *
 * Di-cache lintas request dengan `unstable_cache` untuk memangkas round-trip
 * Supabase. Cache di-invalidasi via tag `event-categories` pada setiap mutasi
 * kategori (`saveEventCategoryAction`).
 */
export const getEventCategoriesAction = unstable_cache(
  async (): Promise<ActionResult<EventCategory[]>> => {
    const adminSupabase = createAdminClient();
    const { data, error } = await (untypedFrom(
      adminSupabase,
      "event_categories",
    )
      .select("*")
      .order("name", { ascending: true }) as unknown as Promise<{
      data: EventCategory[] | null;
      error: unknown;
    }>);

    if (error || !data) {
      return {
        success: false,
        error: "Gagal mengambil daftar kategori lomba.",
      };
    }

    return { success: true, data };
  },
  ["event-categories"],
  { tags: ["event-categories"], revalidate: 300 },
);

export async function saveEventCategoryAction(
  categoryId: string | null,
  payload: EventCategoryInput,
): Promise<ActionResult<EventCategory>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const validated = eventCategorySchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: "Input kategori lomba tidak valid." };
  }

  const adminSupabase = createAdminClient();

  if (categoryId) {
    const { data, error } = await (untypedFrom(
      adminSupabase,
      "event_categories",
    )
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .select("*")
      .single() as unknown as Promise<{
      data: EventCategory | null;
      error: unknown;
    }>);

    if (error || !data) {
      return { success: false, error: "Gagal memperbarui kategori lomba." };
    }

    revalidatePath("/manajemen-event");
    revalidatePath("/manajemen-event/kategori");
    // Invalidasi cache kategori agar daftar tidak menyajikan data lama.
    updateTag("event-categories");
    return { success: true, data, message: "Kategori berhasil diperbarui." };
  } else {
    const { data, error } = await (untypedFrom(
      adminSupabase,
      "event_categories",
    )
      .insert(validated.data)
      .select("*")
      .single() as unknown as Promise<{
      data: EventCategory | null;
      error: unknown;
    }>);

    if (error || !data) {
      return {
        success: false,
        error: "Gagal menambahkan kategori lomba baru.",
      };
    }

    revalidatePath("/manajemen-event");
    revalidatePath("/manajemen-event/kategori");
    // Invalidasi cache kategori agar daftar tidak menyajikan data lama.
    updateTag("event-categories");
    return {
      success: true,
      data,
      message: "Kategori baru berhasil ditambahkan.",
    };
  }
}

// --------------------------------------------------------
// Registration Management & Manual Payment Verification
// --------------------------------------------------------

/** Kolom eksplisit untuk daftar pendaftaran — menghindari `select *`.
 *  Membuang kolom berat yang tak dipakai tabel (mis. `midtrans_snap_token`,
 *  `midtrans_qr_url`, `rules_*`, `updated_at`) dan kolom anggota yang tak perlu
 *  (`member_qr_token`) untuk menekan bandwidth (Supabase Free Plan). */
const REGISTRATION_LIST_SELECT = `
  id,
  registration_code,
  team_name,
  institution,
  origin_city,
  team_email,
  team_whatsapp,
  payment_status,
  total_amount,
  manual_payment_proof_url,
  payment_bank_name,
  payment_bank_account_number,
  payment_bank_account_holder,
  access_token,
  created_at,
  category_id,
  category:event_categories(id, name),
  members:event_team_members(id, full_name, photo_url, identity_card_url, birth_date, role_in_team, verification_status)
`;

/**
 * Daftar pendaftaran tim (terpaginasi).
 *
 * - `range(from, to)` + `count: "exact"` → satu request mengembalikan baris
 *   halaman ini sekaligus total, sehingga payload per-load tetap kecil &
 *   konstan (bukan tumbuh seiring data).
 * - Kolom dibatasi lewat `REGISTRATION_LIST_SELECT`.
 *
 * Metrik ringkasan (total/lunas/pending) dihitung terpisah oleh
 * `getEventRegistrationsMetricsAction` agar tetap akurat lintas halaman.
 */
export async function getEventRegistrationsAction(options?: {
  categoryId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<EventRegistrationPage>> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const pageSize = Math.max(1, options?.pageSize ?? REGISTRATIONS_PAGE_SIZE);
  const page = Math.max(0, options?.page ?? 0);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const adminSupabase = createAdminClient();
  let query = untypedFrom(adminSupabase, "event_registrations")
    .select(REGISTRATION_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.categoryId && options.categoryId !== "all") {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.trim();
    query = query.or(
      `team_name.ilike.%${q}%,registration_code.ilike.%${q}%,team_email.ilike.%${q}%,institution.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await (query as unknown as Promise<{
    data: EventRegistration[] | null;
    error: unknown;
    count: number | null;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengambil daftar pendaftaran." };
  }

  const total = count ?? data.length;
  return {
    success: true,
    data: {
      rows: data,
      total,
      hasMore: to + 1 < total,
      page,
      pageSize,
    },
  };
}

/**
 * Metrik ringkasan pendaftaran (total, lunas, pending verifikasi, menunggu bayar,
 * total pemasukan) — dihitung di server atas SELURUH baris.
 *
 * Hanya menarik 2 kolom (`payment_status`, `total_amount`) tanpa join, lalu
 * diagregasi di server. Ini menjaga kartu metrik tetap akurat walau daftar
 * utama terpaginasi, sekaligus hemat (1 request, tanpa data berat).
 */
export async function getEventRegistrationsMetricsAction(): Promise<
  ActionResult<EventRegistrationMetrics>
> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  ).select("payment_status, total_amount") as unknown as Promise<{
    data: Pick<EventRegistration, "payment_status" | "total_amount">[] | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengambil metrik pendaftaran." };
  }

  let paidCount = 0;
  let pendingVerificationCount = 0;
  let pendingCount = 0;
  let totalRevenue = 0;

  for (const row of data) {
    if (row.payment_status === "paid") {
      paidCount += 1;
      totalRevenue += Number(row.total_amount) || 0;
    } else if (row.payment_status === "pending_verification") {
      pendingVerificationCount += 1;
    } else if (row.payment_status === "pending") {
      pendingCount += 1;
    }
  }

  return {
    success: true,
    data: {
      total: data.length,
      paidCount,
      pendingVerificationCount,
      pendingCount,
      totalRevenue,
    },
  };
}

/**
 * Ekspor SELURUH data pendaftaran sebagai CSV (Q1: ekspor penuh).
 *
 * Hanya kolom yang dibutuhkan berkas CSV (tanpa anggota/foto/token) sehingga
 * payload tetap kecil. CSV dibentuk di server; unduhan dilakukan di client
 * lewat Blob, menghindari beban di sisi klien untuk dataset besar.
 */
export async function getEventRegistrationsExportAction(): Promise<
  ActionResult<{ csv: string; filename: string; rowCount: number }>
> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .select(
      `
      registration_code,
      team_name,
      institution,
      origin_city,
      team_email,
      team_whatsapp,
      payment_status,
      total_amount,
      paid_at,
      created_at,
      payment_bank_name,
      payment_bank_account_number,
      category:event_categories(name)
    `,
    )
    .order("created_at", { ascending: false }) as unknown as Promise<{
    data:
      | (Pick<
          EventRegistration,
          | "registration_code"
          | "team_name"
          | "institution"
          | "origin_city"
          | "team_email"
          | "team_whatsapp"
          | "payment_status"
          | "total_amount"
          | "paid_at"
          | "created_at"
          | "payment_bank_name"
          | "payment_bank_account_number"
        > & { category: { name: string } | null })[]
      | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengekspor data pendaftaran." };
  }

  const headers = [
    "Kode Registrasi",
    "Nama Tim",
    "Kategori",
    "Instansi",
    "Kota Asal",
    "Email Tim",
    "WhatsApp",
    "Status Pembayaran",
    "Total Biaya (Rp)",
    "Rekening Tujuan",
    "Tanggal Bayar",
    "Tanggal Daftar",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const rows = data.map((r) =>
    [
      escape(r.registration_code),
      escape(r.team_name),
      escape(r.category?.name || ""),
      escape(r.institution),
      escape(r.origin_city || ""),
      escape(r.team_email),
      escape(r.team_whatsapp),
      escape(r.payment_status),
      escape(String(r.total_amount ?? "")),
      escape(
        r.payment_bank_name
          ? `${r.payment_bank_name} - ${r.payment_bank_account_number ?? ""}`.trim()
          : "",
      ),
      escape(r.paid_at ? new Date(r.paid_at).toLocaleString("id-ID") : ""),
      escape(
        r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "",
      ),
    ].join(","),
  );

  // BOM agar Excel membaca UTF-8 dengan benar (tetap sesuai perilaku lama).
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  return {
    success: true,
    data: {
      csv,
      filename: `mrc-pendaftaran-${new Date().toISOString().slice(0, 10)}.csv`,
      rowCount: data.length,
    },
  };
}

/**
 * Proyeksi ringan pendaftaran untuk dashboard `/manajemen-event`.
 *
 * Memilih hanya kolom yang dipakai ringkasan dashboard & grafik tren, sehingga
 * kolom berat (`midtrans_snap_token`, `manual_payment_proof_url`) dan seluruh
 * atribut anggota (foto/identitas) tidak ikut dikirim. Ini menekan bandwidth
 * request — penting untuk Supabase Free Plan. Data lengkap tetap diambil lewat
 * `getEventRegistrationsAction` pada halaman pendaftaran.
 *
 * Sengaja TIDAK di-cache: data pendaftaran berubah cepat dan halaman ini
 * memang untuk pemantauan real-time.
 */
export async function getEventRegistrationsSummaryAction(): Promise<
  ActionResult<EventRegistrationSummary[]>
> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .select(
      `
      id,
      registration_code,
      team_name,
      institution,
      origin_city,
      payment_status,
      total_amount,
      created_at,
      registration_batch,
      category_id,
      category:event_categories(id, name),
      members:event_team_members(id)
    `,
    )
    .order("created_at", { ascending: false }) as unknown as Promise<{
    data: EventRegistrationSummary[] | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengambil ringkasan pendaftaran." };
  }

  return { success: true, data };
}

export async function getEventRegistrationByIdAction(
  registrationId: string,
): Promise<ActionResult<EventRegistration>> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
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
    .eq("id", registrationId)
    .single() as unknown as Promise<{
    data: EventRegistration | null;
    error: unknown;
  }>);

  if (error || !data) {
    return {
      success: false,
      error: "Data pendaftaran tidak ditemukan.",
    };
  }

  return { success: true, data };
}

export async function updatePaymentStatusAction(
  registrationId: string,
  newStatus: PaymentStatus,
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  const updatePayload: Record<string, unknown> = {
    payment_status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "paid") {
    updatePayload.paid_at = new Date().toISOString();
  }

  const { data: updatedReg, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .update(updatePayload)
    .eq("id", registrationId)
    .select(
      `
      *,
      category:event_categories(*)
    `,
    )
    .single() as unknown as Promise<{
    data: EventRegistration | null;
    error: unknown;
  }>);

  if (error || !updatedReg) {
    return { success: false, error: "Gagal memperbarui status pembayaran." };
  }

  // If set to paid, send e-ticket email if not already sent
  if (newStatus === "paid") {
    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    await sendETicketEmail({
      toEmail: updatedReg.team_email,
      teamName: updatedReg.team_name,
      registrationCode: updatedReg.registration_code,
      categoryName: updatedReg.category?.name || "Minangkabau Robot Contest",
      accessToken: updatedReg.access_token,
      appBaseUrl: appUrl,
      paymentStatus: "paid",
      whatsappGroupUrl: updatedReg.category?.whatsapp_group_url,
    });
  }

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath(`/manajemen-event/pendaftaran/${registrationId}`);
  return {
    success: true,
    data: { success: true },
    message: `Status pembayaran berhasil diubah ke ${newStatus}.`,
  };
}

/**
 * Admin Verifikasi Pembayaran Manual (Approve / Reject)
 */
export async function verifyManualPaymentAction(
  registrationId: string,
  action: "approve" | "reject",
  rejectionReason?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  if (
    action === "reject" &&
    (!rejectionReason || rejectionReason.trim().length === 0)
  ) {
    return { success: false, error: "Alasan penolakan wajib diisi." };
  }

  const adminSupabase = createAdminClient();

  const newStatus: PaymentStatus = action === "approve" ? "paid" : "rejected";
  const updatePayload: Record<string, unknown> = {
    payment_status: newStatus,
    rejection_reason: action === "reject" ? rejectionReason?.trim() : null,
    updated_at: new Date().toISOString(),
  };

  if (action === "approve") {
    updatePayload.paid_at = new Date().toISOString();
  }

  const { data: updatedReg, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .update(updatePayload)
    .eq("id", registrationId)
    .select(
      `
      *,
      category:event_categories(*)
    `,
    )
    .single() as unknown as Promise<{
    data: EventRegistration | null;
    error: unknown;
  }>);

  if (error || !updatedReg) {
    return { success: false, error: "Gagal memproses verifikasi pembayaran." };
  }

  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  // Send email to team regarding payment approval or rejection
  await sendETicketEmail({
    toEmail: updatedReg.team_email,
    teamName: updatedReg.team_name,
    registrationCode: updatedReg.registration_code,
    categoryName: updatedReg.category?.name || "Minangkabau Robot Contest",
    accessToken: updatedReg.access_token,
    appBaseUrl: appUrl,
    paymentStatus: action === "approve" ? "paid" : "rejected",
    whatsappGroupUrl: updatedReg.category?.whatsapp_group_url,
    rejectionReason: action === "reject" ? rejectionReason : undefined,
  });

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath(`/manajemen-event/pendaftaran/${registrationId}`);
  return {
    success: true,
    data: { success: true },
    message:
      action === "approve"
        ? "Pembayaran berhasil diverifikasi (Disetujui)."
        : "Bukti pembayaran ditolak.",
  };
}

// --------------------------------------------------------
// Payment Bank Account Assignment (Panitia Pendaftaran / Super Admin)
// --------------------------------------------------------

/**
 * Tetapkan / kosongkan rekening bank tujuan transfer untuk sebuah pendaftaran.
 *
 * Hanya boleh dilakukan `panitia-pendaftaran` (dan super-admin lewat
 * `checkEventRole`). Nilai disimpan sebagai snapshot 3 kolom agar riwayat
 * rekening tetap utuh walau daftar rekening panitia berubah di kemudian hari.
 *
 * @param bank `null` untuk mengosongkan pilihan rekening.
 */
export async function setRegistrationPaymentBankAction(
  registrationId: string,
  bank: BankAccount | null,
): Promise<ActionResult<EventRegistration>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const validated = eventPaymentBankSchema.safeParse({
    registration_id: registrationId,
    bank,
  });
  if (!validated.success) {
    const firstIssue = validated.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Data rekening tidak valid.",
    };
  }

  const { bank: validBank } = validated.data;

  const adminSupabase = createAdminClient();
  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .update({
      payment_bank_name: validBank?.bank_name ?? null,
      payment_bank_account_number: validBank?.account_number ?? null,
      payment_bank_account_holder: validBank?.account_holder ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
    .select(
      `
      *,
      category:event_categories(*)
    `,
    )
    .single() as unknown as Promise<{
    data: EventRegistration | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Gagal menyimpan rekening tujuan." };
  }

  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath(`/manajemen-event/pendaftaran/${registrationId}`);
  return {
    success: true,
    data,
    message: validBank
      ? "Rekening tujuan berhasil disimpan."
      : "Rekening tujuan berhasil dikosongkan.",
  };
}

// --------------------------------------------------------
// Face Verification (Panitia Verifikasi)
// --------------------------------------------------------

export async function getMemberByQrTokenAction(
  memberQrToken: string,
): Promise<
  ActionResult<EventTeamMember & { registration: EventRegistration }>
> {
  const check = await checkEventRole([
    "panitia-verifikasi",
    "panitia-pendaftaran",
  ]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await (untypedFrom(
    adminSupabase,
    "event_team_members",
  )
    .select(
      `
      *,
      registration:event_registrations(*, category:event_categories(*))
    `,
    )
    .eq("member_qr_token", memberQrToken)
    .single() as unknown as Promise<{
    data: (EventTeamMember & { registration: EventRegistration }) | null;
    error: unknown;
  }>);

  if (error || !data) {
    return {
      success: false,
      error: "Data anggota tidak ditemukan untuk QR kokarde ini.",
    };
  }

  return { success: true, data };
}

export async function submitFaceVerificationAction(
  memberId: string,
  result: "verified" | "mismatch",
  notes?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-verifikasi"]);
  if (!check.authorized || !check.user) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  // Insert verification log
  const { error: logError } = await (untypedFrom(
    adminSupabase,
    "event_member_verifications",
  ).insert({
    member_id: memberId,
    verified_by: check.user.id,
    result,
    notes: notes || null,
  }) as unknown as Promise<{ error: unknown }>);

  if (logError) {
    return { success: false, error: "Gagal mencatat hasil verifikasi." };
  }

  // Update member verification status
  const { error: memberError } = await (untypedFrom(
    adminSupabase,
    "event_team_members",
  )
    .update({
      verification_status: result,
    })
    .eq("id", memberId) as unknown as Promise<{ error: unknown }>);

  if (memberError) {
    return {
      success: false,
      error: "Gagal memperbarui status verifikasi anggota.",
    };
  }

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath("/manajemen-event/verifikasi");
  return {
    success: true,
    data: { success: true },
    message: `Verifikasi berhasil dicatat: ${result.toUpperCase()}`,
  };
}

// --------------------------------------------------------
// Violation Management
// --------------------------------------------------------

export async function logEventViolationAction(
  registrationId: string,
  violationType: string,
  warningNumber: number,
  description?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!check.authorized || !check.user) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  const { error } = await (untypedFrom(
    adminSupabase,
    "event_violations",
  ).insert({
    registration_id: registrationId,
    violation_type: violationType,
    warning_number: warningNumber,
    description: description || null,
    issued_by: check.user.id,
    status: "active",
  }) as unknown as Promise<{ error: unknown }>);

  if (error) {
    return { success: false, error: "Gagal mencatat pelanggaran." };
  }

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath(`/manajemen-event/pendaftaran/${registrationId}`);
  return {
    success: true,
    data: { success: true },
    message: "Pelanggaran berhasil dicatat.",
  };
}

// --------------------------------------------------------
// Data Retention (Super Admin manual purge >3 months)
// --------------------------------------------------------

export async function purgeOldEventDataAction(): Promise<
  ActionResult<{ deletedCount: number }>
> {
  const check = await checkEventRole([]);
  if (!check.authorized || !check.isSuperAdmin) {
    return {
      success: false,
      error: "Hanya Super Admin yang dapat melakukan pembersihan data lama.",
    };
  }

  const adminSupabase = createAdminClient();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Fetch registrations older than 3 months
  const { data: oldRegs } = await (untypedFrom(
    adminSupabase,
    "event_registrations",
  )
    .select("id")
    .lt("created_at", threeMonthsAgo.toISOString()) as unknown as Promise<{
    data: { id: string }[] | null;
  }>);

  if (!oldRegs || oldRegs.length === 0) {
    return {
      success: true,
      data: { deletedCount: 0 },
      message: "Tidak ada data pendaftaran lama (>3 bulan) yang perlu dihapus.",
    };
  }

  const ids = oldRegs.map((r) => r.id);

  // Delete registrations (CASCADE will delete members, verifications, violations)
  const { error } = await (untypedFrom(adminSupabase, "event_registrations")
    .delete()
    .in("id", ids) as unknown as Promise<{ error: unknown }>);

  if (error) {
    return { success: false, error: "Gagal menghapus data pendaftaran lama." };
  }

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  return {
    success: true,
    data: { deletedCount: ids.length },
    message: `Berhasil menghapus ${ids.length} pendaftaran lama.`,
  };
}

// --------------------------------------------------------
// Permohonan Perbaikan Data Pendaftaran (review oleh Panitia Pendaftaran)
// --------------------------------------------------------

/**
 * Daftar permohonan perbaikan data, terbaru lebih dulu.
 * @param statusFilter `pending` | `approved` | `rejected`; kosong = semua.
 */
export async function getRegistrationChangeRequestsAction(
  statusFilter?: "pending" | "approved" | "rejected",
): Promise<ActionResult<RegistrationChangeRequest[]>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();
  let query = untypedFrom(adminSupabase, "event_registration_change_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = (await query) as unknown as {
    data: RegistrationChangeRequest[] | null;
    error: unknown;
  };

  if (error) {
    return { success: false, error: "Gagal mengambil permohonan perbaikan." };
  }

  return { success: true, data: data ?? [] };
}

/**
 * Tinjau (setujui/tolak) permohonan perbaikan data.
 *
 * - approve: terapkan perubahan secara ATOMIK via RPC
 *   `apply_registration_change_request` (update kolom tim + ganti anggota
 *   dalam satu transaksi).
 * - reject: tandai `rejected` beserta catatan.
 *
 * Wajib audit trail (AGENTS.md §5).
 */
export async function reviewRegistrationChangeRequestAction(
  rawInput: ReviewChangeRequestInput,
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-pendaftaran"]);
  if (!check.authorized || !check.user) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const validated = reviewChangeRequestSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const { request_id, action, note } = validated.data;

  if (action === "reject" && (!note || note.trim().length === 0)) {
    return { success: false, error: "Alasan penolakan wajib diisi." };
  }

  const adminSupabase = createAdminClient();

  // Ambil permohonan untuk validasi status & target audit.
  const { data: request } = (await untypedFrom(
    adminSupabase,
    "event_registration_change_requests",
  )
    .select("*")
    .eq("id", request_id)
    .maybeSingle()) as unknown as { data: RegistrationChangeRequest | null };

  if (!request) {
    return { success: false, error: "Permohonan tidak ditemukan." };
  }
  if (request.status !== "pending") {
    return {
      success: false,
      error: "Permohonan ini sudah ditinjau sebelumnya.",
    };
  }

  if (action === "approve") {
    try {
      await untypedRpc<string>(
        adminSupabase,
        "apply_registration_change_request",
        { p_request_id: request_id, p_reviewer_id: check.user.id },
      );
    } catch (err) {
      console.error("apply_registration_change_request error:", err);
      return {
        success: false,
        error: "Gagal menerapkan perubahan data pendaftaran.",
      };
    }
  } else {
    const { error } = await (untypedFrom(
      adminSupabase,
      "event_registration_change_requests",
    )
      .update({
        status: "rejected",
        review_note: note?.trim() ?? null,
        reviewed_by: check.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request_id) as unknown as Promise<{ error: unknown }>);

    if (error) {
      return { success: false, error: "Gagal menolak permohonan." };
    }
  }

  await recordAuditLog({
    actorId: check.user.id,
    actionType: "UPDATE_APPLICANT_STATUS",
    oldValue: { change_request_status: "pending" },
    newValue: {
      change_request_status: action === "approve" ? "approved" : "rejected",
      registration_id: request.registration_id,
    },
    details: `Permohonan perbaikan data ${action === "approve" ? "disetujui" : "ditolak"}`,
  });

  revalidatePath("/manajemen-event");
  revalidatePath("/manajemen-event/pendaftaran");
  revalidatePath(`/manajemen-event/pendaftaran/${request.registration_id}`);

  return {
    success: true,
    data: { success: true },
    message:
      action === "approve"
        ? "Perubahan data berhasil diterapkan."
        : "Permohonan perbaikan ditolak.",
  };
}
