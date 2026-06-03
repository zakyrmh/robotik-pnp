"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types for Resume Feature
// ============================================================
export interface OnboardingInitialPersonal {
  fullName: string;
  nickname: string;
  gender: "L" | "P" | "";
  pob: string;
  dob: string;
  phoneNumber: string;
  originAddress: string;
  domicileAddress: string;
}

export interface OnboardingInitialAcademic {
  majorId: string;
  highSchool: string;
  studyProgramId: string;
  currentClass: string;
  orgExperience: string;
  achievements: string;
}

export interface OnboardingInitialCommitment {
  motivation: string;
  igRobotikUrl: string | null;
  igMrcUrl: string | null;
  ytUrl: string | null;
}

export interface OnboardingProgress {
  nim: string | null;
  startStep: number;
  personal: OnboardingInitialPersonal | null;
  academic: OnboardingInitialAcademic | null;
  commitment: OnboardingInitialCommitment | null;
  paymentMethod: string | null;
}

// ============================================================
// Check Legacy Member by NIM
// ============================================================
export async function checkLegacyMember(nim: string) {
  if (!nim || nim.trim().length < 8) {
    return {
      success: false,
      error: "NIM tidak valid. Minimal 8 karakter.",
    };
  }

  const supabase = await createClient();

  // Cek apakah user sudah login
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    // Panggil RPC function untuk cek legacy member
    const { data, error } = await supabase.rpc("check_legacy_member", {
      input_nim: nim.trim(),
    });

    if (error) {
      console.error("Error checking legacy member:", error);
      return {
        success: false,
        error: "Gagal memeriksa NIM. Silakan coba lagi.",
      };
    }

    // Data adalah array dengan 1 elemen
    const result = data?.[0];

    if (!result) {
      return {
        success: false,
        error: "Terjadi kesalahan saat memeriksa NIM.",
      };
    }

    // Jika NIM ditemukan sebagai anggota lama
    if (result.is_legacy) {
      // Promote user dari caang ke anggota
      const { data: promoteData, error: promoteError } = await supabase.rpc(
        "promote_legacy_member_to_anggota",
        {
          user_id: user.id,
          input_nim: nim.trim(),
        },
      );

      if (promoteError || !promoteData) {
        console.error("Error promoting legacy member:", promoteError);
        return {
          success: false,
          error: "Gagal memperbarui status keanggotaan.",
        };
      }

      return {
        success: true,
        isLegacy: true,
        memberData: result.member_data,
        message:
          "NIM tervalidasi! Anda adalah anggota lama. Mengarahkan ke dashboard...",
      };
    }

    // NIM tidak ditemukan di legacy_members — caang baru
    // Cek status pendaftaran OR dan rentang waktu pembukaan pendaftaran
    const { data: orSettings, error: settingsError } = await supabase
      .from("or_settings")
      .select("status_pendaftaran, tanggal_mulai, tanggal_selesai")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (settingsError || !orSettings) {
      console.error("Error fetching OR settings:", settingsError);
      return {
        success: false,
        error: "Gagal memproses pendaftaran. Pengaturan pendaftaran tidak ditemukan.",
      };
    }

    const now = new Date();
    const isStatusOpen = orSettings.status_pendaftaran === true;
    const startDate = orSettings.tanggal_mulai ? new Date(orSettings.tanggal_mulai) : null;
    const endDate = orSettings.tanggal_selesai ? new Date(orSettings.tanggal_selesai) : null;

    const isWithinRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);

    if (!isStatusOpen || !isWithinRange) {
      return {
        success: false,
        isClosed: true,
        error: "Pendaftaran calon anggota baru saat ini ditutup. Silakan tunggu pembukaan pendaftaran selanjutnya.",
      };
    }

    // Simpan NIM ke profiles agar step Academic bisa mengekstrak entry_year
    const { error: nimUpdateError } = await supabase
      .from("profiles")
      .update({ nim: nim.trim() })
      .eq("id", user.id);

    if (nimUpdateError) {
      console.error("Error saving NIM to profile:", nimUpdateError);
      return {
        success: false,
        error: "Gagal menyimpan NIM. Silakan coba lagi.",
      };
    }

    return {
      success: true,
      isLegacy: false,
      message:
        "NIM tidak terdaftar sebagai anggota lama. Silakan lanjutkan pengisian biodata.",
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan tidak terduga. Silakan coba lagi.",
    };
  }
}

