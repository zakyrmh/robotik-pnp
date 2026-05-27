"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";

interface CreateTaskInput {
  title: string;
  description: string;
  dueDate: string; // ISO String
}

/**
 * ACT-05: Create new task for Caang.
 * Accessible only by Admin OR or Super Admin.
 */
export async function createTask(
  data: CreateTaskInput
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Profil tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Profile not found" }
      };
    }

    const allowedRoles = ["admin-or", "super-admin"];
    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat membuat tugas.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" }
      };
    }

    const { title, description, dueDate } = data;
    if (!title || !description || !dueDate) {
      return {
        success: false,
        message: "Semua kolom input wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing required fields" }
      };
    }

    // 2. Insert task
    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        due_date: dueDate,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !newTask) {
      return {
        success: false,
        message: "Gagal menyimpan tugas baru ke database.",
        error: { code: "DATABASE_ERROR", details: insertError?.message || "Task insertion returned null" }
      };
    }

    return {
      success: true,
      message: "Tugas baru berhasil dibuat.",
      data: {
        id: newTask.id,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses pembuatan tugas.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * ACT-05: Submit task submission by Caang.
 * Uploads file to private 'task-submissions' bucket.
 * Enforces file extension validation (.txt, .pdf, .docx, .png, .jpg, .jpeg, .gif).
 */
export async function submitTaskSubmission(
  formData: FormData
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user and verify role is "caang"
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Profil tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Profile not found" }
      };
    }

    if (profile.role !== "caang") {
      return {
        success: false,
        message: "Hanya Calon Anggota (Caang) yang dapat mengumpulkan tugas.",
        error: { code: "FORBIDDEN", details: "Only caang role can submit tasks" }
      };
    }

    const taskId = formData.get("task_id") as string;
    const notes = formData.get("notes") as string;
    const file = formData.get("file") as File | null;

    if (!taskId || !file || file.size === 0) {
      return {
        success: false,
        message: "File tugas wajib diunggah.",
        error: { code: "BAD_REQUEST", details: "Missing required fields" }
      };
    }

    // 2. Validate file extension (TS-LMS-01: text, image, docx, pdf)
    const allowedExtensions = ["txt", "pdf", "docx", "png", "jpg", "jpeg", "gif"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return {
        success: false,
        message: "Format file tidak diizinkan. Hanya file teks (.txt), dokumen (.pdf, .docx), atau gambar yang diperbolehkan.",
        error: { code: "INVALID_FILE_TYPE", details: `Extension .${fileExt || ""} is not allowed` }
      };
    }

    // 3. Upload file to private storage bucket 'task-submissions'
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${taskId}/${user.id}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("task-submissions")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        message: "Gagal mengunggah berkas tugas ke storage.",
        error: { code: "STORAGE_ERROR", details: uploadError.message }
      };
    }

    // 4. Upsert task_submissions record
    const { error: upsertError } = await supabase
      .from("task_submissions")
      .upsert({
        task_id: taskId,
        profile_id: user.id,
        submission_url: filePath,
        notes: notes || null,
        status: "diperiksa", // Update status to 'diperiksa' upon submit
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "task_id,profile_id"
      });

    if (upsertError) {
      return {
        success: false,
        message: "Gagal menyimpan pengumpulan tugas ke database.",
        error: { code: "DATABASE_ERROR", details: upsertError.message }
      };
    }

    return {
      success: true,
      message: "Tugas berhasil dikumpulkan dan sedang menunggu penilaian.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses pengumpulan tugas.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * ACT-05: Grade task submission.
 * Enforces grade limits (0-100) and stores grader's feedback.
 */
export async function gradeTaskSubmission(
  submissionId: string,
  grade: number,
  feedback: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user and verify admin role
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
        message: "Hanya Admin OR atau Super Admin yang dapat memberikan penilaian.",
        error: { code: "FORBIDDEN", details: "User role is not authorized to grade" }
      };
    }

    // 2. Validate grade bounds (0-100)
    if (grade < 0 || grade > 100) {
      return {
        success: false,
        message: "Nilai harus berada di antara rentang 0 sampai 100.",
        error: { code: "BAD_REQUEST", details: `Grade ${grade} is out of bounds` }
      };
    }

    // 3. Update task submission
    const status = grade >= 50 ? "selesai" : "revisi";

    const { error: updateError } = await supabase
      .from("task_submissions")
      .update({
        grade,
        feedback: feedback || null,
        status: status as "belum_selesai" | "diperiksa" | "selesai" | "revisi",
        graded_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      return {
        success: false,
        message: "Gagal menyimpan penilaian tugas.",
        error: { code: "DATABASE_ERROR", details: updateError.message }
      };
    }

    return {
      success: true,
      message: `Tugas berhasil dinilai dengan skor ${grade} (Status: ${status === "selesai" ? "Selesai" : "Revisi"}).`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses penilaian tugas.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
