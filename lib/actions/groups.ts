"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";

interface CaangWithScore {
  id: string;
  totalScore: number;
}

function shuffleFisherYates<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

/**
 * ACT-04: Generate groups algorithmically.
 * Strategy: 'random' | 'score'.
 * If 'score': utilizes Semi-Queue Tiering.
 */
export async function generateGroupsAlgorithmic(
  totalGroups: number,
  strategy: "random" | "score"
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get current user and verify admin role
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !adminUser) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "Admin is not logged in" }
      };
    }

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminProfileError || !adminProfile) {
      return {
        success: false,
        message: "Profil admin tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Admin profile not found" }
      };
    }

    const allowedRoles = ["admin-or", "super-admin"];
    if (!allowedRoles.includes(adminProfile.role)) {
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat memicu pembagian kelompok.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" }
      };
    }

    if (totalGroups <= 0) {
      return {
        success: false,
        message: "Jumlah kelompok harus minimal 1.",
        error: { code: "BAD_REQUEST", details: "Total groups must be greater than 0" }
      };
    }

    // 2. Fetch all active caangs
    const { data: caangs, error: caangsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "caang");

    if (caangsError || !caangs) {
      return {
        success: false,
        message: "Gagal mengambil data Calon Anggota.",
        error: { code: "DATABASE_ERROR", details: caangsError?.message || "Profiles data is null" }
      };
    }

    if (caangs.length === 0) {
      return {
        success: false,
        message: "Tidak ada Calon Anggota aktif yang dapat dibagikan ke dalam kelompok.",
        error: { code: "BAD_REQUEST", details: "No caangs found" }
      };
    }

    const caangList: CaangWithScore[] = [];

    if (strategy === "score") {
      // 3. Bulk fetch tasks and attendances to calculate scores efficiently (O(1) queries instead of O(N) loop queries)
      const { data: submissions, error: subError } = await supabase
        .from("task_submissions")
        .select("profile_id, grade");

      if (subError) {
        return {
          success: false,
          message: "Gagal mengambil data nilai tugas.",
          error: { code: "DATABASE_ERROR", details: subError.message }
        };
      }

      const { data: attendances, error: attError } = await supabase
        .from("attendances")
        .select("profile_id, status");

      if (attError) {
        return {
          success: false,
          message: "Gagal mengambil data absensi.",
          error: { code: "DATABASE_ERROR", details: attError.message }
        };
      }

      // Group submissions by profile_id
      const taskMap = new Map<string, number[]>();
      submissions?.forEach((sub) => {
        if (sub.profile_id && sub.grade !== null && sub.grade !== undefined) {
          const list = taskMap.get(sub.profile_id) || [];
          list.push(sub.grade);
          taskMap.set(sub.profile_id, list);
        }
      });

      // Group attendances by profile_id
      const attMap = new Map<string, string[]>();
      attendances?.forEach((att) => {
        if (att.profile_id && att.status) {
          const list = attMap.get(att.profile_id) || [];
          list.push(att.status);
          attMap.set(att.profile_id, list);
        }
      });

      // Calculate scores
      caangs.forEach((caang) => {
        // Registration score defaults to 100 for verified registrations
        const regScore = 100;

        // Task score is the average of task grades
        const taskGrades = taskMap.get(caang.id) || [];
        const taskScore =
          taskGrades.length > 0
            ? taskGrades.reduce((sum, g) => sum + g, 0) / taskGrades.length
            : 0;

        // Attendance score (hadir = 100, telat = 50, sakit/izin = 100, alfa = 0)
        const attStatuses = attMap.get(caang.id) || [];
        const attScores: number[] = attStatuses.map((status) => {
          if (status === "hadir" || status === "sakit" || status === "izin") return 100;
          if (status === "telat") return 50;
          return 0;
        });
        const attScore =
          attScores.length > 0
            ? attScores.reduce((sum, s) => sum + s, 0) / attScores.length
            : 100; // default to 100 if no sessions attended yet

        caangList.push({
          id: caang.id,
          totalScore: regScore + taskScore + attScore,
        });
      });

      // Sort by totalScore descending
      caangList.sort((a, b) => b.totalScore - a.totalScore);
    } else {
      // strategy === 'random'
      caangs.forEach((caang) => {
        caangList.push({
          id: caang.id,
          totalScore: 0,
        });
      });
    }

    // 4. Distribute into groups
    const distributedGroups: string[][] = Array.from({ length: totalGroups }, () => []);

    if (strategy === "score") {
      // Semi-Queue Tiering
      // Split into slices of size `totalGroups` (each slice is a tier)
      for (let i = 0; i < caangList.length; i += totalGroups) {
        const tier = caangList.slice(i, i + totalGroups);
        // Shuffle the tier
        shuffleFisherYates(tier);
        // Distribute sequentially to groups
        for (let j = 0; j < tier.length; j++) {
          distributedGroups[j].push(tier[j].id);
        }
      }
    } else {
      // Random Strategy
      shuffleFisherYates(caangList);
      for (let i = 0; i < caangList.length; i++) {
        distributedGroups[i % totalGroups].push(caangList[i].id);
      }
    }

    // 5. Clean up old records from group_members and caang_groups
    const { error: deleteMembersError } = await supabase
      .from("group_members")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteMembersError) {
      return {
        success: false,
        message: "Gagal membersihkan data anggota kelompok lama.",
        error: { code: "DATABASE_ERROR", details: deleteMembersError.message }
      };
    }

    const { error: deleteGroupsError } = await supabase
      .from("caang_groups")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteGroupsError) {
      return {
        success: false,
        message: "Gagal membersihkan kelompok lama.",
        error: { code: "DATABASE_ERROR", details: deleteGroupsError.message }
      };
    }

    // 6. Insert new groups
    const groupsToInsert = Array.from({ length: totalGroups }, (_, i) => ({
      name: `Kelompok ${i + 1}`,
    }));

    const { data: insertedGroups, error: insertGroupsError } = await supabase
      .from("caang_groups")
      .insert(groupsToInsert)
      .select();

    if (insertGroupsError || !insertedGroups) {
      return {
        success: false,
        message: "Gagal membuat kelompok baru.",
        error: { code: "DATABASE_ERROR", details: insertGroupsError?.message || "Groups insert returned null" }
      };
    }

    // 7. Bulk Insert members into group_members
    const membersToInsert = [];
    for (let j = 0; j < totalGroups; j++) {
      const groupId = insertedGroups[j].id;
      const caangIds = distributedGroups[j];
      for (const profileId of caangIds) {
        membersToInsert.push({
          group_id: groupId,
          profile_id: profileId,
        });
      }
    }

    if (membersToInsert.length > 0) {
      const { error: insertMembersError } = await supabase
        .from("group_members")
        .insert(membersToInsert);

      if (insertMembersError) {
        return {
          success: false,
          message: "Gagal menyimpan anggota kelompok baru.",
          error: { code: "DATABASE_ERROR", details: insertMembersError.message }
        };
      }
    }

    return {
      success: true,
      message: `Berhasil membagi ${caangList.length} Caang secara merata ke dalam ${totalGroups} kelompok menggunakan strategi ${strategy === "score" ? "Semi-Queue Tiering" : "Acak"}.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses pembagian kelompok.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
