import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PiketClient } from "./PiketClient";

interface RawPiketLog {
  id: string;
  duty_date: string;
  notes: string | null;
  proof_image_url: string;
  is_verified: boolean;
  schedule_id: string;
  piket_schedules: {
    day: string;
  } | null;
  reported_by: string;
  profiles: {
    id: string;
    nim: string | null;
    registrations: {
      full_name: string;
    } | null;
  } | null;
}

interface RawPiketSchedule {
  id: string;
  day: string;
  piket_members: {
    profile_id: string;
    profiles: {
      id: string;
      nim: string | null;
      registrations: {
        full_name: string;
      } | null;
    } | null;
  }[] | null;
}

interface RawPiketAssignment {
  schedule_id: string;
  piket_schedules: {
    id: string;
    day: string;
  } | null;
}

export default async function PiketPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // 1. Fetch all schedules and their members for calendar view
  const { data: schedules } = await supabase
    .from("piket_schedules")
    .select(`
      id,
      day,
      piket_members (
        profile_id,
        profiles (
          id,
          nim,
          registrations (
            full_name
          )
        )
      )
    `)
    .order("day"); // Day sorting will be processed in client since it's an enum

  // 2. Fetch current user's schedule assignment
  const { data: myAssignments } = await supabase
    .from("piket_members")
    .select(`
      schedule_id,
      piket_schedules (
        id,
        day
      )
    `)
    .eq("profile_id", user.id);

  // 3. Fetch piket logs (all logs, order by date desc)
  const { data: logs } = await supabase
    .from("piket_logs")
    .select(`
      id,
      duty_date,
      notes,
      proof_image_url,
      is_verified,
      schedule_id,
      piket_schedules (
        day
      ),
      reported_by,
      profiles (
        id,
        nim,
        registrations (
          full_name
        )
      )
    `)
    .order("duty_date", { ascending: false });

  // Format logs data helper
  const formattedLogs = ((logs as unknown as RawPiketLog[]) || []).map((log) => ({
    id: log.id,
    duty_date: log.duty_date,
    notes: log.notes,
    proof_image_url: log.proof_image_url,
    is_verified: log.is_verified,
    schedule_id: log.schedule_id,
    schedule_day: log.piket_schedules?.day || "Tidak Diketahui",
    reporter_id: log.reported_by,
    reporter_name: log.profiles?.registrations?.full_name || "Anggota",
    reporter_nim: log.profiles?.nim || "",
  }));

  // Format schedules data helper
  const formattedSchedules = ((schedules as unknown as RawPiketSchedule[]) || []).map((sched) => ({
    id: sched.id,
    day: sched.day,
    members: (sched.piket_members || []).map((m) => ({
      profile_id: m.profile_id,
      nim: m.profiles?.nim || "",
      name: m.profiles?.registrations?.full_name || "Anggota",
    })),
  }));

  const userAssignments = ((myAssignments as unknown as RawPiketAssignment[]) || []).map((assign) => ({
    schedule_id: assign.schedule_id,
    day: assign.piket_schedules?.day || "",
  }));

  return (
    <PiketClient
      profile={{
        id: profile.id,
        email: profile.email,
        role: profile.role,
        is_onboarded: profile.is_onboarded,
      }}
      schedules={formattedSchedules}
      myAssignments={userAssignments}
      logs={formattedLogs}
    />
  );
}
