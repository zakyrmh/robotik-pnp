import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeletedCard } from "@/components/onboarding/deleted-card";

export const metadata: Metadata = {
  title: "Pendaftaran Dihapus | UKM Robotik PNP",
  description:
    "Status penonaktifan data pendaftaran calon anggota UKM Robotik Politeknik Negeri Padang",
};

export default async function DeletedPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the registration details including soft-delete columns
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, registrations(deleted_at, delete_reason)")
    .eq("id", user.id)
    .single();

  const registrationsData = profile?.registrations;
  let deletedAt: string | null = null;
  let deleteReason: string | null = null;

  if (registrationsData) {
    if (Array.isArray(registrationsData)) {
      deletedAt = registrationsData[0]?.deleted_at || null;
      deleteReason = registrationsData[0]?.delete_reason || null;
    } else {
      const reg = registrationsData as unknown as {
        deleted_at: string | null;
        delete_reason: string | null;
      };
      deletedAt = reg.deleted_at || null;
      deleteReason = reg.delete_reason || null;
    }
  }

  // If the user has not been soft-deleted, redirect them to dashboard
  if (!deletedAt) {
    redirect("/dashboard");
  }

  const formattedDate = new Date(deletedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <DeletedCard
      formattedDate={formattedDate}
      deleteReason={deleteReason}
    />
  );
}
