"use server";

/**
 * Server Actions — Modul Kesekretariatan (Piket & Denda)
 *
 * Semua aksi yang dijalankan oleh admin kestari:
 * - Kelola periode piket
 * - Generate & kelola jadwal piket
 * - Verifikasi bukti piket
 * - Kelola denda dan verifikasi pembayaran
 * - Statistik dashboard
 *
 * Guard akses:
 * - requireModule('kesekretariatan') → kestari, admin, super_admin
 * - requireAuth()                    → semua anggota UKM (untuk fitur self-service)
 */

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  requireModule,
  isActionError,
  ok,
  fail,
} from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
import type {
  PiketPeriod,
  PiketAssignmentWithUser,
  PiketSubmissionWithUser,
  PiketFineWithUser,
  PiketDashboardStats,
  PiketSubmissionStatus,
  PiketFineStatus,
} from "@/lib/db/schema/kestari";

// ═══════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═══════════════════════════════════════════════════════

const createPiketPeriodSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter").max(100),
    startDate: z.string().date("Format tanggal tidak valid"),
    endDate: z.string().date("Format tanggal tidak valid"),
    fineAmount: z.number().positive("Nominal denda harus lebih dari 0"),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endDate"],
  });

const updateFineAmountSchema = z.object({
  periodId: z.string().uuid("ID periode tidak valid"),
  amount: z.number().positive("Nominal denda harus lebih dari 0"),
});

const updateAssignmentWeekSchema = z.object({
  assignmentId: z.string().uuid("ID assignment tidak valid"),
  week: z.number().int().min(1).max(5), // max 5, bukan 4
});

