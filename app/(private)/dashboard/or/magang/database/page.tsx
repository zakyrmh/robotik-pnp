import { Database } from "lucide-react";
import { getMagangDatabaseData } from "@/app/actions/magang-admin.action";
import { MagangDatabaseClient } from "./_components/magang-database-client";

export const metadata = {
  title: "Database Pendaftar Magang - OR Admin",
};

export default async function MagangDatabasePage() {
  const result = await getMagangDatabaseData();
  const data = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <Database className="size-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Pendaftar Magang</h1>
          <p className="text-sm text-muted-foreground">
            Daftar keseluruhan Calon Anggota dan pantauan status pendaftaran awal magang mereka.
          </p>
        </div>
      </div>

      <MagangDatabaseClient data={data} />
    </div>
  );
}
