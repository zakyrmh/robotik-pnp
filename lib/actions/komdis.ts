"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decryptQRToken } from "@/lib/utils/crypto";
import {
  CreateKomdisActivitySchema,
  ReviewLeaveSchema,
  LogPointReductionSchema,
  IssueSanctionSchema,
  ManualAttendanceSchema,
  type CreateKomdisActivityInput,
  type ReviewLeaveInput,
  type LogPointReductionInput,
  type IssueSanctionInput,
  type ManualAttendanceInput,
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
  return { success: true, data };
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
    .select("start_date, late_tolerance_minutes")
    .eq("id", activityId)
    .single();

  if (!activity) {
    return { success: false, message: "Kegiatan tidak ditemukan." };
  }

  const now = new Date();
  const startDate = new Date(activity.start_date);
  const lateLimit = new Date(
    startDate.getTime() + (activity.late_tolerance_minutes || 15) * 60000,
  );

  // SOP: Hadir tepat waktu vs Telat (< 1 jam)
  const status = now > lateLimit ? "telat" : "hadir";

  const { error } = await supabase.from("attendances").upsert(
    {
      activity_id: activityId,
      profile_id: decrypted.profile_id,
      check_in_at: now.toISOString(),
      status: status,
      approval_status: "approved",
      verified_by: user.id,
      verified_at: now.toISOString(),
      points_awarded: 0, // Telat < 1 jam = 0 poin sanksi
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
    message: `Presensi Berhasil (${status.toUpperCase()})`,
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

  // Ambil daftar anggota aktif yang belum ada record di attendances
  const { data: unrecordedMembers, error: fetchError } = await supabase.rpc(
    "get_unrecorded_activity_members",
    { p_activity_id: activityId },
  );

  if (fetchError) {
    throw new Error(`Gagal mengambil data peserta: ${fetchError.message}`);
  }

  const members = unrecordedMembers as Array<{ profile_id: string }> | null;

  if (members && members.length > 0) {
    const payload = members.map((member) => ({
      activity_id: activityId,
      profile_id: member.profile_id,
      status: "alfa" as const,
      approval_status: "approved",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      points_awarded: 15, // SOP Alfa tanpa kabar = 15 poin
    }));

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

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
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

  revalidatePath(`/kegiatan/${validated.activityId}`);
  return { success: true };
}
