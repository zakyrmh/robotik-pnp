"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SystemAuditLogQueryResult } from "@/lib/types/user-management";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

interface AuditLogViewerClientProps {
  initialData: SystemAuditLogQueryResult;
}

export function AuditLogViewerClient({
  initialData,
}: AuditLogViewerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = initialData.page;
  const totalPages = initialData.totalPages;

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", String(newPage));

    startTransition(() => {
      router.push(`/audit-log?${current.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-neutral-900 to-zinc-900 text-white shadow-xl border border-neutral-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit Trail &amp; System Log Integrity</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-400" />
            <span>Audit Log Sistem</span>
          </h1>
          <p className="text-xs text-neutral-400 max-w-xl">
            Pencatatan jejak audit tak terbantahkan (non-repudiation) untuk
            seluruh aktivitas mutasi hak akses dan status pengguna oleh admin.
          </p>
        </div>
      </div>

      {/* Main Log Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-neutral-50 dark:bg-neutral-800/50">
            <TableRow>
              <TableHead className="w-[180px] text-xs font-semibold">
                Waktu &amp; Tanggal
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Tipe Aksi (Action)
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Target User ID
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Detail Keterangan
              </TableHead>
              <TableHead className="text-xs font-semibold text-right">
                Data Perubahan (JSON)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-xs text-neutral-500"
                >
                  Belum ada catatan audit log dalam sistem.
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="py-3 text-xs text-neutral-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {log.actionType}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
                    {log.targetUserId
                      ? log.targetUserId.slice(0, 13) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-neutral-800 dark:text-neutral-200">
                    {log.details || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <details className="text-left text-[11px] bg-neutral-50 dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 inline-block max-w-xs overflow-x-auto">
                      <summary className="cursor-pointer font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Inspeksi State (Old/New)</span>
                      </summary>
                      <div className="mt-2 space-y-1 font-mono text-[10px]">
                        {log.oldValue && (
                          <div>
                            <span className="text-red-500 font-bold">
                              Semula:
                            </span>
                            <pre className="whitespace-pre-wrap overflow-x-auto bg-neutral-100 dark:bg-neutral-900 p-1 rounded">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <span className="text-emerald-500 font-bold">
                              Menjadi:
                            </span>
                            <pre className="whitespace-pre-wrap overflow-x-auto bg-neutral-100 dark:bg-neutral-900 p-1 rounded">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Audit Log Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
          <span>
            Halaman {page} dari {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 rounded-lg text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelum
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || totalPages === 0}
              className="h-8 rounded-lg text-xs"
            >
              Lanjut <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
