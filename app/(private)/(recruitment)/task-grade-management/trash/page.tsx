"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
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
  getDeletedTasks,
  restoreTask,
  permanentDeleteTask,
} from "@/lib/firebase/services/task-service";
import { Task } from "@/schemas/tasks";

export default function TrashPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeletedTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeletedTasks();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching deleted tasks:", error);
      toast.error("Gagal memuat daftar tugas yang dihapus");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedTasks();
  }, [fetchDeletedTasks]);

  const handleRestoreClick = (task: Task) => {
    setSelectedTask(task);
    setRestoreDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedTask) return;

    setIsProcessing(true);
    try {
      await restoreTask(selectedTask.id);
      toast.success(`Tugas "${selectedTask.title}" berhasil dipulihkan`);
      fetchDeletedTasks();
    } catch (error) {
      console.error("Error restoring task:", error);
      toast.error("Gagal memulihkan tugas");
    } finally {
      setIsProcessing(false);
      setRestoreDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!selectedTask) return;

    setIsProcessing(true);
    try {
      await permanentDeleteTask(selectedTask.id);
      toast.success(`Tugas "${selectedTask.title}" berhasil dihapus permanen`);
      fetchDeletedTasks();
    } catch (error) {
      console.error("Error permanently deleting task:", error);
      toast.error("Gagal menghapus tugas secara permanen");
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
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
            onClick={() => router.push("/task-grade-management")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Tugas yang dihapus dapat dipulihkan atau dihapus secara permanen
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="self-start sm:self-center">
          {tasks.length} tugas dihapus
        </Badge>
      </div>

      <Separator />

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Trash Kosong</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Tidak ada tugas yang dihapus. Tugas yang dihapus akan muncul di sini
            dan dapat dipulihkan.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/task-grade-management")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Manajemen Tugas
          </Button>
        </div>
      ) : (
        /* Task Cards */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="overflow-hidden border-dashed opacity-80 hover:opacity-100 transition-opacity"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">
                      {task.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {task.description || "Tidak ada deskripsi"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {task.taskType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Periode: {task.orPeriod || "-"}</span>
                    <span>Maks: {task.maxPoints} poin</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dihapus: {formatDate(task.deletedAt)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestoreClick(task)}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Pulihkan
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteClick(task)}
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
              <span>Pulihkan Tugas</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin memulihkan tugas{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedTask?.title}&quot;
              </span>
              ? Tugas ini akan dikembalikan ke daftar tugas aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
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
              Apakah Anda yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedTask?.title}&quot;
              </span>{" "}
              secara permanen? Tindakan ini{" "}
              <span className="font-semibold text-destructive">
                tidak dapat dibatalkan
              </span>{" "}
              dan semua data tugas akan hilang selamanya.
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
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
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
