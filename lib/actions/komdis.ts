"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { recordAuditLog } from "@/lib/audit";
import { decryptQRToken } from "@/lib/utils/crypto";
import {
  CreateKomdisActivitySchema,
  UpdateKomdisActivitySchema,
  ReviewLeaveSchema,
  LogPointReductionSchema,
  LogLegacyDisciplinePointSchema,
  IssueSanctionSchema,
  ManualAttendanceSchema,
  UpdateMemberInternshipSchema,
  type CreateKomdisActivityInput,
  type UpdateKomdisActivityInput,
  type ReviewLeaveInput,
  type LogPointReductionInput,
  type LogLegacyDisciplinePointInput,
  type IssueSanctionInput,
  type ManualAttendanceInput,
  type UpdateMemberInternshipInput,
} from "@/lib/schemas/komdis";

// ============================================================================
// HELPER FUNCTION: AUTH & ROLE CHECKER
// ============================================================================

async function verifyKomdisRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Sesi tidak ditemukan.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["admin-komdis", "super-admin"].includes(profile.role)
  ) {
    throw new Error("Forbidden: Akses khusus Komisi Disiplin.");
  }

  return { supabase, user };
}

// ============================================================================
// SERVER ACTIONS IMPLEMENTATION
// ============================================================================

/**
 * 1. Membuat Kegiatan Baru Khusus Komdis (Target Audience Otomatis 'anggota')
 *    Notifikasi diproses otomatis oleh Database Trigger handle_new_activity_notification.
 */
