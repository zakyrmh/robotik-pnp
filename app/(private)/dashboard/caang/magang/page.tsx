import { Briefcase } from "lucide-react";
import { MagangContent, type MagangStatus } from "./_components/magang-content";
import { MagangNotOpen } from "./_components/magang-not-open";
import { MagangClosed } from "./_components/magang-closed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getPublicInternshipPeriod,
  getPublicAnnouncement,
} from "@/app/actions/or-settings.action";

export const metadata = {
  title: "Magang",
  description: "Daftar dan kelola kegiatan magang",
};

export default async function MagangPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the applicant's status
  const { data: application } = await supabase
    .from("or_internship_applications")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = (application?.status as MagangStatus) || "unregistered";

  if (status === "unregistered") {
    // Check setting availability
    const periodRes = await getPublicInternshipPeriod();
    const period = periodRes.data || {
      is_open: false,
      start_date: null,
      end_date: null,
    };

    let isBlocked = false;
    let blockReason: "not_open" | "closed" = "not_open";

    if (!period.is_open) {
      isBlocked = true;
      blockReason = period.end_date ? "closed" : "not_open"; // Menentukan default manual close
    } else {
      const now = new Date().getTime();
      const startDate = period.start_date
        ? new Date(period.start_date).getTime()
        : 0;
      const endDate = period.end_date
        ? new Date(period.end_date).getTime()
        : Infinity;

      if (now < startDate) {
        isBlocked = true;
        blockReason = "not_open";
      } else if (now > endDate) {
        isBlocked = true;
        blockReason = "closed";
      }
    }

    if (isBlocked) {
      if (blockReason === "not_open") {
        return <MagangNotOpen />;
      } else {
        const annRes = await getPublicAnnouncement();
        const cp =
          !annRes.error && annRes.data?.contacts[0]
            ? annRes.data.contacts[0]
            : {
                name: "Admin OR",
                role: "Panitia Magang",
                phone: "(Belum ada kontak)",
              };

        return (
          <MagangClosed cpName={cp.name} cpRole={cp.role} cpPhone={cp.phone} />
        );
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <Briefcase className="size-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Magang</h1>
          <p className="text-sm text-muted-foreground">
            Daftar kegiatan magang divisi atau departemen, serta logbook
            kegiatan harianmu.
          </p>
        </div>
      </div>

      <MagangContent initialStatus={status} />
    </div>
  );
}
