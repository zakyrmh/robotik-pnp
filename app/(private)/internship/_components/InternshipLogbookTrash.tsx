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
  Archive,
  Clock,
  ArrowLeft,
  RotateCcw,
  Trash2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { InternshipLogbookDetailModal } from "./InternshipLogbookDetailModal";
import { internshipService } from "@/lib/firebase/services/internship-service";
import { useAuth } from "@/hooks/useAuth";
import type { InternshipLogbookEntry } from "@/schemas/internship";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InternshipLogbookTrash() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<InternshipLogbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entryToRestore, setEntryToRestore] =
    useState<InternshipLogbookEntry | null>(null);
  const [entryToDelete, setEntryToDelete] =
    useState<InternshipLogbookEntry | null>(null);
  const [selectedEntry, setSelectedEntry] =
    useState<InternshipLogbookEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchDeletedEntries = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await internshipService.getDeletedLogbooks(user.uid);
      // Sort by deletedAt desc (most recent first)
      data.sort((a, b) => {
        const aTime = a.deletedAt?.getTime() || 0;
        const bTime = b.deletedAt?.getTime() || 0;
        return bTime - aTime;
      });
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch deleted logbooks:", error);
      toast.error("Gagal memuat logbook yang dihapus");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeletedEntries();
  }, [fetchDeletedEntries]);

  const handleRestore = (entry: InternshipLogbookEntry) => {
    setEntryToRestore(entry);
  };

  const confirmRestore = async () => {
    if (!user || !entryToRestore?.id) return;

    try {
      await internshipService.restoreLogbook(entryToRestore.id);
      toast.success("Logbook berhasil dipulihkan");
      fetchDeletedEntries();
    } catch {
      toast.error("Gagal memulihkan logbook");
    } finally {
      setEntryToRestore(null);
    }
  };

  const handlePermanentDelete = (entry: InternshipLogbookEntry) => {
    setEntryToDelete(entry);
  };

  const confirmPermanentDelete = async () => {
    if (!user || !entryToDelete?.id) return;

    try {
      await internshipService.hardDeleteLogbook(
        entryToDelete.id,
        entryToDelete.documentationUrls || [],
      );
      toast.success("Logbook dihapus permanen");
      fetchDeletedEntries();
    } catch {
      toast.error("Gagal menghapus logbook");
    } finally {
      setEntryToDelete(null);
    }
  };

  const openDetailModal = (entry: InternshipLogbookEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/internship">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </a>
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-8 w-8" />
            Sampah Logbook
          </h2>
          <p className="text-sm text-muted-foreground">
            Logbook yang dihapus akan disimpan di sini. Anda bisa memulihkan
            atau menghapus permanen.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dihapus</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              Logbook dalam sampah
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Logbook yang Dihapus</h3>

        {isLoading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : entries.length === 0 ? (
          <Card className="min-h-[300px] flex items-center justify-center border-dashed">
            <div className="text-center text-muted-foreground">
              <Archive className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <h3 className="text-lg font-medium">Sampah kosong</h3>
              <p>Tidak ada logbook yang dihapus.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700"
                onClick={() => openDetailModal(entry)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-2 bg-orange-500" />
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {entry.activityType}
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-300"
                            >
                              Dihapus
                            </Badge>
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(entry.date, "PPP", { locale: localeId })}
                            </span>
                            <span>•</span>
                            <span>{entry.duration} Menit</span>
                            <span>•</span>
                            <span>{entry.targetDivision}</span>
                          </div>
                          {entry.deletedAt && (
                            <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              Dihapus:{" "}
                              {format(entry.deletedAt, "PPP 'pukul' HH:mm", {
                                locale: localeId,
                              })}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            entry.status === "submitted" &&
                              "bg-blue-600 hover:bg-blue-700",
                            entry.status === "approved" &&
                              "bg-green-600 hover:bg-green-700",
                            entry.status === "draft" && "border-slate-300",
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

                      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 line-clamp-2">
                        <p>{entry.activity}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          {entry.documentationUrls?.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="w-3 h-3" />
                              {entry.documentationUrls.length} Foto
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePermanentDelete(entry);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Permanen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(entry);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Pulihkan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InternshipLogbookDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        entry={selectedEntry}
      />

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!entryToRestore}
        onOpenChange={(open) => !open && setEntryToRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan Logbook?</AlertDialogTitle>
            <AlertDialogDescription>
              Logbook akan dikembalikan ke daftar utama dan bisa diedit kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-green-600 hover:bg-green-700"
            >
              Pulihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-red-600">Peringatan:</span>{" "}
              Tindakan ini tidak dapat dibatalkan! Data logbook dan semua file
              dokumentasi akan dihapus permanen dari database dan storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
