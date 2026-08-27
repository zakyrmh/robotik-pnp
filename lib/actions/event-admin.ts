"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { eventCategorySchema, type EventCategoryInput } from "@/lib/schemas/event-registration";
import { sendETicketEmail } from "@/lib/services/resend";
import type {
  ActionResult,
  EventCategory,
  EventRegistration,
  EventTeamMember,
  PaymentStatus,
  RoleEvent,
} from "@/types/event-registration";

async function checkEventRole(allowedRoles: RoleEvent[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "Anda harus login terlebih dahulu.", user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_event")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super-admin";
  const hasEventRole = profile?.role_event && allowedRoles.includes(profile.role_event as RoleEvent);

  if (!isSuperAdmin && !hasEventRole) {
    return { authorized: false, error: "Anda tidak memiliki akses ke fitur panitia event ini.", user };
  }

  return { authorized: true, user, isSuperAdmin, roleEvent: profile?.role_event };
}

// --------------------------------------------------------
// Category Management
// --------------------------------------------------------

export async function getEventCategoriesAction(): Promise<ActionResult<EventCategory[]>> {
  const adminSupabase = createAdminClient();
  const { data, error } = await (adminSupabase
    .from("event_categories" as any)
    .select("*")
    .order("name", { ascending: true }) as unknown as Promise<{ data: EventCategory[] | null; error: unknown }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengambil daftar kategori lomba." };
  }

  return { success: true, data };
}

export async function saveEventCategoryAction(
  categoryId: string | null,
  payload: EventCategoryInput
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
    const { data, error } = await (adminSupabase
      .from("event_categories" as any)
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .select("*")
      .single() as unknown as Promise<{ data: EventCategory | null; error: unknown }>);

    if (error || !data) {
      return { success: false, error: "Gagal memperbarui kategori lomba." };
    }

    revalidatePath("/manajemen-event");
    return { success: true, data, message: "Kategori berhasil diperbarui." };
  } else {
    const { data, error } = await (adminSupabase
      .from("event_categories" as any)
      .insert(validated.data)
      .select("*")
      .single() as unknown as Promise<{ data: EventCategory | null; error: unknown }>);

    if (error || !data) {
      return { success: false, error: "Gagal menambahkan kategori lomba baru." };
    }

    revalidatePath("/manajemen-event");
    return { success: true, data, message: "Kategori baru berhasil ditambahkan." };
  }
}

// --------------------------------------------------------
// Registration Management & Manual Payment Verification
// --------------------------------------------------------

export async function getEventRegistrationsAction(
  categoryId?: string,
  searchQuery?: string
): Promise<ActionResult<EventRegistration[]>> {
  const check = await checkEventRole(["panitia-pendaftaran", "panitia-verifikasi", "panitia-pertandingan"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();
  let query = adminSupabase
    .from("event_registrations" as any)
    .select(`
      *,
      category:event_categories(*),
      members:event_team_members(*)
    `)
    .order("created_at", { ascending: false });

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim();
    query = query.or(`team_name.ilike.%${q}%,registration_code.ilike.%${q}%,team_email.ilike.%${q}%,institution.ilike.%${q}%`);
  }

  const { data, error } = await (query as unknown as Promise<{ data: EventRegistration[] | null; error: unknown }>);

  if (error || !data) {
    return { success: false, error: "Gagal mengambil daftar pendaftaran." };
  }

  return { success: true, data };
}

export async function updatePaymentStatusAction(
  registrationId: string,
  newStatus: PaymentStatus
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

  const { data: updatedReg, error } = await (adminSupabase
    .from("event_registrations" as any)
    .update(updatePayload)
    .eq("id", registrationId)
    .select(`
      *,
      category:event_categories(*)
    `)
    .single() as unknown as Promise<{ data: EventRegistration | null; error: unknown }>);

  if (error || !updatedReg) {
    return { success: false, error: "Gagal memperbarui status pembayaran." };
  }

  // If set to paid, send e-ticket email if not already sent
  if (newStatus === "paid") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendETicketEmail({
      toEmail: updatedReg.team_email,
      teamName: updatedReg.team_name,
      registrationCode: updatedReg.registration_code,
      categoryName: updatedReg.category?.name || "Minangkabau Robot Contest",
      accessToken: updatedReg.access_token,
      appBaseUrl: appUrl,
    });
  }

  revalidatePath("/manajemen-event");
  return { success: true, data: { success: true }, message: `Status pembayaran berhasil diubah ke ${newStatus}.` };
}

