import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksClient } from "./TasksClient";

interface RawSubmissionAdmin {
  id: string;
  task_id: string | null;
  profile_id: string | null;
  submission_url: string;
  notes: string | null;
  grade: number | null;
  feedback: string | null;
  status: "belum_selesai" | "diperiksa" | "selesai" | "revisi";
  updated_at: string;
  profiles: {
    nim: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
}

interface RawSubmissionCaang {
  id: string;
  task_id: string | null;
  profile_id: string | null;
  submission_url: string;
  notes: string | null;
  grade: number | null;
  feedback: string | null;
  status: "belum_selesai" | "diperiksa" | "selesai" | "revisi";
  updated_at: string;
}

export default async function TugasPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;

  if (!rawProfile) {
    redirect("/login");
  }

  // Fetch all tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true });

  const isAdmin = ["admin-or", "super-admin"].includes(rawProfile.role);

  let formattedSubmissions = [];

  if (isAdmin) {
    // Admin fetches all submissions
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task_id,
        profile_id,
        submission_url,
        notes,
        grade,
        feedback,
        status,
        updated_at,
        profiles (
          nim,
          registrations (
            full_name
          )
        )
      `)
      .order("updated_at", { ascending: false });

    formattedSubmissions = ((submissions as unknown as RawSubmissionAdmin[]) || []).map((sub) => ({
      id: sub.id,
      task_id: sub.task_id || "",
      profile_id: sub.profile_id || "",
      submission_url: sub.submission_url,
      notes: sub.notes,
      grade: sub.grade,
      feedback: sub.feedback,
      status: sub.status,
      updated_at: sub.updated_at,
      caang_name: sub.profiles?.registrations?.full_name || "Calon Anggota",
      caang_nim: sub.profiles?.nim || "",
    }));
  } else {
    // Caang fetches only their submissions
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("profile_id", user.id);

    formattedSubmissions = ((submissions as unknown as RawSubmissionCaang[]) || []).map((sub) => ({
      id: sub.id,
      task_id: sub.task_id || "",
      profile_id: sub.profile_id || "",
      submission_url: sub.submission_url,
      notes: sub.notes,
      grade: sub.grade,
      feedback: sub.feedback,
      status: sub.status,
      updated_at: sub.updated_at,
      caang_name: "",
      caang_nim: "",
    }));
  }

  const formattedTasks = ((tasks as unknown as {
    id: string;
    title: string;
    description: string;
    due_date: string;
    created_at: string;
  }[]) || []).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    created_at: task.created_at,
  }));

  return (
    <TasksClient
      profile={{
        id: rawProfile.id,
        role: rawProfile.role,
      }}
      tasks={formattedTasks}
      submissions={formattedSubmissions}
    />
  );
}
