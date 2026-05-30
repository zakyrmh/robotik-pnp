"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Helper: Get Authenticated User and check admin/super-admin privileges
async function verifyAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super-admin" && profile.role !== "admin-or")) {
    return { authorized: false, error: "Akses ditolak. Anda tidak memiliki izin." };
  }

  return { authorized: true, user, role: profile.role };
}

// Get all caang list
export async function getCaangList() {
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select(`
        id,
        full_name,
        nickname,
        gender,
        pob,
        dob,
        phone_number,
        origin_address,
        domicile_address,
        high_school,
        current_class,
        entry_year,
        motivation,
        org_experience,
        achievements,
        photo_url,
        ktm_url,
        proof_follow_robotik,
        proof_follow_mrc,
        proof_sub_yt,
        payment_proof_url,
        payment_method,
        status,
        deleted_at,
        delete_reason,
        profiles!inner (
          id,
          email,
          nim,
          role,
          is_onboarded
        ),
        study_programs (
          id,
          name,
          degree,
          majors (
            id,
            name
          )
        )
      `)
      .eq("profiles.role", "caang")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching caang list:", error);
      return { success: false, error: "Gagal mengambil data Caang dari database." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error fetching caang list:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// Delete a caang (Soft delete by setting deleted_at and delete_reason)
export async function deleteCaang(profileId: string, reason: string) {
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single();

    if (profileError || !targetProfile) {
      return { success: false, error: "Data Caang tidak ditemukan." };
    }

    if (targetProfile.role !== "caang") {
      return { success: false, error: "Aksi ditolak. Hanya data Caang yang dapat dihapus." };
    }

    // Soft delete by updating registrations
    const { error: deleteError } = await supabaseAdmin
      .from("registrations")
      .update({
        deleted_at: new Date().toISOString(),
        delete_reason: reason,
      })
      .eq("profile_id", profileId);

    if (deleteError) {
      console.error("Error soft deleting registration:", deleteError);
      return { success: false, error: "Gagal menghapus data pendaftaran." };
    }

    revalidatePath("/manajemen-caang");
    return { success: true, message: "Data Caang berhasil dihapus (soft delete)." };
  } catch (err) {
    console.error("Unexpected error deleting caang:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// Update a caang data
export async function updateCaang(
  profileId: string,
  data: {
    fullName: string;
    nickname: string;
    gender: string;
    pob: string;
    dob: string;
    phoneNumber: string;
    originAddress: string;
    domicileAddress: string;
    highSchool: string;
    currentClass: string;
    entryYear: number;
    status: string;
  }
) {
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Update registrations table with all 12 registration fields
    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .update({
        full_name: data.fullName,
        nickname: data.nickname,
        gender: data.gender,
        pob: data.pob,
        dob: data.dob,
        phone_number: data.phoneNumber,
        origin_address: data.originAddress,
        domicile_address: data.domicileAddress,
        high_school: data.highSchool || null,
        current_class: data.currentClass || null,
        entry_year: data.entryYear,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);

    if (regError) {
      console.error("Error updating registration:", regError);
      return { success: false, error: "Gagal memperbarui data pendaftaran Caang." };
    }

    revalidatePath("/manajemen-caang");
    return { success: true, message: "Data Caang berhasil diperbarui." };
  } catch (err) {
    console.error("Unexpected error updating caang:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// Fetch all study programs and majors for selectors
export async function getAllStudyProgramsWithMajors() {
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("study_programs")
      .select(`
        id,
        name,
        degree,
        major:majors (
          id,
          name
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all study programs:", error);
      return { success: false, error: "Gagal mengambil program studi." };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error fetching study programs:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}