// --------------------------------------------------------
// Face Verification (Panitia Verifikasi)
// --------------------------------------------------------

export async function getMemberByQrTokenAction(
  memberQrToken: string
): Promise<ActionResult<EventTeamMember & { registration: EventRegistration }>> {
  const check = await checkEventRole(["panitia-verifikasi", "panitia-pendaftaran"]);
  if (!check.authorized) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await (adminSupabase
    .from("event_team_members" as any)
    .select(`
      *,
      registration:event_registrations(*, category:event_categories(*))
    `)
    .eq("member_qr_token", memberQrToken)
    .single() as unknown as Promise<{ data: (EventTeamMember & { registration: EventRegistration }) | null; error: unknown }>);

  if (error || !data) {
    return { success: false, error: "Data anggota tidak ditemukan untuk QR kokarde ini." };
  }

  return { success: true, data };
}

export async function submitFaceVerificationAction(
  memberId: string,
  result: "verified" | "mismatch",
  notes?: string
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-verifikasi"]);
  if (!check.authorized || !check.user) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  // Insert verification log
  const { error: logError } = await (adminSupabase
    .from("event_member_verifications" as any)
    .insert({
      member_id: memberId,
      verified_by: check.user.id,
      result,
      notes: notes || null,
    }) as unknown as Promise<{ error: unknown }>);

  if (logError) {
    return { success: false, error: "Gagal mencatat hasil verifikasi." };
  }

  // Update member verification status
  const { error: memberError } = await (adminSupabase
    .from("event_team_members" as any)
    .update({
      verification_status: result,
    })
    .eq("id", memberId) as unknown as Promise<{ error: unknown }>);

  if (memberError) {
    return { success: false, error: "Gagal memperbarui status verifikasi anggota." };
  }

  revalidatePath("/manajemen-event");
  return { success: true, data: { success: true }, message: `Verifikasi berhasil dicatat: ${result.toUpperCase()}` };
}

// --------------------------------------------------------
// Violation Management
// --------------------------------------------------------

export async function logEventViolationAction(
  registrationId: string,
  violationType: string,
  warningNumber: number,
  description?: string
): Promise<ActionResult<{ success: boolean }>> {
  const check = await checkEventRole(["panitia-pendaftaran", "panitia-verifikasi", "panitia-pertandingan"]);
  if (!check.authorized || !check.user) {
    return { success: false, error: check.error || "Akses ditolak." };
  }

  const adminSupabase = createAdminClient();

  const { error } = await (adminSupabase
    .from("event_violations" as any)
    .insert({
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
  return { success: true, data: { success: true }, message: "Pelanggaran berhasil dicatat." };
}

// --------------------------------------------------------
// Data Retention (Super Admin manual purge >3 months)
// --------------------------------------------------------

export async function purgeOldEventDataAction(): Promise<ActionResult<{ deletedCount: number }>> {
  const check = await checkEventRole([]);
  if (!check.authorized || !check.isSuperAdmin) {
    return { success: false, error: "Hanya Super Admin yang dapat melakukan pembersihan data lama." };
  }

  const adminSupabase = createAdminClient();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Fetch registrations older than 3 months
  const { data: oldRegs } = await (adminSupabase
    .from("event_registrations" as any)
    .select("id")
    .lt("created_at", threeMonthsAgo.toISOString()) as unknown as Promise<{ data: { id: string }[] | null }>);

  if (!oldRegs || oldRegs.length === 0) {
    return { success: true, data: { deletedCount: 0 }, message: "Tidak ada data pendaftaran lama (>3 bulan) yang perlu dihapus." };
  }

  const ids = oldRegs.map((r) => r.id);

  // Delete registrations (CASCADE will delete members, verifications, violations)
  const { error } = await (adminSupabase
    .from("event_registrations" as any)
    .delete()
    .in("id", ids) as unknown as Promise<{ error: unknown }>);

  if (error) {
    return { success: false, error: "Gagal menghapus data pendaftaran lama." };
  }

  revalidatePath("/manajemen-event");
  return { success: true, data: { deletedCount: ids.length }, message: `Berhasil menghapus ${ids.length} pendaftaran lama.` };
}
