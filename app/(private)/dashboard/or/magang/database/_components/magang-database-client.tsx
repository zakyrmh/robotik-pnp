"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { CaangMagangRow } from "@/app/actions/magang-admin.action";
import { MagangDetailDialog } from "./magang-detail-dialog";
import { MagangManualDialog } from "./magang-manual-dialog";

export function MagangDatabaseClient({ data }: { data: CaangMagangRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailUserName, setDetailUserName] = useState<string>("");
  const [manualUserId, setManualUserId] = useState<string | null>(null);
  const [manualUserName, setManualUserName] = useState<string>("");

  const filteredData = data.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="shadow-sm border-muted/60">
        <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4">
          <CardTitle className="text-lg">Daftar Status Caang ({data.length})</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
            <Button asChild size="sm" variant="secondary" className="whitespace-nowrap">
              <a href="/api/or/magang/database/export">
                <Download className="size-4" />
                Export Excel
              </a>
            </Button>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik nama atau email caang..."
                className="pl-8 bg-muted/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="pl-6 py-4 whitespace-nowrap">Nama Lengkap</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Status Pendaftaran</TableHead>
                  <TableHead className="whitespace-nowrap">Metode Daftar</TableHead>
                  <TableHead className="whitespace-nowrap">Waktu Submit</TableHead>
                  <TableHead className="text-right pr-6 whitespace-nowrap">Aksi Administratif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Tidak ada data caang yang sesuai dengan kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="pl-6 font-medium whitespace-nowrap">{row.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{row.email}</TableCell>
                      <TableCell>
                        {row.status === "unregistered" && <Badge variant="outline" className="text-muted-foreground">Belum Daftar</Badge>}
                        {row.status === "pending" && <Badge variant="secondary" className="bg-orange-100/80 text-orange-800 hover:bg-orange-200 border-orange-200">Menunggu Verifikasi</Badge>}
                        {row.status === "approved" && <Badge className="bg-green-500/90 hover:bg-green-600">Terverifikasi</Badge>}
                        {row.status === "rejected" && <Badge variant="destructive" className="bg-red-500/90 border-transparent">Ditolak</Badge>}
                      </TableCell>
                      <TableCell>
                        {!row.has_registered ? (
                          <span className="text-muted-foreground">-</span>
                        ) : row.is_manual ? (
                          <Badge variant="secondary" className="bg-blue-100text-blue-800 border-blue-200 shadow-none cursor-help" title="Formulir diisikan oleh sistem/Admin">Manual Admin</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 shadow-none cursor-help" title="Formulir diisi sendiri oleh Caang">Mandiri</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {row.submitted_at ? format(new Date(row.submitted_at), "dd MMM yyyy HH:mm", { locale: id }) : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6 whitespace-nowrap">
                        {row.status === "unregistered" ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 shadow-none" 
                            onClick={() => {
                              setManualUserId(row.user_id);
                              setManualUserName(row.full_name);
                            }}
                          >
                            <UserPlus className="mr-2 h-3.5 w-3.5" />
                            Daftarkan Manual
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 shadow-none bg-slate-100 text-slate-800 hover:bg-slate-200" 
                            onClick={() => {
                              setDetailUserId(row.user_id);
                              setDetailUserName(row.full_name);
                            }}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Lihat Bukti Form
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MagangDetailDialog 
        userId={detailUserId}
        userName={detailUserName}
        open={!!detailUserId}
        onOpenChange={(open) => !open && setDetailUserId(null)}
      />

      <MagangManualDialog
        userId={manualUserId}
        userName={manualUserName}
        open={!!manualUserId}
        onOpenChange={(open) => !open && setManualUserId(null)}
      />
    </>
  );
}