export async function createKomdisActivity(
  rawInput: CreateKomdisActivityInput,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = CreateKomdisActivitySchema.parse(rawInput);

  const { data, error } = await supabase
    .from("activities")
    .insert({
      title: validated.title,
      description: validated.description || null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      location: validated.location,
      checkin_open_at: validated.checkin_open_at,
      checkin_close_at: validated.checkin_close_at,
      late_tolerance_minutes: validated.late_tolerance_minutes,
      target_audience: "anggota",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal membuat kegiatan: ${error.message}`);

  revalidatePath("/kegiatan");
  revalidatePath("/dashboard");
  return { success: true, data };
}

/**
 * 1b. Memperbarui Kegiatan Komdis (Target Audience Otomatis 'anggota')
 */
export async function updateKomdisActivity(
  rawInput: UpdateKomdisActivityInput,
) {
  const { supabase } = await verifyKomdisRole();
  const validated = UpdateKomdisActivitySchema.parse(rawInput);

  const { data, error } = await supabase
    .from("activities")
    .update({
      title: validated.title,
      description: validated.description || null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      location: validated.location,
      checkin_open_at: validated.checkin_open_at,
      checkin_close_at: validated.checkin_close_at,
      late_tolerance_minutes: validated.late_tolerance_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.activityId)
    .select()
    .single();

  if (error) throw new Error(`Gagal memperbarui kegiatan: ${error.message}`);

  revalidatePath("/kegiatan");
  revalidatePath(`/kegiatan/${validated.activityId}`);
  revalidatePath("/dashboard");
  return { success: true, data };
}

/**
 * 1c. Soft Delete Kegiatan Komdis
 */
export async function softDeleteKomdisActivity(activityId: string) {
  const { supabase } = await verifyKomdisRole();

  if (!activityId) {
    throw new Error("ID kegiatan tidak valid.");
  }

  const { error } = await supabase
    .from("activities")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", activityId);

  if (error)
    throw new Error(
      `Gagal memindahkan kegiatan ke tempat sampah: ${error.message}`,
    );

  revalidatePath("/kegiatan");
  revalidatePath("/kegiatan/sampah");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 1d. Restore Kegiatan Komdis
 */
export async function restoreKomdisActivity(activityId: string) {
  const { supabase } = await verifyKomdisRole();

  if (!activityId) {
    throw new Error("ID kegiatan tidak valid.");
  }

  const { error } = await supabase
    .from("activities")
    .update({ deleted_at: null })
    .eq("id", activityId);

  if (error) throw new Error(`Gagal memulihkan kegiatan: ${error.message}`);

  revalidatePath("/kegiatan");
  revalidatePath("/kegiatan/sampah");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 1e. Menghapus Kegiatan Komdis Permanen
 */
export async function deleteKomdisActivity(activityId: string) {
  const { supabase } = await verifyKomdisRole();

  if (!activityId) {
    throw new Error("ID kegiatan tidak valid.");
  }

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error)
    throw new Error(
      `Gagal menghapus kegiatan secara permanen: ${error.message}`,
    );

  revalidatePath("/kegiatan");
  revalidatePath("/kegiatan/sampah");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 2. Scan QR Code Presensi oleh Kamera HP Admin Komdis
 */
export async function scanAttendanceQRByAdmin(
  activityId: string,
  qrToken: string,
) {
  const { supabase, user } = await verifyKomdisRole();

  // Dekripsi & Validasi Token Dinamis AES-256
  let decrypted: {
    activity_id: string;
    profile_id: string;
    generated_at: number;
  } | null = null;
  try {
    decrypted = decryptQRToken(qrToken) as {
      activity_id: string;
      profile_id: string;
      generated_at: number;
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `QR Code tidak dapat didekripsi: ${msg}`,
    };
  }

  if (!decrypted || decrypted.activity_id !== activityId) {
    return {
      success: false,
      message: "QR Code tidak valid atau salah kegiatan.",
    };
  }

  // Cek masa berlaku token (Maksimal 5 menit / 300.000 ms)
  const isExpired = Date.now() - decrypted.generated_at > 300000;
  if (isExpired) {
    return {
      success: false,
      message: "QR Code kadaluarsa, silakan refresh QR Code peserta.",
    };
  }

  // Ambil data kegiatan untuk kalkulasi keterlambatan
  const { data: activity } = await supabase
    .from("activities")
    .select("start_date, end_date, late_tolerance_minutes")
    .eq("id", activityId)
    .single();

  if (!activity) {
    return { success: false, message: "Kegiatan tidak ditemukan." };
  }

  const now = new Date();
  const startDate = new Date(activity.start_date);
  const endDate = new Date(activity.end_date);
  const attendanceClose = new Date(endDate.getTime() + 2 * 60 * 60 * 1000);

  if (now > attendanceClose) {
    return {
      success: false,
      message:
        "Sesi presensi untuk kegiatan ini telah ditutup (batas 2 jam setelah kegiatan selesai).",
    };
  }

  const lateLimit = new Date(
    startDate.getTime() + (activity.late_tolerance_minutes || 15) * 60000,
  );

  // SOP: Hadir tepat waktu vs Telat (< 1 jam vs > 1 jam)
  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - startDate.getTime()) / 60000),
  );
  const isLate = now > lateLimit;
  const isLateOverOneHour = isLate && diffMinutes >= 60;
  const status = isLate ? "telat" : "hadir";

  const defaultNotes = isLateOverOneHour
    ? `Terlambat ${diffMinutes} menit (> 1 jam). Harap verifikasi sanksi fisik & poin di Presensi Manual.`
    : isLate
      ? `Terlambat ${diffMinutes} menit (< 1 jam - sanksi fisik langsung di tempat).`
      : null;

  // Ambil profil anggota untuk respons popup
  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("id, full_name, nim, avatar_url")
    .eq("id", decrypted.profile_id)
    .single();

  const { error } = await supabase.from("attendances").upsert(
    {
      activity_id: activityId,
      profile_id: decrypted.profile_id,
      check_in_at: now.toISOString(),
      status: status,
      approval_status: "approved",
      verified_by: user.id,
      verified_at: now.toISOString(),
      points_awarded: 0, // Default awal = 0 poin, jika > 1 jam akan diset via prompt modal popup
      notes: defaultNotes,
    },
    { onConflict: "activity_id,profile_id" },
  );

  if (error) {
    return {
      success: false,
      message: `Gagal mencatat presensi: ${error.message}`,
    };
  }

  revalidatePath(`/kegiatan/${activityId}`);
  return {
    success: true,
    status,
    isLateOverOneHour,
    diffMinutes,
    member: memberProfile
      ? {
          id: memberProfile.id,
          fullName: memberProfile.full_name,
          nim: memberProfile.nim,
          avatarUrl: memberProfile.avatar_url,
        }
      : {
          id: decrypted.profile_id,
          fullName: "Anggota",
          nim: "-",
          avatarUrl: null,
        },
    message: isLateOverOneHour
      ? `Presensi Berhasil: TELAT > 1 JAM (${diffMinutes}m)`
      : isLate
        ? `Presensi Berhasil: TELAT < 1 JAM (${diffMinutes}m) — Sanksi Fisik Langsung`
        : "Presensi Berhasil: HADIR TEPAT WAKTU",
  };
}

/**
 * 2b. Presensi Mandiri oleh Admin Komdis yang Bertugas
 */
export async function recordSelfAttendanceKomdis(activityId: string) {
  const { supabase, user } = await verifyKomdisRole();

  if (!activityId) {
    return { success: false, message: "ID kegiatan tidak valid." };
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("attendances").upsert(
    {
      activity_id: activityId,
      profile_id: user.id,
      check_in_at: now,
      status: "hadir",
      approval_status: "approved",
      verified_by: user.id,
      verified_at: now,
      points_awarded: 0,
    },
    { onConflict: "activity_id,profile_id" },
  );

  if (error) {
    return {
      success: false,
      message: `Gagal mencatat presensi mandiri: ${error.message}`,
    };
  }

  revalidatePath(`/kegiatan/${activityId}`);
  revalidatePath(`/kegiatan/${activityId}/absensi`);
  return {
    success: true,
    message:
      "Berhasil mencatat presensi mandiri sebagai Admin Komdis bertugas.",
  };
}

/**
 * 3. Review Pengajuan Izin / Sakit
 */
export async function reviewLeaveRequest(rawInput: ReviewLeaveInput) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = ReviewLeaveSchema.parse(rawInput);

  const { error } = await supabase
    .from("attendances")
    .update({
      approval_status: validated.approvalStatus,
      points_awarded: validated.pointsAwarded,
      rejection_reason: validated.rejectionReason || null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", validated.attendanceId);

  if (error) throw new Error(`Gagal memproses perizinan: ${error.message}`);

  revalidatePath("/perizinan");
  return { success: true };
}

/**
 * 4. Penandaan Alfa Massal (Batch Mark Alfa) Setelah Sesi Selesai
 */
export async function batchMarkAlfa(activityId: string) {
  const { supabase, user } = await verifyKomdisRole();

  // 1. Ambil data kegiatan untuk cek tanggal kegiatan
  const { data: activity } = await supabase
    .from("activities")
    .select("start_date, end_date")
    .eq("id", activityId)
    .single();

  const activityDateStr = activity?.start_date
    ? new Date(activity.start_date).toISOString().split("T")[0]
    : null;

  // 2. Ambil daftar anggota aktif yang belum ada record di attendances
  let members: Array<{ profile_id: string }> = [];

  const { data: unrecordedMembers, error: fetchError } = await supabase.rpc(
    "get_unrecorded_activity_members",
    { p_activity_id: activityId },
  );

  if (fetchError) {
    // Fallback jika RPC belum ter-deploy di Supabase Cloud: Query langsung via JS Client
    const { data: existingAttendances } = await supabase
      .from("attendances")
      .select("profile_id")
      .eq("activity_id", activityId);

    const existingProfileIds = new Set(
      (existingAttendances || []).map((a) => a.profile_id),
    );

    const { data: activeProfiles, error: profError } = await supabase
      .from("profiles")
      .select("id")
      .in("role", [
        "super-admin",
        "admin-komdis",
        "admin-or",
        "admin-kestari",
        "admin-divisi",
        "anggota",
      ]);

    if (profError) {
      throw new Error(`Gagal mengambil data peserta: ${profError.message}`);
    }

    members = (activeProfiles || [])
      .filter((p) => !existingProfileIds.has(p.id))
      .map((p) => ({ profile_id: p.id }));
  } else {
    members = (unrecordedMembers as Array<{ profile_id: string }>) || [];
  }

  if (members && members.length > 0) {
    const memberIds = members.map((m) => m.profile_id);

    // Fetch data profile untuk mengecek status magang
    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select(
        "id, is_on_internship, internship_start_date, internship_end_date",
      )
      .in("id", memberIds);

    const profileMap = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

    const payload = members.map((member) => {
      const p = profileMap.get(member.profile_id);
      let isInterning = false;

      if (p?.is_on_internship) {
        if (!p.internship_start_date && !p.internship_end_date) {
          isInterning = true;
        } else if (activityDateStr) {
          const startOk =
            !p.internship_start_date ||
            p.internship_start_date <= activityDateStr;
          const endOk =
            !p.internship_end_date || p.internship_end_date >= activityDateStr;
          isInterning = startOk && endOk;
        } else {
          isInterning = true;
        }
      }

      if (isInterning) {
        return {
          activity_id: activityId,
          profile_id: member.profile_id,
          status: "izin" as const,
          approval_status: "approved",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          points_awarded: 0, // Dispensasi magang = 0 poin
          notes: "Dispensasi Magang / PKL",
        };
      }

      return {
        activity_id: activityId,
        profile_id: member.profile_id,
        status: "alfa" as const,
        approval_status: "approved",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        points_awarded: 15, // SOP Alfa tanpa kabar = 15 poin
        notes: null,
      };
    });

    const { error: insertError } = await supabase
      .from("attendances")
      .insert(payload);
    if (insertError) {
      throw new Error(`Gagal memproses alfa massal: ${insertError.message}`);
    }
  }

  revalidatePath(`/kegiatan/${activityId}`);
  return { success: true, count: members?.length || 0 };
}

/**
 * 4b. Memperbarui Status Magang Anggota Aktif (Super Admin & Admin Komdis Only)
 */
export async function updateMemberInternshipStatus(
  rawInput: UpdateMemberInternshipInput,
) {
  const { supabase } = await verifyKomdisRole();
  const validated = UpdateMemberInternshipSchema.parse(rawInput);

  const { error } = await supabase
    .from("profiles")
    .update({
      is_on_internship: validated.isOnInternship,
      internship_start_date: validated.internshipStartDate || null,
      internship_end_date: validated.internshipEndDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.profileId);

  if (error) {
    throw new Error(
      `Gagal memperbarui status magang anggota: ${error.message}`,
    );
  }

  revalidatePath("/kedisiplinan");
  revalidatePath("/admin/users");
  revalidatePath("/presensi");
  return {
    success: true,
    message: "Berhasil memperbarui status magang anggota.",
  };
}

/**
 * 5. Input Pemutihan / Pengurangan Poin Sanksi Goro
 */
export async function logPointReduction(rawInput: LogPointReductionInput) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = LogPointReductionSchema.parse(rawInput);

  const { error } = await supabase.from("discipline_point_logs").insert({
    profile_id: validated.profileId,
    category: validated.category,
    points: validated.points, // bernilai negatif (-10 / -15)
    description: validated.description,
    created_by: user.id,
  });

  if (error) throw new Error(`Gagal mencatat pemutihan poin: ${error.message}`);

  await recordAuditLog({
    actorId: user.id,
    actionType: "ADJUST_DISCIPLINE_POINTS",
    targetUserId: validated.profileId,
    newValue: {
      category: validated.category,
      points: validated.points,
      description: validated.description,
    },
    details: `Penyesuaian poin kedisiplinan (${validated.points} poin): ${validated.description}`,
  });

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
  return { success: true };
}

/**
 * 5b. Input Poin Sanksi Awal / Transfer Periode Terdahulu (Periode 20 & Legacy)
 */
export async function logLegacyDisciplinePoints(
  rawInput: LogLegacyDisciplinePointInput,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = LogLegacyDisciplinePointSchema.parse(rawInput);

  const { error } = await supabase.from("discipline_point_logs").insert({
    profile_id: validated.profileId,
    category: validated.category,
    points: validated.points, // bernilai positif (+15, +30, dst)
    description: validated.description,
    created_by: user.id,
  });

  if (error)
    throw new Error(
      `Gagal mencatat poin sanksi awal / transfer: ${error.message}`,
    );

  await recordAuditLog({
    actorId: user.id,
    actionType: "ADJUST_DISCIPLINE_POINTS",
    targetUserId: validated.profileId,
    newValue: {
      category: validated.category,
      points: validated.points,
      description: validated.description,
    },
    details: `Input poin sanksi awal / transfer (+${validated.points} poin): ${validated.description}`,
  });

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
  revalidatePath("/kedisiplinan");
  return { success: true };
}

/**
 * 6. Penerbitan Surat Peringatan (SP1, SP2, SP3)
 */
export async function issueSanction(rawInput: IssueSanctionInput) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = IssueSanctionSchema.parse(rawInput);

  const { error } = await supabase.from("sanctions").insert({
    profile_id: validated.profileId,
    sp_level: validated.spLevel,
    points_at_issuance: validated.pointsAtIssuance,
    issued_by: user.id,
    notes: validated.notes || null,
    status: "active",
  });

  if (error) throw new Error(`Gagal menerbitkan SP: ${error.message}`);

  await recordAuditLog({
    actorId: user.id,
    actionType: "ISSUE_DISCIPLINARY_SANCTION",
    targetUserId: validated.profileId,
    newValue: {
      sp_level: validated.spLevel,
      points_at_issuance: validated.pointsAtIssuance,
      notes: validated.notes || null,
    },
    details: `Penerbitan sanksi kedisiplinan ${validated.spLevel} dengan akumulasi ${validated.pointsAtIssuance} poin`,
  });

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
  return { success: true };
}

/**
 * 7. Manual Attendance Override oleh Admin Komdis
 */
export async function recordManualAttendance(rawInput: ManualAttendanceInput) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = ManualAttendanceSchema.parse(rawInput);

  const now = new Date().toISOString();

  const { error } = await supabase.from("attendances").upsert(
    {
      activity_id: validated.activityId,
      profile_id: validated.profileId,
      status: validated.status,
      points_awarded: validated.pointsAwarded,
      notes: validated.notes || null,
      approval_status: "approved",
      verified_by: user.id,
      verified_at: now,
      check_in_at: now,
    },
    { onConflict: "activity_id,profile_id" },
  );

  if (error) {
    throw new Error(`Gagal mencatat presensi manual: ${error.message}`);
  }

  await recordAuditLog({
    actorId: user.id,
    actionType: "OVERRIDE_ATTENDANCE_STATUS",
    targetUserId: validated.profileId,
    newValue: {
      activity_id: validated.activityId,
      status: validated.status,
      points_awarded: validated.pointsAwarded,
      notes: validated.notes || null,
    },
    details: `Override status presensi kegiatan manual menjadi ${validated.status} (${validated.pointsAwarded} poin)`,
  });

  revalidatePath(`/kegiatan/${validated.activityId}`);
  return { success: true };
}

// ============================================================================
// REKAP PRESENSI KOMDIS (REKAP PER ANGGOTA & REKAP PER KEGIATAN)
// ============================================================================

function normalizePhotoUrl(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "Belum Diisi" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "-"
  ) {
    return null;
  }
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return null;
}

export interface KomdisMemberAttendanceItem {
  profileId: string;
  fullName: string;
  nim: string;
  photoUrl: string | null;
  role: string;
  studyProgramName: string;
  majorName: string;
  isOnInternship: boolean;
  internshipStartDate: string | null;
  internshipEndDate: string | null;
  attendances: Record<
    string,
    "hadir" | "telat" | "izin" | "sakit" | "alfa" | null
  >;
  totals: {
    hadir: number;
    telat: number;
    izin: number;
    sakit: number;
    alfa: number;
  };
  totalPoints: number;
}

export interface KomdisActivitySummaryItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  totalExpected: number;
  counts: {
    hadir: number;
    telat: number;
    izin: number;
    sakit: number;
    alfa: number;
    unrecorded: number;
  };
  attendanceRate: number;
}

/**
 * 8. Ambil Rekap Presensi Komdis Berdasarkan Anggota
 */
export async function getKomdisMemberAttendanceSummary(): Promise<{
  activities: { id: string; title: string; start_date: string }[];
  members: KomdisMemberAttendanceItem[];
}> {
  const { supabase } = await verifyKomdisRole();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Ambil semua kegiatan komdis (target_audience = 'anggota') yang belum di-soft-delete
  const { data: activities, error: actError } = await supabase
    .from("activities")
    .select("id, title, start_date")
    .eq("target_audience", "anggota")
    .is("deleted_at", null)
    .order("start_date", { ascending: true });

  if (actError) {
    throw new Error(`Gagal memuat kegiatan komdis: ${actError.message}`);
  }

  // 2. Ambil data anggota aktif (anggota dan role admin) dari profiles
  const { data: profilesData, error: profError } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      nim,
      role,
      avatar_url,
      is_onboarded,
      is_on_internship,
      internship_start_date,
      internship_end_date,
      deleted_at,
      registrations (
        full_name,
        photo_url,
        deleted_at,
        study_programs (
          name,
          degree,
          majors ( name )
        )
      )
    `,
    )
    .in("role", [
      "anggota",
      "admin-komdis",
      "admin-or",
      "admin-kestari",
      "admin-divisi",
      "super-admin",
    ])
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (profError) {
    throw new Error(`Gagal memuat data anggota: ${profError.message}`);
  }

  const activityIds = (activities ?? []).map((a) => a.id);

  let attendancesData: {
    activity_id: string;
    profile_id: string;
    status: string;
    points_awarded?: number | null;
  }[] = [];

  if (activityIds.length > 0) {
    const { data: attData, error: attError } = await supabaseAdmin
      .from("attendances")
      .select("activity_id, profile_id, status, points_awarded")
      .in("activity_id", activityIds);

    if (attError) {
      throw new Error(`Gagal memuat data presensi: ${attError.message}`);
    }
    attendancesData = attData ?? [];
  }

  // Build lookup map: attendanceMap[profileId][activityId] = { status, points }
  const attendanceMap: Record<
    string,
    Record<string, { status: string; points: number }>
  > = {};

  for (const att of attendancesData) {
    if (!att.profile_id || !att.activity_id) continue;
    if (!attendanceMap[att.profile_id]) {
      attendanceMap[att.profile_id] = {};
    }
    attendanceMap[att.profile_id][att.activity_id] = {
      status: att.status,
      points: att.points_awarded || 0,
    };
  }

  type RawProfile = {
    id: string;
    email: string;
    full_name: string | null;
    nim: string | null;
    role: string;
    avatar_url: string | null;
    is_onboarded: boolean;
    is_on_internship?: boolean;
    internship_start_date?: string | null;
    internship_end_date?: string | null;
    deleted_at: string | null;
    registrations:
      | {
          full_name: string | null;
          photo_url: string | null;
          deleted_at: string | null;
          study_programs: {
            name: string;
            degree: string;
            majors: { name: string } | { name: string }[] | null;
          } | null;
        }
      | {
          full_name: string | null;
          photo_url: string | null;
          deleted_at: string | null;
          study_programs: {
            name: string;
            degree: string;
            majors: { name: string } | { name: string }[] | null;
          } | null;
        }[]
      | null;
  };

  const members: KomdisMemberAttendanceItem[] = (
    (profilesData as unknown as RawProfile[]) ?? []
  ).map((prof) => {
    const reg = Array.isArray(prof.registrations)
      ? prof.registrations[0]
      : prof.registrations;
    const sp = reg?.study_programs
      ? Array.isArray(reg.study_programs)
        ? reg.study_programs[0]
        : reg.study_programs
      : null;
    const major = sp?.majors
      ? Array.isArray(sp.majors)
        ? sp.majors[0]
        : sp.majors
      : null;
    const profileId = prof.id;

    const userAttendances: Record<
      string,
      "hadir" | "telat" | "izin" | "sakit" | "alfa" | null
    > = {};
    const totals = { hadir: 0, telat: 0, izin: 0, sakit: 0, alfa: 0 };
    let totalPoints = 0;

    for (const activity of activities ?? []) {
      const attRecord = attendanceMap[profileId]?.[activity.id];
      const status = (attRecord?.status ?? null) as
        | "hadir"
        | "telat"
        | "izin"
        | "sakit"
        | "alfa"
        | null;

      userAttendances[activity.id] = status;

      if (status && status in totals) {
        totals[status as keyof typeof totals]++;
      }
      if (attRecord?.points) {
        totalPoints += attRecord.points;
      }
    }

    return {
      profileId,
      fullName: prof.full_name || reg?.full_name || "—",
      nim: prof.nim || "—",
      photoUrl: normalizePhotoUrl(prof.avatar_url || reg?.photo_url),
      role: prof.role || "anggota",
      studyProgramName: sp ? `${sp.degree} ${sp.name}` : "—",
      majorName: major?.name || "—",
      isOnInternship: prof.is_on_internship ?? false,
      internshipStartDate: prof.internship_start_date ?? null,
      internshipEndDate: prof.internship_end_date ?? null,
      attendances: userAttendances,
      totals,
      totalPoints,
    };
  });

  return {
    activities: activities ?? [],
    members,
  };
}

/**
 * 9. Ambil Rekap Presensi Komdis Berdasarkan Kegiatan
 */
export async function getKomdisActivityAttendanceSummary(): Promise<
  KomdisActivitySummaryItem[]
> {
  const { supabase } = await verifyKomdisRole();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Ambil kegiatan komdis aktif
  const { data: activities, error: actError } = await supabase
    .from("activities")
    .select("id, title, description, start_date, end_date, location")
    .eq("target_audience", "anggota")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (actError) {
    throw new Error(`Gagal memuat kegiatan komdis: ${actError.message}`);
  }

  if (!activities || activities.length === 0) {
    return [];
  }

  // 2. Ambil total anggota aktif (target audience)
  const { count: totalMembers } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", [
      "anggota",
      "admin-komdis",
      "admin-or",
      "admin-kestari",
      "admin-divisi",
      "super-admin",
    ]);

  const totalExpected = totalMembers || 0;
  const activityIds = activities.map((a) => a.id);

  // 3. Ambil semua data presensi untuk kegiatan-kegiatan di atas
  const { data: attData } = await supabaseAdmin
    .from("attendances")
    .select("activity_id, status")
    .in("activity_id", activityIds);

  const countsMap: Record<
    string,
    { hadir: number; telat: number; izin: number; sakit: number; alfa: number }
  > = {};

  for (const act of activities) {
    countsMap[act.id] = { hadir: 0, telat: 0, izin: 0, sakit: 0, alfa: 0 };
  }

  for (const att of attData ?? []) {
    if (!att.activity_id || !countsMap[att.activity_id]) continue;
    const st = att.status as keyof (typeof countsMap)[string];
    if (st && st in countsMap[att.activity_id]) {
      countsMap[att.activity_id][st]++;
    }
  }

  return activities.map((act) => {
    const counts = countsMap[act.id] || {
      hadir: 0,
      telat: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
    };
    const totalRecorded =
      counts.hadir + counts.telat + counts.izin + counts.sakit + counts.alfa;
    const unrecorded = Math.max(0, totalExpected - totalRecorded);
    const attendanceRate =
      totalExpected > 0
        ? Math.round(((counts.hadir + counts.telat) / totalExpected) * 100)
        : 0;

    return {
      id: act.id,
      title: act.title,
      description: act.description,
      startDate: act.start_date,
      endDate: act.end_date,
      location: act.location,
      totalExpected,
      counts: {
        ...counts,
        unrecorded,
      },
      attendanceRate,
    };
  });
}

