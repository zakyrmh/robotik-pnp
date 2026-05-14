"use server";

import { createClient } from "@/lib/supabase/server";

// Mengambil semua daftar jurusan
export async function getMajors() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("majors")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Mengambil prodi berdasarkan ID jurusan tertentu
export async function getStudyPrograms(majorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_programs")
    .select("id, name, degree")
    .eq("major_id", majorId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
