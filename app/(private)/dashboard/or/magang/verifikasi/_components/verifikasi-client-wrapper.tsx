"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Search, SaveAll, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type VerifikasiMagangData,
  updateFinalPlacement,
  approveDraftPlacements,
} from "@/app/actions/magang-admin.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PILIHAN_DEPARTEMEN = [
  "Kesekretariatan",
  "Maintenance",
  "Produksi",
  "Hubungan Masyarakat",
  "Publikasi dan Dokumentasi",
  "Komisi Pemberdayaan Sumber Daya Manusia",
  "Riset Teknologi",
];

export function VerifikasiClientWrapper({
  initialData,
}: {
  initialData: VerifikasiMagangData;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const { rows, divisions, departments } = initialData;

  const divMap = new Map(divisions.map((d) => [d.id, d.name]));
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  const filteredRows = rows.filter((r) =>
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSetujuiSemua = async (type: "divisi" | "departemen") => {
    setIsPending(true);
    const res = await approveDraftPlacements(type);
    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Semua draft magang ${type} berhasil disetujui!`);
      router.refresh();
    }
  };

  const handleGantiManual = async (
    appId: string,
    type: "divisi" | "departemen",
    targetId: string,
  ) => {
    setIsPending(true);
    const res = await updateFinalPlacement(appId, type, targetId);
    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Penempatan manual berhasil disimpan`);
      router.refresh();
    }
  };

  const handleSetujuiSatu = async (
    appId: string,
    type: "divisi" | "departemen",
  ) => {
    setIsPending(true);
    const res = await approveDraftPlacements(type, [appId]);
    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Data disetujui.`);
      router.refresh();
    }
  };

  return (
    <Tabs defaultValue="divisi" className="w-full">
      <TabsList className="mb-4 bg-muted/60 p-1 rounded-xl">
        <TabsTrigger value="divisi" className="rounded-lg">
          1. Validasi Magang Divisi
        </TabsTrigger>
        <TabsTrigger value="departemen" className="rounded-lg">
          2. Validasi Magang Departemen
        </TabsTrigger>
      </TabsList>

      {/* ========================================================
          TAB DIVISI
      ======================================================== */}
      <TabsContent value="divisi" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 mb-4 bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">
                Mekanisme Penentuan Kuota Algoritma Divisi:
              </p>
              <p>
                Sistem merekomendasikan Caang dengan rumus algoritma saat mereka
                mengisi form pendaftaran. Sisa slot divisi akan ditentukan oleh
                kecocokan Bobot Minat.{" "}
                <strong>Admin memegang kedaulatan penuh</strong> untuk melakukan
                pergantian opsi final.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            disabled={isPending}
            onClick={() => handleSetujuiSemua("divisi")}
            className="shrink-0 bg-orange-600 hover:bg-orange-700 shadow-none"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <SaveAll className="w-4 h-4 mr-2" />
            )}
            Setujui Semua Draft Divisi
          </Button>
        </div>

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Tinjauan Ploting Divisi</CardTitle>
              <CardDescription>
                Ubah secara individual jika dibutuhkan sebelum pengumuman.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama caang..."
                  className="pl-8 bg-muted/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="pl-6 py-4 whitespace-nowrap">
                    Nama Caang
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Prioritas Pilihan
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Rekomendasi Algoritma
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Pilihan Final
                  </TableHead>
                  <TableHead className="text-right pr-6 whitespace-nowrap">
                    Tindakan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Belum ada data pendaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const div1Name = divMap.get(row.divisi_1_id) || "-";
                    const div2Name = divMap.get(row.divisi_2_id) || "-";
                    const recomName = row.recommended_divisi_id
                      ? divMap.get(row.recommended_divisi_id)
                      : "-";

                    const isFinalized = !!row.final_divisi_id;
                    const finalName = row.final_divisi_id
                      ? divMap.get(row.final_divisi_id)
                      : null;

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="pl-6 font-medium whitespace-nowrap">
                          {row.full_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground leading-relaxed whitespace-nowrap">
                          <span className="font-semibold text-foreground">
                            1. {div1Name}
                          </span>
                          <br />
                          2. {div2Name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {recomName}{" "}
                            {recomName === div1Name
                              ? "(P1)"
                              : recomName === div2Name
                                ? "(P2)"
                                : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isFinalized ? (
                            <Badge className="bg-slate-800 text-white">
                              {finalName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">
                              Masih Draft...
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 whitespace-nowrap flex items-center justify-end gap-2">
                          {!isFinalized ? (
                            <>
                              <Select
                                disabled={isPending}
                                onValueChange={(val) =>
                                  handleGantiManual(row.id, "divisi", val)
                                }
                              >
                                <SelectTrigger className="w-[110px] h-8 text-xs border-orange-200 text-orange-600">
                                  <SelectValue placeholder="Override" />
                                </SelectTrigger>
                                <SelectContent>
                                  {divisions.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  handleSetujuiSatu(row.id, "divisi")
                                }
                                className="h-8 bg-green-600 hover:bg-green-700 text-white shadow-none whitespace-nowrap"
                              >
                                Setujui Draft
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center justify-end h-8">
                              Sudah Disetujui
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ========================================================
          TAB DEPARTEMEN
      ======================================================== */}
      <TabsContent value="departemen" className="space-y-4">
        <div className="flex bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl items-start gap-3 mt-2 mb-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">
              Catatan Mekanisme Tanpa Batas Kuota:
            </p>
            <p>
              Sesuai SOP, magang Departemen{" "}
              <strong>tidak memiliki batasan slot khusus</strong>. Secara
              otomatis sistem akan merekomendasikan Caang sesuai pilihan 1-nya
              mutlak. Admin dapat menyetujui langsung secara borongan.
            </p>
          </div>
        </div>

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">
                Tinjauan Ploting Departemen
              </CardTitle>
              <CardDescription>
                Finalisasi magang administratif operasional
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => handleSetujuiSemua("departemen")}
                className="h-9 shadow-sm shrink-0"
              >
                Setujui Semua
              </Button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama..."
                  className="pl-8 h-9 bg-muted/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="pl-6 py-4 whitespace-nowrap">
                    Nama Caang
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Pilihan Departemen
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Rekomendasi Algoritma
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Status Final
                  </TableHead>
                  <TableHead className="text-right pr-6 whitespace-nowrap">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Belum ada data pendaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const d1Name = deptMap.get(row.dept_1_id) || "-";
                    const rdName = row.recommended_dept_id
                      ? deptMap.get(row.recommended_dept_id)
                      : "-";
                    const isFinalized = !!row.final_dept_id;
                    const finalName = row.final_dept_id
                      ? deptMap.get(row.final_dept_id)
                      : "-";

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="pl-6 font-medium whitespace-nowrap">
                          {row.full_name}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap">
                          {d1Name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {rdName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isFinalized ? (
                            <Badge className="bg-slate-800 text-white">
                              {finalName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">
                              Menunggu Validasi
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 flex items-center justify-end gap-2">
                          {!isFinalized ? (
                            <>
                              <Select
                                disabled={isPending}
                                onValueChange={(val) =>
                                  handleGantiManual(row.id, "departemen", val)
                                }
                              >
                                <SelectTrigger className="w-[160px] h-8 text-xs border-orange-200 text-orange-600">
                                  <SelectValue placeholder="Override Departemen" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments
                                    .filter((d) =>
                                      PILIHAN_DEPARTEMEN.includes(d.name),
                                    )
                                    .map((d) => (
                                      <SelectItem key={d.id} value={d.id}>
                                        {d.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  handleSetujuiSatu(row.id, "departemen")
                                }
                                className="h-8 bg-green-600 hover:bg-green-700 text-white shadow-none whitespace-nowrap"
                              >
                                Setujui
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center h-8">
                              Sudah Disetujui
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
