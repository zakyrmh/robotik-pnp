"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface CaangStatsFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface CaangDashboardStats {
  summary: {
    totalCaang: number;
    verifiedCount: number;
    pendingCount: number;
    processCount: number;
    rejectedCount: number;
    revisionCount: number;
    completionRate: number; // percentage of verified or pending vs total
    avgDurationHours: number; // average duration from profiles.created_at to registrations.created_at in hours
    avgDurationDisplay: string; // e.g. "1 jam 25 menit"
  };
  dailyTrend: {
    date: string; // YYYY-MM-DD
    formattedDate: string; // e.g. "12 Okt"
    total: number;
    verified: number;
    pending: number;
    process: number;
    rejected: number;
  }[];
  studyProgramDistribution: {
    name: string;
    degree: string;
    majorName: string;
    count: number;
  }[];
  majorDistribution: {
    name: string;
    count: number;
  }[];
  genderDistribution: {
    gender: "L" | "P" | "Lainnya";
    label: string;
    count: number;
    percentage: number;
  }[];
  entryYearDistribution: {
    year: string;
    count: number;
  }[];
  paymentMethodDistribution: {
    method: string;
    count: number;
  }[];
  statusDistribution: {
    status: string;
    label: string;
    count: number;
    color: string;
  }[];
}

interface RegistrationRecord {
  id: string;
  full_name: string;
  gender: string;
  entry_year: number;
  payment_method: string | null;
  status: string | null;
  created_at: string | null;
  deleted_at: string | null;
  study_programs: {
    id: string;
    name: string;
    degree: string;
    majors: {
      id: string;
      name: string;
    } | null;
  } | null;
}

async function verifyAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false,
      error: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "super-admin" && profile.role !== "admin-or")
  ) {
    return {
      authorized: false,
      error: "Akses ditolak. Anda tidak memiliki izin untuk melihat statistik ini.",
    };
  }

  return { authorized: true, user, role: profile.role };
}

