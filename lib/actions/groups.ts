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

/** Verify admin role helper */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "UNAUTHORIZED" as const, userId: null };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const allowedRoles = ["admin-or", "super-admin"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: "FORBIDDEN" as const, userId: null };
  }
  return { error: null, userId: user.id };
}

// ============================================================
// ACT-GRP-01: Create Parent Group
// ============================================================
export async function createParentGroup(
  name: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr === "UNAUTHORIZED")
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "" },
      };
    if (authErr === "FORBIDDEN")
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat membuat kelompok.",
        error: { code: "FORBIDDEN", details: "" },
      };

    const trimmed = name.trim();
    if (!trimmed)
      return {
        success: false,
        message: "Nama kelompok tidak boleh kosong.",
        error: { code: "BAD_REQUEST", details: "Empty name" },
      };

    const { error } = await supabase
      .from("caang_groups")
      .insert({ name: trimmed, parent_id: null });

    if (error)
      return {
        success: false,
        message: "Gagal membuat kelompok: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };

    return {
      success: true,
      message: `Kelompok "${trimmed}" berhasil dibuat.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-02: Create Sub Group under a Parent Group
// ============================================================
export async function createSubGroup(
  parentId: string,
  name: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan."
            : "Akses ditolak.",
        error: { code: authErr, details: "" },
      };

    const trimmed = name.trim();
    if (!trimmed || !parentId)
      return {
        success: false,
        message: "Nama sub kelompok dan ID kelompok induk wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing fields" },
      };

    const { error } = await supabase
      .from("caang_groups")
      .insert({ name: trimmed, parent_id: parentId });

    if (error)
      return {
        success: false,
        message: "Gagal membuat sub kelompok: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };

    return {
      success: true,
      message: `Sub kelompok "${trimmed}" berhasil dibuat.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-03: Delete a Group (parent or sub)
// ============================================================
export async function deleteGroup(
  groupId: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan."
            : "Akses ditolak.",
        error: { code: authErr, details: "" },
      };

    if (!groupId)
      return {
        success: false,
        message: "ID kelompok wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing groupId" },
      };

    const { error } = await supabase
      .from("caang_groups")
      .delete()
      .eq("id", groupId);

    if (error)
      return {
        success: false,
        message: "Gagal menghapus kelompok: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };

    return { success: true, message: "Kelompok berhasil dihapus." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-04: Add Member Manually to a Sub Group
// ============================================================
export async function addMemberManually(
  subGroupId: string,
  profileId: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan."
            : "Akses ditolak.",
        error: { code: authErr, details: "" },
      };

    if (!subGroupId || !profileId)
      return {
        success: false,
        message: "ID sub kelompok dan ID profil wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing fields" },
      };

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: subGroupId, profile_id: profileId });

    if (error) {
      if (error.code === "23505")
        return {
          success: false,
          message: "Anggota ini sudah terdaftar di sub kelompok lain.",
          error: { code: "CONFLICT", details: error.message },
        };
      return {
        success: false,
        message: "Gagal menambahkan anggota: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };
    }

    return { success: true, message: "Anggota berhasil ditambahkan." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-05: Remove Member from a Sub Group
// ============================================================
export async function removeMember(
  subGroupId: string,
  profileId: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan."
            : "Akses ditolak.",
        error: { code: authErr, details: "" },
      };

    if (!subGroupId || !profileId)
      return {
        success: false,
        message: "ID sub kelompok dan ID profil wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing fields" },
      };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", subGroupId)
      .eq("profile_id", profileId);

    if (error)
      return {
        success: false,
        message: "Gagal menghapus anggota: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };

    return { success: true, message: "Anggota berhasil dihapus dari kelompok." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-06: Update Group Name
// ============================================================
export async function updateGroupName(
  groupId: string,
  name: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan."
            : "Akses ditolak.",
        error: { code: authErr, details: "" },
      };

    const trimmed = name.trim();
    if (!trimmed || !groupId)
      return {
        success: false,
        message: "ID kelompok dan nama wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing fields" },
      };

    const { error } = await supabase
      .from("caang_groups")
      .update({ name: trimmed })
      .eq("id", groupId);

    if (error)
      return {
        success: false,
        message: "Gagal memperbarui nama kelompok: " + error.message,
        error: { code: "DATABASE_ERROR", details: error.message },
      };

    return { success: true, message: `Nama kelompok diubah menjadi "${trimmed}".` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Terjadi kesalahan server.",
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================
// ACT-GRP-07: Generate Sub Groups Algorithmically under a Parent
// ============================================================
export async function generateGroupsAlgorithmic(
  parentGroupId: string,
  totalSubGroups: number,
  strategy: "random" | "score"
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Verify admin
    const { error: authErr } = await verifyAdmin(supabase);
    if (authErr)
      return {
        success: false,
        message:
          authErr === "UNAUTHORIZED"
            ? "Sesi tidak ditemukan. Silakan login kembali."
            : "Hanya Admin OR atau Super Admin yang dapat memicu pembagian kelompok.",
        error: { code: authErr, details: "" },
      };

    if (!parentGroupId || totalSubGroups <= 0)
      return {
        success: false,
        message: "Parameter tidak valid.",
        error: {
          code: "BAD_REQUEST",
          details: "Missing parentGroupId or invalid totalSubGroups",
        },
      };

    // 2. Verify parent group exists
    const { data: parentGroup } = await supabase
      .from("caang_groups")
      .select("id, name")
      .eq("id", parentGroupId)
      .is("parent_id", null)
      .single();

    if (!parentGroup)
      return {
        success: false,
        message: "Kelompok induk tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Parent group not found" },
      };

    // 3. Fetch all active caangs
    const { data: caangs, error: caangsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "caang");

    if (caangsError || !caangs)
      return {
        success: false,
        message: "Gagal mengambil data Calon Anggota.",
        error: {
          code: "DATABASE_ERROR",
          details: caangsError?.message || "Profiles data is null",
        },
      };

    if (caangs.length === 0)
      return {
        success: false,
        message: "Tidak ada Calon Anggota aktif.",
        error: { code: "BAD_REQUEST", details: "No caangs found" },
      };

    if (totalSubGroups > caangs.length)
      return {
        success: false,
        message: `Jumlah sub kelompok (${totalSubGroups}) tidak boleh melebihi jumlah Caang (${caangs.length}).`,
        error: { code: "BAD_REQUEST", details: "Too many subgroups" },
      };

    const caangList: CaangWithScore[] = [];

    if (strategy === "score") {
      // Bulk fetch tasks and attendances
      const { data: submissions, error: subError } = await supabase
        .from("task_submissions")
        .select("profile_id, grade");
      if (subError)
        return {
          success: false,
          message: "Gagal mengambil data nilai tugas.",
          error: { code: "DATABASE_ERROR", details: subError.message },
        };

      const { data: attendances, error: attError } = await supabase
        .from("attendances")
        .select("profile_id, status");
      if (attError)
        return {
          success: false,
          message: "Gagal mengambil data absensi.",
          error: { code: "DATABASE_ERROR", details: attError.message },
        };

      // Build maps
      const taskMap = new Map<string, number[]>();
      submissions?.forEach((sub) => {
        if (sub.profile_id && sub.grade !== null && sub.grade !== undefined) {
          const list = taskMap.get(sub.profile_id) || [];
          list.push(sub.grade);
          taskMap.set(sub.profile_id, list);
        }
      });

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
        const regScore = 100;
        const taskGrades = taskMap.get(caang.id) || [];
        const taskScore =
          taskGrades.length > 0
            ? taskGrades.reduce((sum, g) => sum + g, 0) / taskGrades.length
            : 0;
        const attStatuses = attMap.get(caang.id) || [];
        const attScores: number[] = attStatuses.map((s) => {
          if (s === "hadir" || s === "sakit" || s === "izin") return 100;
          if (s === "telat") return 50;
          return 0;
        });
        const attScore =
          attScores.length > 0
            ? attScores.reduce((sum, s) => sum + s, 0) / attScores.length
            : 100;

        caangList.push({ id: caang.id, totalScore: regScore + taskScore + attScore });
      });

      caangList.sort((a, b) => b.totalScore - a.totalScore);
    } else {
      caangs.forEach((caang) => caangList.push({ id: caang.id, totalScore: 0 }));
    }

    // 4. Distribute into sub groups
    const distributedGroups: string[][] = Array.from(
      { length: totalSubGroups },
      () => []
    );

    if (strategy === "score") {
      for (let i = 0; i < caangList.length; i += totalSubGroups) {
        const tier = caangList.slice(i, i + totalSubGroups);
        shuffleFisherYates(tier);
        for (let j = 0; j < tier.length; j++) {
          distributedGroups[j].push(tier[j].id);
        }
      }
    } else {
      shuffleFisherYates(caangList);
      for (let i = 0; i < caangList.length; i++) {
        distributedGroups[i % totalSubGroups].push(caangList[i].id);
      }
    }

    // 5. Delete existing sub groups (and their members via CASCADE) under this parent
    const { data: existingSubGroups } = await supabase
      .from("caang_groups")
      .select("id")
      .eq("parent_id", parentGroupId);

    if (existingSubGroups && existingSubGroups.length > 0) {
      const { error: deleteErr } = await supabase
        .from("caang_groups")
        .delete()
        .eq("parent_id", parentGroupId);

      if (deleteErr)
        return {
          success: false,
          message: "Gagal membersihkan sub kelompok lama.",
          error: { code: "DATABASE_ERROR", details: deleteErr.message },
        };
    }

    // 6. Insert new sub groups
    const subGroupsToInsert = Array.from({ length: totalSubGroups }, (_, i) => ({
      name: `Kelompok ${i + 1}`,
      parent_id: parentGroupId,
    }));

    const { data: insertedSubGroups, error: insertGroupsError } = await supabase
      .from("caang_groups")
      .insert(subGroupsToInsert)
      .select();

    if (insertGroupsError || !insertedSubGroups)
      return {
        success: false,
        message: "Gagal membuat sub kelompok baru.",
        error: {
          code: "DATABASE_ERROR",
          details: insertGroupsError?.message || "Insert returned null",
        },
      };

    // 7. Bulk Insert members
    const membersToInsert: { group_id: string; profile_id: string }[] = [];
    for (let j = 0; j < totalSubGroups; j++) {
      const groupId = insertedSubGroups[j].id;
      const caangIds = distributedGroups[j];
      for (const profileId of caangIds) {
        membersToInsert.push({ group_id: groupId, profile_id: profileId });
      }
    }

    if (membersToInsert.length > 0) {
      // First delete existing memberships for these caangs to avoid UNIQUE conflict
      const caangIdsToReset = caangList.map((c) => c.id);
      await supabase
        .from("group_members")
        .delete()
        .in("profile_id", caangIdsToReset);

      const { error: insertMembersError } = await supabase
        .from("group_members")
        .insert(membersToInsert);

      if (insertMembersError)
        return {
          success: false,
          message: "Gagal menyimpan anggota sub kelompok baru.",
          error: { code: "DATABASE_ERROR", details: insertMembersError.message },
        };
    }

    return {
      success: true,
      message: `Berhasil membagi ${caangList.length} Caang ke dalam ${totalSubGroups} sub kelompok di bawah "${parentGroup.name}" menggunakan strategi ${strategy === "score" ? "Semi-Queue Tiering" : "Acak"}.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses pembagian kelompok.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}
