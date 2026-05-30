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
      .from("profiles")
      .select(`
        id,
        email,
        nim,
        role,
        is_onboarded,
        registrations (
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
          study_programs (
            id,
            name,
            degree,
            majors (
              id,
              name
            )
          )
        )
      `)
      .eq("role", "caang")
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

// Delete a caang (Auth user deletion, cascading to profile and registrations)
export async function deleteCaang(profileId: string) {
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

    // Delete auth user (this cascades to profiles and registrations)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profileId);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return { success: false, error: "Gagal menghapus pengguna." };
    }

    revalidatePath("/manajemen-caang");
    return { success: true, message: "Data Caang berhasil dihapus." };
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
    nim: string;
    email: string;
    phoneNumber: string;
    studyProgramId: string;
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
    // 1. Update profiles table (NIM, email)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        nim: data.nim,
        email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: "Gagal memperbarui NIM atau Email." };
    }

    // 2. Update auth user email if changed
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profileId,
      { email: data.email }
    );
    if (authError) {
      console.error("Error updating auth email:", authError);
      // We don't fail the whole transaction as user is updated in profiles
    }

    // 3. Update registrations table
    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .update({
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        study_program_id: data.studyProgramId,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);

    if (regError) {
      console.error("Error updating registration:", regError);
      return { success: false, error: "Gagal memperbarui biodata Caang." };
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
