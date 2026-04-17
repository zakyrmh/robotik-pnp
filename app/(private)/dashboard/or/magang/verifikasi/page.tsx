import { CheckSquare } from "lucide-react";
import { VerifikasiClientWrapper } from "./_components/verifikasi-client-wrapper";
import { getVerifikasiMagangData } from "@/app/actions/magang-admin.action";

export const metadata = {
  title: "Verifikasi Magang - OR Admin",
};

export default async function VerifikasiMagangPage() {
  const result = await getVerifikasiMagangData();
  const data = result.data || { rows: [], divisions: [], departments: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <CheckSquare className="size-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Penempatan Magang</h1>
          <p className="text-sm text-muted-foreground">
            Tinjau ulang, sesuaikan kuota secara manual bila diperlukan, dan tetapkan hasil final penugasan Magang Divisi serta Magang Departemen untuk Caang.
          </p>
        </div>
      </div>

      <VerifikasiClientWrapper initialData={data} />
    </div>
  );
}
