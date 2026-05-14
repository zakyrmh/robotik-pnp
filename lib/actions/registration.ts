"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================
export interface PersonalData {
  fullName: string;
  nickname: string;
  gender: "L" | "P";
  pob: string; // Place of Birth
  dob: string; // Date of Birth (YYYY-MM-DD)
  phoneNumber: string;
  originAddress: string;
  domicileAddress: string;
}

export interface AcademicData {
  highSchool: string;
  studyProgramId: string;
  currentClass: string;
  orgExperience?: string;
  achievements?: string;
}

export interface CommitmentData {
  motivation: string;
  igRobotikUrl?: string | null;
  igMrcUrl?: string | null;
  ytUrl?: string | null;
}

export interface FinalData {
  pasFotoUrl: string;
  ktmUrl?: string | null;
  paymentProofUrl: string;
  paymentMethod: string;
}

// ============================================================
// Helper: Extract Entry Year from NIM
// ============================================================
function extractEntryYearFromNim(nim: string): number {
  if (!nim || nim.length < 2) {
    throw new Error("NIM tidak valid untuk ekstraksi tahun masuk");
  }
  const year = parseInt(nim.substring(0, 2), 10);
  return 2000 + year;
}

// ============================================================
// Helper: Get Authenticated User
// ============================================================
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user, error };
}

// ============================================================
// Step 2: Save Personal Data
// Upsert — INSERT jika belum ada record, UPDATE jika sudah ada.
// study_program_id kini nullable, sehingga INSERT bisa dilakukan
// sebelum user memilih prodi di step 3.
// ============================================================
export async function savePersonalData(data: PersonalData) {
  const { supabase, user, error: userError } = await getAuthUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    // Cek apakah record sudah ada
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    const personalFields = {
      full_name: data.fullName,
      nickname: data.nickname,
      gender: data.gender,
      pob: data.pob,
      dob: data.dob,
      phone_number: data.phoneNumber,
      origin_address: data.originAddress,
      domicile_address: data.domicileAddress,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("registrations")
        .update({ ...personalFields, updated_at: new Date().toISOString() })
        .eq("profile_id", user.id);

      if (updateError) {
        console.error("Error updating personal data:", updateError);
        return { success: false, error: "Gagal menyimpan data pribadi." };
      }
    } else {
      // Ambil entry_year dari NIM di profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("nim")
        .eq("id", user.id)
        .single();

      const entryYear = profile?.nim
        ? extractEntryYearFromNim(profile.nim)
        : new Date().getFullYear();

      const { error: insertError } = await supabase
        .from("registrations")
        .insert({
          profile_id: user.id,
          ...personalFields,
          entry_year: entryYear,
          // Kolom step berikutnya dibiarkan NULL — diisi secara bertahap
          // step 3: high_school, current_class
          // step 4: motivation
          // step 5: photo_url, payment_proof_url, payment_method
        });

      if (insertError) {
        console.error("Error inserting personal data:", insertError);
        return { success: false, error: "Gagal menyimpan data pribadi." };
      }
    }

    return { success: true, message: "Data pribadi berhasil disimpan." };
  } catch (err) {
    console.error("Unexpected error saving personal data:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// ============================================================
// Step 3: Save Academic Data
// Selalu UPDATE — record pasti sudah ada setelah step 2.
// ============================================================
export async function saveAcademicData(data: AcademicData) {
  const { supabase, user, error: userError } = await getAuthUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    // Update entry_year berdasarkan NIM yang sudah tersimpan
    const { data: profile } = await supabase
      .from("profiles")
      .select("nim")
      .eq("id", user.id)
      .single();

    if (!profile?.nim) {
      return {
        success: false,
        error: "NIM tidak ditemukan. Silakan validasi NIM terlebih dahulu.",
      };
    }

    const entryYear = extractEntryYearFromNim(profile.nim);

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        high_school: data.highSchool,
        study_program_id: data.studyProgramId,
        current_class: data.currentClass,
        org_experience: data.orgExperience || null,
        achievements: data.achievements || null,
        entry_year: entryYear,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error("Error updating academic data:", updateError);
      return { success: false, error: "Gagal menyimpan data akademik." };
    }

    return { success: true, message: "Data akademik berhasil disimpan." };
  } catch (err) {
    console.error("Unexpected error saving academic data:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// ============================================================
// Step 4: Save Commitment Data
// Simpan motivasi + URL bukti media sosial ke registrations.
// URL sudah diupload ke storage dari client sebelum memanggil ini.
// ============================================================
export async function saveCommitmentData(data: CommitmentData) {
  const { supabase, user, error: userError } = await getAuthUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        motivation: data.motivation,
        proof_follow_robotik: data.igRobotikUrl ?? null,
        proof_follow_mrc: data.igMrcUrl ?? null,
        proof_sub_yt: data.ytUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error("Error updating commitment data:", updateError);
      return { success: false, error: "Gagal menyimpan data komitmen." };
    }

    return { success: true, message: "Data komitmen berhasil disimpan." };
  } catch (err) {
    console.error("Unexpected error saving commitment data:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}

// ============================================================
// Step 5: Save Final Data (Berkas & Pembayaran)
// Simpan URL pas foto, KTM, bukti bayar + metode pembayaran.
// URL sudah diupload ke storage dari client sebelum memanggil ini.
// ============================================================
export async function saveFinalData(data: FinalData) {
  const { supabase, user, error: userError } = await getAuthUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        photo_url: data.pasFotoUrl,
        ktm_url: data.ktmUrl ?? null,
        payment_proof_url: data.paymentProofUrl,
        payment_method: data.paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error("Error updating final data:", updateError);
      return { success: false, error: "Gagal menyimpan data berkas." };
    }

    // Update juga photo_url di profiles jika ada (opsional, jika profile punya kolom avatar)
    // Saat ini profiles tidak punya kolom photo_url, jadi cukup di registrations.

    return { success: true, message: "Data berkas berhasil disimpan." };
  } catch (err) {
    console.error("Unexpected error saving final data:", err);
    return { success: false, error: "Terjadi kesalahan tidak terduga." };
  }
}
