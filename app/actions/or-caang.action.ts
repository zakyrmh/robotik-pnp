"use server";

/**
 * Server Actions — Portal Caang (Self-service)
 *
 * Semua aksi yang bisa dilakukan caang sendiri:
 * - Lihat & isi data pendaftaran
 * - Lihat kegiatan & absensi
 * - Pilih divisi magang tetap
 */

import { randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isActionError, ok, fail } from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
import type {
  OrRegistrationWithUser,
  OrEvent,
  OrAttendanceToken,
  OrEventAttendance,
} from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ═══════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═══════════════════════════════════════════════════════

const saveBiodataSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(100),
  nickname: z.string().max(50).optional(),
  gender: z.enum(["L", "P"]).optional(),
  birthPlace: z.string().max(100).optional(),
  birthDate: z.string().date().optional(),
  phone: z.string().max(20).optional(),
  addressDomicile: z.string().max(500).optional(),
  nim: z.string().max(20).optional(),
  studyProgramId: z.string().uuid().optional(),
  yearEnrolled: z.number().int().min(2000).max(2100).optional(),
  motivation: z.string().max(2000).optional(),
  orgExperience: z.string().max(2000).optional(),
  achievements: z.string().max(2000).optional(),
});

const saveDocumentsSchema = z.object({
  photoUrl: z.string().url().optional(),
  ktmUrl: z.string().url().optional(),
  igFollowUrl: z.string().url().optional(),
  igMrcUrl: z.string().url().optional(),
  ytSubUrl: z.string().url().optional(),
});

const savePaymentSchema = z.object({
  paymentUrl: z.string().url("URL bukti bayar tidak valid"),
  paymentMethod: z.enum(["transfer", "offline"]),
  paymentAmount: z.number().int().positive().optional(),
});

const chooseFixedInternshipSchema = z.object({
  divisionId: z.string().uuid("ID divisi tidak valid"),
});

// ═══════════════════════════════════════════════════════
// DATA PENDAFTARAN
// ═══════════════════════════════════════════════════════