export async function getCaangDashboardStats(
  filter?: CaangStatsFilter,
): Promise<{ success: boolean; error?: string; data?: CaangDashboardStats }> {
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const supabaseAdmin = createSupabaseClient(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 1. Fetch profiles for role 'caang' with joined registrations and study_programs
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        created_at,
        role,
        registrations (
          id,
          full_name,
          gender,
          entry_year,
          payment_method,
          status,
          created_at,
          deleted_at,
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
      `,
      )
      .eq("role", "caang")
      .is("registrations.deleted_at", null);

    if (error) {
      console.error("Error fetching caang dashboard stats:", error);
      return { success: false, error: "Gagal mengambil data statistik Caang." };
    }

    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        data: {
          summary: {
            totalCaang: 0,
            verifiedCount: 0,
            pendingCount: 0,
            processCount: 0,
            rejectedCount: 0,
            revisionCount: 0,
            completionRate: 0,
            avgDurationHours: 0,
            avgDurationDisplay: "0 Menit",
          },
          dailyTrend: [],
          studyProgramDistribution: [],
          majorDistribution: [],
          genderDistribution: [],
          entryYearDistribution: [],
          paymentMethodDistribution: [],
          statusDistribution: [],
        },
      };
    }

    // Helper to get single registration object safely
    const getReg = (p: (typeof profiles)[0]): RegistrationRecord | null => {
      if (!p.registrations) return null;
      if (Array.isArray(p.registrations)) {
        return (p.registrations[0] as unknown as RegistrationRecord) || null;
      }
      return p.registrations as unknown as RegistrationRecord;
    };

    // Filter applied to registration created_at or status if specified
    const filteredProfiles = profiles.filter((p) => {
      const reg = getReg(p);

      if (filter?.status && filter.status !== "all") {
        const currentStatus = reg?.status || "process";
        if (currentStatus !== filter.status) return false;
      }

      if (filter?.startDate) {
        const profileDate = p.created_at;
        if (new Date(profileDate) < new Date(filter.startDate)) return false;
      }

      if (filter?.endDate) {
        const profileDate = p.created_at;
        const endFilterDate = new Date(filter.endDate);
        endFilterDate.setHours(23, 59, 59, 999);
        if (new Date(profileDate) > endFilterDate) return false;
      }

      return true;
    });

    const totalCaang = filteredProfiles.length;
    let verifiedCount = 0;
    let pendingCount = 0;
    let processCount = 0;
    let rejectedCount = 0;
    let revisionCount = 0;

    let totalDurationMs = 0;
    let durationCount = 0;

    const dailyTrendMap: Record<
      string,
      {
        total: number;
        verified: number;
        pending: number;
        process: number;
        rejected: number;
      }
    > = {};

    const studyProgMap: Record<
      string,
      { name: string; degree: string; majorName: string; count: number }
    > = {};

    const majorMap: Record<string, number> = {};
    const genderMap: Record<string, number> = { L: 0, P: 0, Lainnya: 0 };
    const entryYearMap: Record<string, number> = {};
    const paymentMethodMap: Record<string, number> = {};

    filteredProfiles.forEach((p) => {
      const reg = getReg(p);
      const status = reg?.status || "process";

      if (status === "verified") verifiedCount++;
      else if (status === "pending") pendingCount++;
      else if (status === "rejected") rejectedCount++;
      else if (status === "revision") revisionCount++;
      else processCount++;

      // Calculation of duration from account creation (profiles.created_at) to form submission (registrations.created_at)
      if (p.created_at && reg?.created_at) {
        const profileCreatedAt = new Date(p.created_at).getTime();
        const regCreatedAt = new Date(reg.created_at).getTime();
        if (regCreatedAt >= profileCreatedAt) {
          totalDurationMs += regCreatedAt - profileCreatedAt;
          durationCount++;
        }
      }

      // Daily Trend based on registration creation date or profile creation date
      const dateKey = (reg?.created_at || p.created_at).substring(0, 10);
      if (!dailyTrendMap[dateKey]) {
        dailyTrendMap[dateKey] = {
          total: 0,
          verified: 0,
          pending: 0,
          process: 0,
          rejected: 0,
        };
      }
      dailyTrendMap[dateKey].total++;
      if (status === "verified") dailyTrendMap[dateKey].verified++;
      else if (status === "pending") dailyTrendMap[dateKey].pending++;
      else if (status === "rejected") dailyTrendMap[dateKey].rejected++;
      else dailyTrendMap[dateKey].process++;

      // Study Program & Major
      const sp = reg?.study_programs;
      if (sp) {
        const progKey = `${sp.degree} - ${sp.name}`;
        const majorName = sp.majors?.name || "Lainnya";

        if (!studyProgMap[progKey]) {
          studyProgMap[progKey] = {
            name: sp.name,
            degree: sp.degree,
            majorName,
            count: 0,
          };
        }
        studyProgMap[progKey].count++;

        majorMap[majorName] = (majorMap[majorName] || 0) + 1;
      } else {
        majorMap["Belum Mengisi"] = (majorMap["Belum Mengisi"] || 0) + 1;
      }

      // Gender
      const g = reg?.gender;
      if (g === "L" || g === "P") {
        genderMap[g]++;
      } else {
        genderMap["Lainnya"]++;
      }

      // Entry Year
      const year = reg?.entry_year ? String(reg.entry_year) : "Belum Mengisi";
      entryYearMap[year] = (entryYearMap[year] || 0) + 1;

      // Payment Method
      const method = reg?.payment_method || "Belum Mengisi";
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + 1;
    });

    // Calculate Average Duration
    const avgDurationHours =
      durationCount > 0 ? totalDurationMs / durationCount / (1000 * 60 * 60) : 0;

    let avgDurationDisplay = "0 Menit";
    if (durationCount > 0) {
      const avgMinutesTotal = Math.round(
        totalDurationMs / durationCount / (1000 * 60),
      );
      if (avgMinutesTotal < 60) {
        avgDurationDisplay = `${avgMinutesTotal} menit`;
      } else {
        const hours = Math.floor(avgMinutesTotal / 60);
        const mins = avgMinutesTotal % 60;
        avgDurationDisplay =
          mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
      }
    }

    // Daily Trend Array (sorted by date)
    const dailyTrend = Object.keys(dailyTrendMap)
      .sort()
      .map((date) => {
        const d = new Date(date);
        const formattedDate = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        return {
          date,
          formattedDate,
          ...dailyTrendMap[date],
        };
      });

    // Study Program Array
    const studyProgramDistribution = Object.values(studyProgMap).sort(
      (a, b) => b.count - a.count,
    );

    // Major Distribution Array
    const majorDistribution = Object.keys(majorMap)
      .map((name) => ({ name, count: majorMap[name] }))
      .sort((a, b) => b.count - a.count);

    // Gender Distribution Array
    const genderDistribution: {
      gender: "L" | "P" | "Lainnya";
      label: string;
      count: number;
      percentage: number;
    }[] = [
      {
        gender: "L",
        label: "Laki-laki",
        count: genderMap["L"],
        percentage:
          totalCaang > 0 ? Math.round((genderMap["L"] / totalCaang) * 100) : 0,
      },
      {
        gender: "P",
        label: "Perempuan",
        count: genderMap["P"],
        percentage:
          totalCaang > 0 ? Math.round((genderMap["P"] / totalCaang) * 100) : 0,
      },
    ];
    if (genderMap["Lainnya"] > 0) {
      genderDistribution.push({
        gender: "Lainnya",
        label: "Belum Mengisi",
        count: genderMap["Lainnya"],
        percentage:
          totalCaang > 0
            ? Math.round((genderMap["Lainnya"] / totalCaang) * 100)
            : 0,
      });
    }

    // Entry Year Array
    const entryYearDistribution = Object.keys(entryYearMap)
      .sort()
      .map((year) => ({ year, count: entryYearMap[year] }));

    // Payment Method Array
    const paymentMethodDistribution = Object.keys(paymentMethodMap)
      .map((method) => ({ method, count: paymentMethodMap[method] }))
      .sort((a, b) => b.count - a.count);

    // Status Distribution Array
    const statusDistribution = [
      {
        status: "verified",
        label: "Terverifikasi (Lolos)",
        count: verifiedCount,
        color: "#16a34a",
      },
      {
        status: "pending",
        label: "Menunggu Review",
        count: pendingCount,
        color: "#d97706",
      },
      {
        status: "process",
        label: "Draf Pendaftaran",
        count: processCount,
        color: "#3b5b84",
      },
      {
        status: "rejected",
        label: "Ditolak",
        count: rejectedCount,
        color: "#ef4444",
      },
      {
        status: "revision",
        label: "Perlu Perbaikan",
        count: revisionCount,
        color: "#f0975a",
      },
    ];

    const completionRate =
      totalCaang > 0
        ? Math.round(((verifiedCount + pendingCount) / totalCaang) * 100)
        : 0;

    return {
      success: true,
      data: {
        summary: {
          totalCaang,
          verifiedCount,
          pendingCount,
          processCount,
          rejectedCount,
          revisionCount,
          completionRate,
          avgDurationHours,
          avgDurationDisplay,
        },
        dailyTrend,
        studyProgramDistribution,
        majorDistribution,
        genderDistribution,
        entryYearDistribution,
        paymentMethodDistribution,
        statusDistribution,
      },
    };
  } catch (err) {
    console.error("Unexpected error in getCaangDashboardStats:", err);
    return { success: false, error: "Terjadi kesalahan sistem saat memproses data." };
  }
}
