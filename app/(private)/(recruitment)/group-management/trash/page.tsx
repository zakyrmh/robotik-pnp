"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

import {
  getDeletedGroupParents,
  restoreGroupParent,
  permanentDeleteGroupParent,
} from "@/lib/firebase/services/group-service";
import { GroupParent } from "@/schemas/groups";

export default function GroupTrashPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<
    (GroupParent & { deletedByName?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupParent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeletedGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeletedGroupParents();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching deleted groups:", error);
      toast.error("Gagal memuat daftar kelompok yang dihapus");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedGroups();
  }, [fetchDeletedGroups]);

  const handleRestoreClick = (group: GroupParent) => {
    setSelectedGroup(group);
    setRestoreDialogOpen(true);
  };

  const handleDeleteClick = (group: GroupParent) => {
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedGroup) return;

    setIsProcessing(true);
    try {
      await restoreGroupParent(selectedGroup.id);
      toast.success(`Kelompok "${selectedGroup.name}" berhasil dipulihkan`);
      fetchDeletedGroups();
    } catch (error) {
      console.error("Error restoring group:", error);
      toast.error("Gagal memulihkan kelompok");
    } finally {
      setIsProcessing(false);
      setRestoreDialogOpen(false);
      setSelectedGroup(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!selectedGroup) return;

    setIsProcessing(true);
    try {
      await permanentDeleteGroupParent(selectedGroup.id);
      toast.success(
        `Kelompok "${selectedGroup.name}" berhasil dihapus permanen`
      );
      fetchDeletedGroups();
    } catch (error) {
      console.error("Error permanently deleting group:", error);
      toast.error("Gagal menghapus kelompok secara permanen");
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
    }
  };

  const formatDate = (date: Date | null | undefined | unknown) => {
    if (!date) return "-";
    // Handle Firebase Timestamp or standard Date
    let d: Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((date as any).toDate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d = (date as any).toDate();
    } else {
      d = new Date(date as string | number | Date);
    }
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <Separator />

        {/* Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/group-management")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Kelompok yang dihapus dapat dipulihkan atau dihapus secara
              permanen
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="self-start sm:self-center">
          {groups.length} kelompok dihapus
        </Badge>
      </div>

      <Separator />

      {/* Empty State */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Trash Kosong</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Tidak ada kelompok yang dihapus. Kelompok yang dihapus akan muncul
            di sini dan dapat dipulihkan.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/group-management")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Manajemen Kelompok
          </Button>
        </div>
      ) : (
        /* Group Cards */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="overflow-hidden border-dashed opacity-80 hover:opacity-100 transition-opacity"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">
                      {group.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.description || "Tidak ada deskripsi"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {group.orPeriod}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Sub-Groups: {group.totalSubGroups}</span>
                    <span>Total Members: {group.totalMembers}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dihapus: {formatDate(group.deletedAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dihapus oleh: {group.deletedByName || "-"}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestoreClick(group)}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Pulihkan
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteClick(group)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Hapus Permanen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <span>Pulihkan Kelompok</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin memulihkan kelompok{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedGroup?.name}&quot;
              </span>
              ? Kelompok ini akan dikembalikan ke daftar aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memulihkan...
                </>
              ) : (
                "Ya, Pulihkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <span>Hapus Permanen</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus kelompok{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedGroup?.name}&quot;
              </span>{" "}
              secara permanen?
              <br />
              <br />
              <span className="font-semibold text-destructive">
                PERINGATAN:
              </span>{" "}
              Tindakan ini juga akan menghapus seluruh{" "}
              <span className="font-bold">sub-group</span> yang ada di dalamnya
              dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