/** Ambil data pendaftaran milik caang sendiri */
export async function getMyRegistration(): Promise<
  ActionResult<OrRegistrationWithUser | null>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("or_registrations")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) return fail(error.message);

    let reg = data;

    // Auto-create draft registration if it doesn't exist
    if (!reg) {
      const { data: newReg, error: insertError } = await supabase
        .from("or_registrations")
        .insert({
          user_id: auth.userId,
          status: "draft",
          current_step: "biodata",
        })
        .select("*")
        .single();

      if (insertError) return fail(insertError.message);
      reg = newReg;
    }

    if (!reg) return ok(null); // Fallback in case of an unexpected issue

    const [{ data: profile }, { data: usr }, { data: edu }] = await Promise.all(
      [
        supabase
          .from("profiles")
          .select(
            "full_name, nickname, avatar_url, gender, birth_place, birth_date, phone, address_domicile",
          )
          .eq("user_id", auth.userId)
          .single(),
        supabase.from("users").select("email").eq("id", auth.userId).single(),
        supabase
          .from("education_details")
          .select("nim, study_program_id, study_programs(name, majors(name))")
          .eq("user_id", auth.userId)
          .maybeSingle(),
      ],
    );

    const sp = Array.isArray(edu?.study_programs)
      ? edu.study_programs[0]
      : edu?.study_programs;
    const mj = Array.isArray(sp?.majors) ? sp.majors[0] : sp?.majors;

    return ok({
      ...reg,
      full_name: profile?.full_name ?? "",
      nickname: profile?.nickname ?? null,
      avatar_url: profile?.avatar_url ?? null,
      email: usr?.email ?? "",
      gender: profile?.gender ?? null,
      birth_place: profile?.birth_place ?? null,
      birth_date: profile?.birth_date ?? null,
      phone: profile?.phone ?? null,
      address_domicile: profile?.address_domicile ?? null,
      nim: edu?.nim ?? null,
      study_program_name: sp?.name ?? null,
      major_name: mj?.name ?? null,
    } as OrRegistrationWithUser);
  } catch (err) {
    console.error("[getMyRegistration]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Simpan biodata — step 1 */
export async function saveBiodata(
  input: z.infer<typeof saveBiodataSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = saveBiodataSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Update profil
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        nickname: parsed.data.nickname ?? null,
        gender: parsed.data.gender ?? null,
        birth_place: parsed.data.birthPlace ?? null,
        birth_date: parsed.data.birthDate ?? null,
        phone: parsed.data.phone ?? null,
        address_domicile: parsed.data.addressDomicile ?? null,
      })
      .eq("user_id", auth.userId);

    if (profileErr) return fail(profileErr.message);

    // Upsert education_details
    if (parsed.data.nim && parsed.data.studyProgramId) {
      const { error: eduErr } = await supabase.from("education_details").upsert(
        {
          user_id: auth.userId,
          nim: parsed.data.nim,
          study_program_id: parsed.data.studyProgramId,
        },
        { onConflict: "user_id" },
      );

      if (eduErr) return fail(eduErr.message);
    }

    // Update registration
    const { error: regErr } = await supabase
      .from("or_registrations")
      .update({
        motivation: parsed.data.motivation ?? null,
        org_experience: parsed.data.orgExperience ?? null,
        achievements: parsed.data.achievements ?? null,
        year_enrolled: parsed.data.yearEnrolled ?? null,
        current_step: "documents",
      })
      .eq("user_id", auth.userId);

    if (regErr) return fail(regErr.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[saveBiodata]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Simpan dokumen — step 2 */
export async function saveDocuments(
  input: z.infer<typeof saveDocumentsSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = saveDocumentsSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("or_registrations")
      .update({
        photo_url: parsed.data.photoUrl ?? null,
        ktm_url: parsed.data.ktmUrl ?? null,
        ig_follow_url: parsed.data.igFollowUrl ?? null,
        ig_mrc_url: parsed.data.igMrcUrl ?? null,
        yt_sub_url: parsed.data.ytSubUrl ?? null,
        current_step: "payment",
      })
      .eq("user_id", auth.userId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[saveDocuments]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Simpan pembayaran — step 3 */
export async function savePayment(
  input: z.infer<typeof savePaymentSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = savePaymentSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("or_registrations")
      .update({
        payment_url: parsed.data.paymentUrl,
        payment_method: parsed.data.paymentMethod,
        payment_amount: parsed.data.paymentAmount ?? null,
        current_step: "completed",
      })
      .eq("user_id", auth.userId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[savePayment]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Submit pendaftaran untuk diverifikasi */
export async function submitRegistration(): Promise<
  ActionResult<{ success: boolean }>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    // Pastikan step sudah completed sebelum submit
    const { data: reg } = await supabase
      .from("or_registrations")
      .select("current_step")
      .eq("user_id", auth.userId)
      .single();

    if (reg?.current_step !== "completed") {
      return fail("Lengkapi semua data sebelum submit.");
    }

    const { error } = await supabase
      .from("or_registrations")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        revision_fields: null,
        verification_notes: null,
      })
      .eq("user_id", auth.userId)
      .in("status", ["draft", "revision"]);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[submitRegistration]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// KEGIATAN & ABSENSI
// ═══════════════════════════════════════════════════════

/** Ambil kegiatan yang dipublikasikan */
export async function caangGetEvents(): Promise<ActionResult<OrEvent[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .in("status", ["published", "completed"])
      .order("event_date", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as OrEvent[]);
  } catch (err) {
    console.error("[caangGetEvents]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil rekap absensi milik caang sendiri */
export async function caangGetMyAttendance(): Promise<
  ActionResult<(OrEventAttendance & { or_events: OrEvent })[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_event_attendances")
      .select("*, or_events(*)")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);
    return ok(
      data as unknown as (OrEventAttendance & { or_events: OrEvent })[],
    );
  } catch (err) {
    console.error("[caangGetMyAttendance]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Generate QR token absensi — untuk caang.
 * Token aman secara kriptografis, berlaku 5 menit.
 *
 * Aturan bisnis:
 * - Hanya bisa generate 2 jam sebelum event dimulai sampai event selesai
 * - Jika token masih valid → kembalikan tanpa generate baru
 * - 1 token unik per caang per kegiatan per generate
 */
export async function caangGenerateAttendanceToken(
  eventId: string,
): Promise<ActionResult<OrAttendanceToken>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(eventId);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();

    // Cek apakah sudah hadir
    const { data: attended } = await supabase
      .from("or_event_attendances")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (attended) return fail("Anda sudah tercatat hadir di kegiatan ini.");

    // Cek event masih published/active + ambil detail waktu
    const { data: event } = await supabase
      .from("or_events")
      .select("status, event_date, start_time, end_time")
      .eq("id", eventId)
      .single();

    if (!event) return fail("Kegiatan tidak ditemukan.");
    if (event.status !== "published") {
      return fail("Kegiatan tidak sedang aktif.");
    }

    // ── Validasi window waktu: H-2jam sampai event selesai ──
    const now = new Date();
    const eventStart = new Date(`${event.event_date}T${event.start_time}`);
    const windowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000); // 2 jam sebelum

    if (now < windowStart) {
      const diffMs = windowStart.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return fail(
        `Belum bisa generate QR. Tunggu ${diffHours > 0 ? `${diffHours} jam ` : ""}${diffMins} menit lagi (H-2 jam sebelum acara).`,
      );
    }

    // Cek jika event sudah selesai (jika end_time ada)
    if (event.end_time) {
      const eventEnd = new Date(`${event.event_date}T${event.end_time}`);
      if (now > eventEnd) {
        return fail("Kegiatan sudah selesai. Tidak bisa generate QR.");
      }
    }

    // ── Cleanup: hapus token expired milik user ini untuk event ini ──
    const nowISO = now.toISOString();
    await supabase
      .from("or_attendance_tokens")
      .delete()
      .eq("user_id", auth.userId)
      .eq("event_id", eventId)
      .lt("expires_at", nowISO);

    // ── Cek token yang masih valid (belum expired) ──
    const { data: existing } = await supabase
      .from("or_attendance_tokens")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("event_id", eventId)
      .gt("expires_at", nowISO)
      .maybeSingle();

    if (existing) return ok(existing as OrAttendanceToken);

    // ── Generate token baru yang aman ──
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: newToken, error } = await supabase
      .from("or_attendance_tokens")
      .insert({
        user_id: auth.userId,
        event_id: eventId,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(newToken as OrAttendanceToken);
  } catch (err) {
    console.error("[caangGenerateAttendanceToken]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// MAGANG TETAP — SELF SERVICE
// ═══════════════════════════════════════════════════════

/**
 * Caang pilih divisi magang tetap — first-come first-served.
 * Cek kuota sebelum insert.
 */
export async function chooseFixedInternship(
  input: z.infer<typeof chooseFixedInternshipSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = chooseFixedInternshipSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Cek apakah caang sudah pilih sebelumnya
    const { data: existing } = await supabase
      .from("or_fixed_internships")
      .select("id, chosen_division_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (existing?.chosen_division_id) {
      return fail(
        "Anda sudah memilih divisi magang. Hubungi admin OR untuk mengubahnya.",
      );
    }

    // Cek kuota via RPC
    const { data: quota, error: quotaErr } = await supabase
      .rpc("check_fixed_internship_quota", {
        p_division_id: parsed.data.divisionId,
      })
      .single();

    if (quotaErr) return fail(quotaErr.message);
    const quotaData = quota as { available: number } | null;
    if (!quotaData || quotaData.available <= 0) {
      return fail("Kuota divisi ini sudah penuh. Pilih divisi lain.");
    }

    // Insert atau update pilihan
    const { error } = await supabase.from("or_fixed_internships").upsert(
      {
        user_id: auth.userId,
        chosen_division_id: parsed.data.divisionId,
        chosen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[chooseFixedInternship]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil status magang tetap milik caang sendiri */
export async function getMyFixedInternship(): Promise<ActionResult<unknown>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_fixed_internships")
      .select(
        `
        *,
        chosen:divisions!or_fixed_internships_chosen_division_id_fkey(name, slug),
        assigned:divisions!or_fixed_internships_assigned_division_id_fkey(name, slug)
      `,
      )
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) return fail(error.message);
    return ok(data);
  } catch (err) {
    console.error("[getMyFixedInternship]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil kelompok caang sendiri */
export async function getMyGroups(): Promise<ActionResult<unknown[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_group_members")
      .select(
        `
        or_groups (
          id, name, type, description,
          or_rolling_internships (
            session_date, start_time, location,
            divisions(name, slug)
          )
        )
      `,
      )
      .eq("user_id", auth.userId);

    if (error) return fail(error.message);
    return ok((data ?? []).map((d) => d.or_groups));
  } catch (err) {
    console.error("[getMyGroups]", err);
    return fail("Terjadi kesalahan.");
  }
}