// ============================================================
// Get Onboarding Progress
// Dipanggil dari Server Component saat user membuka /onboarding.
// Menentukan step awal dan data yang sudah tersimpan agar user
// bisa melanjutkan dari tempat terakhir mereka.
// ============================================================
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  const empty: OnboardingProgress = {
    nim: null,
    startStep: 1,
    personal: null,
    academic: null,
    commitment: null,
    paymentMethod: null,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  // Query profiles + registrations secara paralel
  const [{ data: profile }, { data: reg }] = await Promise.all([
    supabase.from("profiles").select("nim").eq("id", user.id).single(),
    supabase
      .from("registrations")
      .select(
        "full_name, nickname, gender, pob, dob, phone_number, origin_address, domicile_address, high_school, study_program_id, current_class, org_experience, achievements, motivation, proof_follow_robotik, proof_follow_mrc, proof_sub_yt, payment_method"
      )
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const nim = profile?.nim ?? null;

  // ── Step 1: NIM belum ada ──────────────────────────────────
  if (!nim) return { ...empty, startStep: 1 };

  // ── Step 2: Cek kelengkapan data pribadi ──────────────────
  const p = reg;
  const personalComplete =
    p?.full_name && p?.nickname && p?.gender && p?.pob &&
    p?.dob && p?.phone_number && p?.origin_address && p?.domicile_address;

  const personal: OnboardingInitialPersonal | null = p
    ? {
        fullName: p.full_name ?? "",
        nickname: p.nickname ?? "",
        gender: (p.gender as "L" | "P") ?? "",
        pob: p.pob ?? "",
        dob: p.dob ?? "",
        phoneNumber: p.phone_number ?? "",
        originAddress: p.origin_address ?? "",
        domicileAddress: p.domicile_address ?? "",
      }
    : null;

  if (!personalComplete) {
    return { nim, startStep: 2, personal, academic: null, commitment: null, paymentMethod: p?.payment_method ?? null };
  }

  // ── Step 3: Cek kelengkapan data akademik ─────────────────
  const academicComplete =
    p?.high_school && p?.study_program_id && p?.current_class;

  let academic: OnboardingInitialAcademic | null = null;
  if (p?.study_program_id) {
    // Ambil major_id dari study_programs agar selector Jurusan bisa di-pre-fill
    const { data: sp } = await supabase
      .from("study_programs")
      .select("major_id")
      .eq("id", p.study_program_id)
      .single();

    academic = {
      majorId: sp?.major_id ?? "",
      highSchool: p.high_school ?? "",
      studyProgramId: p.study_program_id,
      currentClass: p.current_class ?? "",
      orgExperience: p.org_experience ?? "",
      achievements: p.achievements ?? "",
    };
  }

  if (!academicComplete) {
    return { nim, startStep: 3, personal, academic, commitment: null, paymentMethod: p?.payment_method ?? null };
  }

  // ── Step 4: Cek kelengkapan data komitmen ────────────────
  const commitmentComplete = p?.motivation;

  const commitment: OnboardingInitialCommitment | null = p?.motivation
    ? {
        motivation: p.motivation,
        igRobotikUrl: p.proof_follow_robotik ?? null,
        igMrcUrl: p.proof_follow_mrc ?? null,
        ytUrl: p.proof_sub_yt ?? null,
      }
    : null;

  if (!commitmentComplete) {
    return { nim, startStep: 4, personal, academic, commitment, paymentMethod: p?.payment_method ?? null };
  }

  // ── Step 5: Semua data teks lengkap, tinggal upload berkas ─
  return { nim, startStep: 5, personal, academic, commitment, paymentMethod: p?.payment_method ?? null };
}
