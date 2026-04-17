import { FlaskConical } from "lucide-react";
import { SetupMagangForm } from "./_components/setup-magang-form";
import { getPublicInternshipPeriod } from "@/app/actions/or-settings.action";

export const metadata = {
  title: "Setup Magang - OR Admin",
};

export default async function SetupMagangPage() {
  const periodRes = await getPublicInternshipPeriod();
  const period = (!periodRes.error && periodRes.data) ? periodRes.data : { is_open: false, start_date: null, end_date: null };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <FlaskConical className="size-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Setup Magang</h1>
          <p className="text-sm text-muted-foreground">
            Atur jadwal pembukaan dan penutupan form pendaftaran magang untuk calon anggota.
          </p>
        </div>
      </div>

      <SetupMagangForm initialData={period} />
    </div>
  );
}
