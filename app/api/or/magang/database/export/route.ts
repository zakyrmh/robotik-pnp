import { createClient } from "@/lib/supabase/server";
import { requireModule } from "@/lib/actions/utils";
import { getMagangDatabaseExportData } from "@/app/actions/magang-admin.action";
import * as XLSX from "xlsx";

export async function GET() {
  const auth = await requireModule("open-recruitment");
  if ("error" in auth && !("userId" in auth)) {
    return new Response("Akses ditolak.", { status: 403 });
  }

  const result = await getMagangDatabaseExportData();
  if (result.error || !result.data) {
    const message = result.error || "Gagal menyiapkan file export.";
    return new Response(message, { status: 500 });
  }

  const rows = result.data.map((row) => ({
    "Nama Lengkap": row.full_name,
    NIM: row.nim ?? "",
    "Program Studi": row.study_program_name ?? "",
    "No HP": row.phone ?? "",
    "Divisi Penetapan": row.divisi_penempatan ?? "",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "Nama Lengkap",
      "NIM",
      "Program Studi",
      "No HP",
      "Divisi Penetapan",
    ],
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Database Magang");

  const excelArray = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const filename = `database-peny-magang-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  return new Response(Buffer.from(excelArray), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
