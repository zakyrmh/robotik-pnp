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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SecurityCheckIcon,
  Time04Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FileCodeIcon,
  AlertCircleIcon,
  ComputerIcon,
  UserIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

interface AuditLogViewerProps {
  initialData: SystemAuditLogQueryResult;
}

export function AuditLogViewer({ initialData }: AuditLogViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = initialData.page;
  const totalPages = initialData.totalPages;
  const perPage = initialData.perPage;
  const from = initialData.totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, initialData.totalCount);

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", String(newPage));

    startTransition(() => {
      router.push(`/audit-log?${current.toString()}`);
    });
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("DELETE") || action.includes("REVOKE")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (action.includes("UPDATE") || action.includes("ADJUST")) {
      return "bg-primary-soft text-primary border-primary/20";
    }
    if (action.includes("CREATE") || action.includes("RESTORE")) {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("SANCTION") || action.includes("WARN")) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Minimalist Soft Style */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 w-fit">
              <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
              <span>Jejak Audit Terenkripsi &amp; Immutable</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Time04Icon}
                size={24}
                className="text-primary"
              />
              <span>Audit Log Sistem &amp; Mutasi</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Catatan jejak audit tak terbantahkan (*non-repudiation*) untuk
              seluruh mutasi identitas pengguna, sanksi kedisiplinan, izin
              kegiatan, dan hak akses organisasi sesuai mandat UU PDP No.
              27/2022.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 dark:bg-muted/30 px-3.5 py-2 rounded-xl border border-border self-start md:self-auto text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={16}
              className="text-primary shrink-0"
            />
            <span>
              Total Entri:{" "}
              <strong className="text-foreground font-semibold">
                {initialData.totalCount}
              </strong>{" "}
              Log
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-[850px]">
            <TableHeader className="bg-muted/40 dark:bg-muted/20">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 pl-5 w-[160px]">
                  Waktu (WIB)
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 w-[190px]">
                  Aktor Eksekutor
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
                  Tipe Aksi
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
                  Target &amp; Detail Keterangan
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 w-[120px]">
                  IP Address
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 pr-5 text-right w-[150px]">
                  Inspeksi State
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border text-sm">
              {initialData.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-xs text-muted-foreground bg-card"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={28}
                        className="text-muted-foreground/60"
                      />
                      <p className="font-medium text-foreground">
                        Belum ada catatan audit log dalam sistem.
                      </p>
                      <p className="text-[11px]">
                        Setiap aktivitas administratif akan terekam secara
                        otomatis di sini.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                initialData.data.map((log) => {
                  const actorInitials = log.actorName
                    ? log.actorName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "A";

                  return (
                    <TableRow
                      key={log.id}
                      className="transition-colors hover:bg-muted/30 dark:hover:bg-muted/10"
                    >
                      {/* Timestamp */}
                      <TableCell className="pl-5 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap align-top">
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>

                      {/* Actor Info */}
                      <TableCell className="py-3.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7 border border-border shrink-0 shadow-2xs">
                            <AvatarImage
                              src={log.actorAvatarUrl || ""}
                              alt={log.actorName || "Actor"}
                            />
                            <AvatarFallback className="bg-primary-soft text-primary font-bold text-[10px]">
                              {actorInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                              {log.actorName || "Sistem / Anon"}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]">
                              {log.actorRole || log.actorEmail || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Action Type */}
                      <TableCell className="py-3.5 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider whitespace-nowrap ${getActionBadgeVariant(
                            log.actionType,
                          )}`}
                        >
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                      </TableCell>

                      {/* Target & Details */}
                      <TableCell className="py-3.5 align-top">
                        <div className="space-y-1">
                          {log.targetUserName ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px] bg-muted/50 border-border text-foreground font-medium rounded gap-1"
                              >
                                <HugeiconsIcon
                                  icon={UserIcon}
                                  size={11}
                                  className="text-muted-foreground"
                                />
                                <span>Target: {log.targetUserName}</span>
                              </Badge>
                              {log.targetUserRole && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({log.targetUserRole})
                                </span>
                              )}
                            </div>
                          ) : log.targetUserId ? (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Target ID: {log.targetUserId.slice(0, 8)}...
                            </span>
                          ) : null}
                          <p className="text-xs text-foreground font-medium leading-relaxed">
                            {log.details || "-"}
                          </p>
                        </div>
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="py-3.5 align-top text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {log.ipAddress ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 dark:bg-muted/30 border border-border text-[11px]">
                            <HugeiconsIcon
                              icon={ComputerIcon}
                              size={12}
                              className="text-muted-foreground"
                            />
                            <span>{log.ipAddress}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Old/New State JSON Viewer */}
                      <TableCell className="pr-5 py-3.5 text-right align-top">
                        {log.oldValue || log.newValue ? (
                          <details className="text-left text-xs bg-surface/50 dark:bg-muted/30 p-2 rounded-xl border border-border inline-block max-w-xs overflow-x-auto shadow-2xs group">
                            <summary className="cursor-pointer font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 text-[11px]">
                              <HugeiconsIcon icon={FileCodeIcon} size={14} />
                              <span>Diff Data</span>
                            </summary>
                            <div className="mt-2.5 space-y-2 font-mono text-[10px]">
                              {log.oldValue && (
                                <div className="space-y-0.5">
                                  <span className="text-destructive font-bold flex items-center gap-1 text-[10px]">
                                    Semula:
                                  </span>
                                  <pre className="whitespace-pre-wrap overflow-x-auto bg-background/80 p-2 rounded-lg border border-border text-foreground">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue && (
                                <div className="space-y-0.5">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                                    Menjadi:
                                  </span>
                                  <pre className="whitespace-pre-wrap overflow-x-auto bg-background/80 p-2 rounded-lg border border-border text-foreground">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-surface/30 dark:bg-card border-t border-border text-xs text-muted-foreground">
          <span>
            Menampilkan{" "}
            <strong className="text-foreground font-semibold">{from}</strong> –{" "}
            <strong className="text-foreground font-semibold">{to}</strong> dari{" "}
            <strong className="text-foreground font-semibold">
              {initialData.totalCount}
            </strong>{" "}
            entri
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="min-h-[38px] px-3 rounded-lg text-xs border-border bg-background hover:bg-muted"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={14}
                className="mr-1"
              />
              <span>Sebelumnya</span>
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || totalPages === 0}
              className="min-h-[38px] px-3 rounded-lg text-xs border-border bg-background hover:bg-muted"
            >
              <span>Selanjutnya</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                className="ml-1"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