const submitPiketSchema = z
  .object({
    assignmentId: z.string().uuid("ID assignment tidak valid"),
    monthYear: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Format bulan tidak valid (YYYY-MM)"),
    piketDate: z.string().date("Format tanggal tidak valid"),
    photoBeforeUrl: z.string().url("URL foto sebelum tidak valid").optional(),
    photoAfterUrl: z.string().url("URL foto sesudah tidak valid").optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.photoBeforeUrl || d.photoAfterUrl, {
    message: "Minimal satu foto bukti piket harus diupload",
  });

const verifySubmissionSchema = z.object({
  submissionId: z.string().uuid("ID submission tidak valid"),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(500).optional(),
});

const generateFinesSchema = z.object({
  periodId: z.string().uuid("ID periode tidak valid"),
  monthYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format bulan tidak valid (YYYY-MM)"),
});

const verifyFinePaymentSchema = z.object({
  fineId: z.string().uuid("ID denda tidak valid"),
  status: z.enum(["paid", "waived"]),
});

// ═══════════════════════════════════════════════════════
// PERIODE PIKET
// ═══════════════════════════════════════════════════════

/** Ambil semua periode piket */
export async function getPiketPeriods(): Promise<ActionResult<PiketPeriod[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("piket_periods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as PiketPeriod[]);
  } catch (err) {
    console.error("[getPiketPeriods]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil periode aktif */
export async function getActivePeriod(): Promise<
  ActionResult<PiketPeriod | null>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("piket_periods")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) return fail(error.message);
    return ok(data as PiketPeriod | null);
  } catch (err) {
    console.error("[getActivePeriod]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Buat periode piket baru — khusus kestari */
export async function createPiketPeriod(
  input: z.infer<typeof createPiketPeriodSchema>,
): Promise<ActionResult<PiketPeriod>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = createPiketPeriodSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0].message);
    }

    const { name, startDate, endDate, fineAmount } = parsed.data;
    const supabase = await createClient();

    // Nonaktifkan periode lama
    await supabase
      .from("piket_periods")
      .update({ is_active: false })
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("piket_periods")
      .insert({
        name,
        start_date: startDate,
        end_date: endDate,
        fine_amount: fineAmount,
        is_active: true,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as PiketPeriod);
  } catch (err) {
    console.error("[createPiketPeriod]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update nominal denda periode — khusus kestari */
export async function updateFineAmount(
  input: z.infer<typeof updateFineAmountSchema>,
): Promise<ActionResult<PiketPeriod>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = updateFineAmountSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("piket_periods")
      .update({ fine_amount: parsed.data.amount })
      .eq("id", parsed.data.periodId)
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as PiketPeriod);
  } catch (err) {
    console.error("[updateFineAmount]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// GENERATE JADWAL PIKET
// ═══════════════════════════════════════════════════════

/**
 * Generate jadwal piket untuk semua anggota aktif — khusus kestari.
 * Distribusi merata ke 4 minggu secara acak.
 * Operasi delete + insert dijalankan via RPC agar atomik.
 */
export async function generatePiketSchedule(
  periodId: string,
): Promise<ActionResult<{ total: number }>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(periodId);
    if (!parsed.success) return fail("ID periode tidak valid.");

    const supabase = await createClient();

    // Ambil semua anggota UKM yang sudah dilantik (role: anggota)
    const { data: userRoles, error: urErr } = await supabase
      .from("user_roles")
      .select("user_id, roles!inner(name)")
      .eq("roles.name", "anggota");

    if (urErr) return fail("Gagal mengambil data anggota.");
    if (!userRoles || userRoles.length === 0) {
      return fail("Tidak ada anggota aktif.");
    }

    const userIds = [...new Set(userRoles.map((ur) => ur.user_id))];

    // Distribusi merata ke 4 minggu
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const assignments = shuffled.map((userId, i) => ({
      period_id: periodId,
      user_id: userId,
      assigned_week: (i % 4) + 1,
    }));

    // Atomik: hapus lama + insert baru via RPC
    const { error: rpcErr } = await supabase.rpc("regenerate_piket_schedule", {
      p_period_id: periodId,
      p_assignments: assignments,
    });

    if (rpcErr) return fail("Gagal membuat jadwal piket.");
    return ok({ total: assignments.length });
  } catch (err) {
    console.error("[generatePiketSchedule]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// JADWAL PIKET — CRUD
// ═══════════════════════════════════════════════════════

/** Ambil semua assignment piket untuk periode tertentu */
export async function getPiketAssignments(
  periodId: string,
): Promise<ActionResult<PiketAssignmentWithUser[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(periodId);
    if (!parsed.success) return fail("ID periode tidak valid.");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("piket_assignments")
      .select(
        `
        *,
        users!inner(email),
        profiles!piket_assignments_user_id_fkey(full_name, nickname, avatar_url)
      `,
      )
      .eq("period_id", periodId)
      .order("assigned_week");

    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const usr = Array.isArray(d.users) ? d.users[0] : d.users;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: usr?.email ?? "",
        profiles: undefined,
        users: undefined,
      } as PiketAssignmentWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getPiketAssignments]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ubah minggu piket seorang anggota — khusus kestari */
export async function updateAssignmentWeek(
  input: z.infer<typeof updateAssignmentWeekSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = updateAssignmentWeekSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("piket_assignments")
      .update({ assigned_week: parsed.data.week })
      .eq("id", parsed.data.assignmentId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[updateAssignmentWeek]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// SUBMISSION BUKTI PIKET
// ═══════════════════════════════════════════════════════

/**
 * Submit bukti piket — untuk semua anggota UKM.
 * Anggota hanya bisa submit untuk assignment miliknya sendiri.
 */
export async function submitPiketProof(
  input: z.infer<typeof submitPiketSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = submitPiketSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Pastikan assignment milik user sendiri
    const { data: assignment, error: aErr } = await supabase
      .from("piket_assignments")
      .select("user_id")
      .eq("id", parsed.data.assignmentId)
      .single();

    if (aErr || !assignment) return fail("Assignment tidak ditemukan.");
    if (assignment.user_id !== auth.userId) return fail("Akses ditolak.");

    // Cek apakah sudah ada submission pending/approved untuk bulan ini
    const { data: existing } = await supabase
      .from("piket_submissions")
      .select("id, status")
      .eq("assignment_id", parsed.data.assignmentId)
      .eq("month_year", parsed.data.monthYear)
      .maybeSingle();

    if (existing?.status === "approved") {
      return fail("Bukti piket bulan ini sudah diverifikasi.");
    }
    if (existing?.status === "pending") {
      return fail("Bukti piket bulan ini sedang menunggu verifikasi.");
    }

    const { error } = await supabase.from("piket_submissions").upsert(
      {
        assignment_id: parsed.data.assignmentId,
        user_id: auth.userId, // ← pakai user_id bukan submitted_by
        month_year: parsed.data.monthYear,
        piket_date: parsed.data.piketDate, // ← wajib diisi
        photo_before_url: parsed.data.photoBeforeUrl ?? null,
        photo_after_url: parsed.data.photoAfterUrl ?? null,
        notes: parsed.data.notes ?? null,
        status: "pending" as PiketSubmissionStatus,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "assignment_id,month_year" },
    );

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[submitPiketProof]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil submission piket untuk periode tertentu — khusus kestari */
export async function getPiketSubmissions(
  periodId: string,
  filters?: { status?: PiketSubmissionStatus; monthYear?: string },
): Promise<ActionResult<PiketSubmissionWithUser[]>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(periodId);
    if (!parsed.success) return fail("ID periode tidak valid.");

    const supabase = await createClient();
    let query = supabase
      .from("piket_submissions")
      .select(
        `
        *,
        piket_assignments!inner(period_id),
        profiles!piket_submissions_submitted_by_fkey(full_name, nickname, avatar_url)
      `,
      )
      .eq("piket_assignments.period_id", periodId)
      .order("submitted_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.monthYear) query = query.eq("month_year", filters.monthYear);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
        piket_assignments: undefined,
      } as unknown as PiketSubmissionWithUser; // pakai unknown dulu karena type manual di schema
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getPiketSubmissions]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Verifikasi submission bukti piket — khusus kestari */
export async function verifyPiketSubmission(
  input: z.infer<typeof verifySubmissionSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = verifySubmissionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("piket_submissions")
      .update({
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        verified_by: auth.userId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.submissionId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[verifyPiketSubmission]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// DENDA / SANKSI
// ═══════════════════════════════════════════════════════

/** Generate denda otomatis untuk anggota yang tidak piket — khusus kestari */
export async function generateFinesForMonth(
  input: z.infer<typeof generateFinesSchema>,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = generateFinesSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const { periodId, monthYear } = parsed.data;
    const supabase = await createClient();

    const { data: period } = await supabase
      .from("piket_periods")
      .select("fine_amount")
      .eq("id", periodId)
      .single();

    if (!period) return fail("Periode tidak ditemukan.");

    const { data: assignments } = await supabase
      .from("piket_assignments")
      .select("id, user_id")
      .eq("period_id", periodId);

    if (!assignments?.length) return fail("Tidak ada jadwal piket.");

    const { data: approvedSubmissions } = await supabase
      .from("piket_submissions")
      .select("assignment_id")
      .eq("month_year", monthYear)
      .eq("status", "approved");

    const { data: existingFines } = await supabase
      .from("piket_fines")
      .select("assignment_id")
      .eq("month_year", monthYear);

    const approvedSet = new Set(
      (approvedSubmissions ?? []).map((s) => s.assignment_id),
    );
    const existingSet = new Set(
      (existingFines ?? []).map((f) => f.assignment_id),
    );

    const newFines = assignments
      .filter((a) => !approvedSet.has(a.id) && !existingSet.has(a.id))
      .map((a) => ({
        assignment_id: a.id,
        user_id: a.user_id,
        month_year: monthYear,
        amount: period.fine_amount,
        reason: "Tidak melaksanakan piket",
        status: "unpaid" as const,
        created_by: auth.userId,
      }));

    if (newFines.length > 0) {
      const { error } = await supabase.from("piket_fines").insert(newFines);
      if (error) return fail(error.message);
    }

    return ok({
      created: newFines.length,
      skipped: assignments.length - newFines.length,
    });
  } catch (err) {
    console.error("[generateFinesForMonth]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil daftar denda — khusus kestari */
export async function getPiketFines(
  periodId: string,
  filters?: { status?: PiketFineStatus; monthYear?: string },
): Promise<ActionResult<PiketFineWithUser[]>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(periodId);
    if (!parsed.success) return fail("ID periode tidak valid.");

    const supabase = await createClient();
    let query = supabase
      .from("piket_fines")
      .select(
        `
        *,
        piket_assignments!inner(period_id),
        profiles!piket_fines_user_id_fkey(full_name, nickname, avatar_url)
      `,
      )
      .eq("piket_assignments.period_id", periodId)
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.monthYear) query = query.eq("month_year", filters.monthYear);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
        piket_assignments: undefined,
      } as PiketFineWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getPiketFines]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Verifikasi pembayaran denda — khusus kestari */
export async function verifyFinePayment(
  input: z.infer<typeof verifyFinePaymentSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const parsed = verifyFinePaymentSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("piket_fines")
      .update({
        status: parsed.data.status,
        verified_by: auth.userId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.fineId);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[verifyFinePayment]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD STATISTIK
// ═══════════════════════════════════════════════════════

/** Ambil statistik dashboard kestari */
export async function getPiketDashboardStats(): Promise<
  ActionResult<PiketDashboardStats>
> {
  try {
    const auth = await requireModule("kesekretariatan");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const { data: period } = await supabase
      .from("piket_periods")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!period) {
      return ok({
        totalMembers: 0,
        totalAssigned: 0,
        submittedThisMonth: 0,
        pendingVerification: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0,
        unpaidFines: 0,
        totalFineAmount: 0,
      });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [
      { count: totalAssigned },
      { count: totalMembers },
      { data: monthSubs },
      { data: unpaidData },
    ] = await Promise.all([
      supabase
        .from("piket_assignments")
        .select("*", { count: "exact", head: true })
        .eq("period_id", period.id),
      supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("roles.name", "anggota"),
      supabase
        .from("piket_submissions")
        .select("status, piket_assignments!inner(period_id)")
        .eq("piket_assignments.period_id", period.id)
        .eq("month_year", currentMonth),
      supabase
        .from("piket_fines")
        .select("amount, piket_assignments!inner(period_id)")
        .eq("piket_assignments.period_id", period.id)
        .eq("status", "unpaid"),
    ]);

    const subs = monthSubs ?? [];

    return ok({
      totalMembers: totalMembers ?? 0,
      totalAssigned: totalAssigned ?? 0,
      submittedThisMonth: subs.length,
      pendingVerification: subs.filter((s) => s.status === "pending").length,
      approvedThisMonth: subs.filter((s) => s.status === "approved").length,
      rejectedThisMonth: subs.filter((s) => s.status === "rejected").length,
      unpaidFines: (unpaidData ?? []).length,
      totalFineAmount: (unpaidData ?? []).reduce((sum, f) => sum + f.amount, 0),
    });
  } catch (err) {
    console.error("[getPiketDashboardStats]", err);
    return fail("Terjadi kesalahan.");
  }
}
