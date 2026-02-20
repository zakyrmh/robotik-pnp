"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Clock,
  Plus,
  FileText,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react";
import { InternshipLogbookModal } from "./InternshipLogbookModal";
import { InternshipLogbookDetailModal } from "./InternshipLogbookDetailModal";
import { internshipService } from "@/lib/firebase/services/internship-service";
import { useAuth } from "@/hooks/useAuth";
import type {
  InternshipLogbookEntry,
  RollingInternshipRegistration,
  DepartmentInternshipRegistration,
} from "@/schemas/internship";
import {
  getInternshipTypeDisplayName,
  getDivisionDisplayName,
} from "@/schemas/internship";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InternshipLogbook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<InternshipLogbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<
    InternshipLogbookEntry | undefined
  >(undefined);
  const [entryToDelete, setEntryToDelete] =
    useState<InternshipLogbookEntry | null>(null);
  const [selectedEntry, setSelectedEntry] =
    useState<InternshipLogbookEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<{
    rolling: RollingInternshipRegistration | null;
    department: DepartmentInternshipRegistration | null;
  } | null>(null);
  const [isLoadingRegs, setIsLoadingRegs] = useState(true);

  const fetchEntries = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await internshipService.getLogbookEntries(user.uid);
      // Sort by date desc
      data.sort((a, b) => b.date.getTime() - a.date.getTime());
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch logbook:", error);
      toast.error("Gagal memuat logbook");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();

    // Fetch registration data for auto-population
    if (user) {
      setIsLoadingRegs(true);
      internshipService
        .checkRegistrationStatus(user.uid)
        .then((result) => {
          setRegistrations({
            rolling: result.rollingData,
            department: result.departmentData,
          });
        })
        .catch((err) => console.error("Failed to fetch reg status:", err))
        .finally(() => setIsLoadingRegs(false));
    }
  }, [fetchEntries, user]);

  const handleAddEntry = async (data: InternshipLogbookEntry) => {
    if (!user) return;
    try {
      if (editingEntry && data.id) {
        // Update existing logbook entry
        await internshipService.updateLogbookEntry(data);
      } else {
        // Create new logbook entry
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...entryData } = data;
        await internshipService.addLogbookEntry(entryData);
      }
      toast.success(
        editingEntry ? "Logbook diperbarui" : "Logbook berhasil ditambahkan",
      );
      fetchEntries();
      setIsModalOpen(false);
      setEditingEntry(undefined);
    } catch {
      toast.error("Gagal menyimpan logbook");
    }
  };

  const handleDeleteEntry = (entry: InternshipLogbookEntry) => {
    setEntryToDelete(entry);
  };

  const confirmDelete = async () => {
    if (!user || !entryToDelete?.id) return;

    try {
      await internshipService.softDeleteLogbook(entryToDelete.id);
      toast.success("Logbook dipindahkan ke sampah");
      fetchEntries();
    } catch {
      toast.error("Gagal memindahkan logbook");
    } finally {
      setEntryToDelete(null);
    }
  };

  const openNewModal = () => {
    setEditingEntry(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: InternshipLogbookEntry) => {
    if (entry.status !== "draft") {
      toast.error("Logbook yang sudah dikirim tidak dapat diedit");
      return;
    }
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const openDetailModal = (entry: InternshipLogbookEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  // derived stats
  const totalEntries = entries.length;
  const totalDurationMinutes = entries.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0,
  );
  const totalHours = (totalDurationMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Logbook Magang</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/internship/trash">
              <Archive className="mr-2 h-4 w-4" />
              Sampah
            </a>
          </Button>
          <Button onClick={openNewModal} disabled={isLoadingRegs}>
            {isLoadingRegs ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Tambah Log Harian
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Log</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              Entri logbook yang sudah diisi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Durasi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours} Jam</div>
            <p className="text-xs text-muted-foreground">
              Total waktu magang tercatat
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Riwayat Aktivitas</h3>

        {isLoading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : entries.length === 0 ? (
          <Card className="min-h-[300px] flex items-center justify-center border-dashed">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <h3 className="text-lg font-medium">Belum ada aktivitas</h3>
              <p>Mulai catat kegiatan magang kamu hari ini.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
                onClick={() => openDetailModal(entry)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div
                      className={cn(
                        "w-full md:w-2 bg-slate-100 dark:bg-slate-800",
                        entry.status === "approved" && "bg-green-500",
                        entry.status === "submitted" && "bg-blue-500",
                        entry.status === "rejected" && "bg-red-500",
                        entry.status === "draft" && "bg-slate-300",
                      )}
                    />
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {entry.activityType}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(entry.date, "PPP", { locale: localeId })}
                            </span>
                            <span>•</span>
                            <span>{entry.duration} Menit</span>
                            <span>•</span>
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 h-5 text-[10px] font-normal"
                            >
                              {getInternshipTypeDisplayName(
                                entry.internshipType,
                              )}
                            </Badge>
                            <span>•</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {getDivisionDisplayName(
                                entry.internshipType,
                                entry.targetDivision,
                              )}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            entry.status === "draft" ? "outline" : "default"
                          }
                          className={cn(
                            entry.status === "submitted" &&
                              "bg-blue-600 hover:bg-blue-700",
                            entry.status === "approved" &&
                              "bg-green-600 hover:bg-green-700",
                            // Keep draft as default/outline
                          )}
                        >
                          {entry.status === "submitted"
                            ? "Terkirim"
                            : entry.status === "approved"
                              ? "Disetujui"
                              : entry.status === "rejected"
                                ? "Ditolak"
                                : "Draft"}
                        </Badge>
                      </div>

                      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300">
                        <p>{entry.activity}</p>
                      </div>

                      {entry.outcome && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md text-sm">
                          <span className="font-medium">Capaian:</span>{" "}
                          {entry.outcome}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                          {entry.documentationUrls?.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="w-3 h-3" />
                              {entry.documentationUrls.length} Foto
                            </Badge>
                          )}
                        </div>

                        {entry.status === "draft" && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(entry);
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Draft
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InternshipLogbookModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddEntry}
        defaultValues={editingEntry}
        isEditing={!!editingEntry}
        registrations={registrations}
      />

      <InternshipLogbookDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        entry={selectedEntry}
      />

      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pindahkan ke Sampah?</AlertDialogTitle>
            <AlertDialogDescription>
              Logbook draft akan dipindahkan ke sampah. Anda masih bisa
              memulihkannya nanti dari halaman Sampah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Pindahkan ke Sampah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