/**
 * 10. Detail Presensi Per Kegiatan Spesifik (Khusus Admin Komdis & Super Admin)
 */
export interface ActivityAttendanceMemberDetail {
  profileId: string;
  fullName: string;
  nim: string;
  photoUrl: string | null;
  role: string;
  studyProgramName: string;
  majorName: string;
  status: "hadir" | "telat" | "izin" | "sakit" | "alfa" | "unrecorded";
  checkInAt: string | null;
  notes: string | null;
  proofUrl: string | null;
  pointsAwarded: number;
}

export interface ActivityAttendanceDetailResult {
  activity: {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string;
    location: string | null;
    targetAudience: string;
  };
  summary: {
    totalExpected: number;
    counts: {
      hadir: number;
      telat: number;
      izin: number;
      sakit: number;
      alfa: number;
      unrecorded: number;
    };
    attendanceRate: number;
    totalPenaltyPoints: number;
  };
  members: ActivityAttendanceMemberDetail[];
}

export async function getActivityAttendanceDetail(
  activityId: string,
): Promise<ActivityAttendanceDetailResult> {
  const { supabase } = await verifyKomdisRole();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Ambil detail kegiatan
  const { data: activity, error: actError } = await supabase
    .from("activities")
    .select(
      "id, title, description, start_date, end_date, location, target_audience",
    )
    .eq("id", activityId)
    .single();

  if (actError || !activity) {
    throw new Error("Kegiatan tidak ditemukan atau telah dihapus.");
  }

  // 2. Ambil seluruh anggota aktif (role admin & anggota) dari profiles
  const { data: profilesData, error: profError } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      nim,
      role,
      avatar_url,
      is_onboarded,
      deleted_at,
      registrations (
        full_name,
        photo_url,
        deleted_at,
        study_programs (
          name,
          degree,
          majors ( name )
        )
      )
    `,
    )
    .in("role", [
      "super-admin",
      "admin-komdis",
      "admin-or",
      "admin-kestari",
      "admin-divisi",
      "anggota",
    ])
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (profError) {
    throw new Error(`Gagal memuat daftar anggota: ${profError.message}`);
  }

  // 3. Ambil data presensi kegiatan ini
  const { data: attendancesData, error: attError } = await supabaseAdmin
    .from("attendances")
    .select("profile_id, status, check_in_at, notes, proof_url, points_awarded")
    .eq("activity_id", activityId);

  if (attError) {
    throw new Error(`Gagal memuat presensi kegiatan: ${attError.message}`);
  }

  // Build lookup map for attendances
  const attendanceMap: Record<
    string,
    {
      status: string;
      checkInAt: string | null;
      notes: string | null;
      proofUrl: string | null;
      pointsAwarded: number;
    }
  > = {};

  for (const att of attendancesData ?? []) {
    if (!att.profile_id) continue;
    attendanceMap[att.profile_id] = {
      status: att.status,
      checkInAt: att.check_in_at,
      notes: att.notes,
      proofUrl: att.proof_url,
      pointsAwarded: att.points_awarded || 0,
    };
  }

  type RawProfile = {
    id: string;
    email: string;
    full_name: string | null;
    nim: string | null;
    role: string;
    avatar_url: string | null;
    is_onboarded: boolean;
    deleted_at: string | null;
    registrations:
      | {
          full_name: string | null;
          photo_url: string | null;
          deleted_at: string | null;
          study_programs: {
            name: string;
            degree: string;
            majors: { name: string } | { name: string }[] | null;
          } | null;
        }
      | {
          full_name: string | null;
          photo_url: string | null;
          deleted_at: string | null;
          study_programs: {
            name: string;
            degree: string;
            majors: { name: string } | { name: string }[] | null;
          } | null;
        }[]
      | null;
  };

  const counts = {
    hadir: 0,
    telat: 0,
    izin: 0,
    sakit: 0,
    alfa: 0,
    unrecorded: 0,
  };
  let totalPenaltyPoints = 0;

  const members: ActivityAttendanceMemberDetail[] = (
    (profilesData as unknown as RawProfile[]) ?? []
  ).map((prof) => {
    const reg = Array.isArray(prof.registrations)
      ? prof.registrations[0]
      : prof.registrations;
    const sp = reg?.study_programs
      ? Array.isArray(reg.study_programs)
        ? reg.study_programs[0]
        : reg.study_programs
      : null;
    const major = sp?.majors
      ? Array.isArray(sp.majors)
        ? sp.majors[0]
        : sp.majors
      : null;
    const profileId = prof.id;

    const att = attendanceMap[profileId];
    const status = (att?.status ??
      "unrecorded") as ActivityAttendanceMemberDetail["status"];
    const pointsAwarded = att?.pointsAwarded || 0;

    if (status in counts) {
      counts[status as keyof typeof counts]++;
    }
    totalPenaltyPoints += pointsAwarded;

    return {
      profileId,
      fullName: prof.full_name || reg?.full_name || "—",
      nim: prof.nim || "—",
      photoUrl: normalizePhotoUrl(prof.avatar_url || reg?.photo_url),
      role: prof.role || "anggota",
      studyProgramName: sp ? `${sp.degree} ${sp.name}` : "—",
      majorName: major?.name || "—",
      status,
      checkInAt: att?.checkInAt || null,
      notes: att?.notes || null,
      proofUrl: att?.proofUrl || null,
      pointsAwarded,
    };
  });

  const totalExpected = members.length;
  const attendanceRate =
    totalExpected > 0
      ? Math.round(((counts.hadir + counts.telat) / totalExpected) * 100)
      : 0;

  return {
    activity: {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      startDate: activity.start_date,
      endDate: activity.end_date,
      location: activity.location,
      targetAudience: activity.target_audience,
    },
    summary: {
      totalExpected,
      counts,
      attendanceRate,
      totalPenaltyPoints,
    },
    members,
  };
}
