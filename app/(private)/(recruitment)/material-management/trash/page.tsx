"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  Loader2,
  FileText,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
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
  getDeletedMaterials,
  restoreMaterial,
  permanentDeleteMaterial,
} from "@/lib/firebase/services/material-service";
import { Material, MaterialType } from "@/schemas/materials";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const formatDate = (date: Date | null | undefined | unknown) => {
  if (!date) return "-";
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

const getTypeIcon = (type: MaterialType) => {
  switch (type) {
    case "file":
      return <FileText className="h-4 w-4" />;
    case "link":
      return <LinkIcon className="h-4 w-4" />;
    case "article":
      return <BookOpen className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: MaterialType) => {
  switch (type) {
    case "file":
      return "File";
    case "link":
      return "Link";
    case "article":
      return "Artikel";
    default:
      return type;
  }
};

const getTypeBadgeColor = (type: MaterialType) => {
  switch (type) {
    case "file":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "link":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "article":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function MaterialTrashPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeletedMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeletedMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching deleted materials:", error);
      toast.error("Gagal memuat daftar materi yang dihapus");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedMaterials();
  }, [fetchDeletedMaterials]);

  const handleRestoreClick = (material: Material) => {
    setSelectedMaterial(material);
    setRestoreDialogOpen(true);
  };

  const handleDeleteClick = (material: Material) => {
    setSelectedMaterial(material);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedMaterial) return;

    setIsProcessing(true);
    try {
      await restoreMaterial(selectedMaterial.id);
      toast.success(`Materi "${selectedMaterial.title}" berhasil dipulihkan`);
      fetchDeletedMaterials();
    } catch (error) {
      console.error("Error restoring material:", error);
      toast.error("Gagal memulihkan materi");
    } finally {
      setIsProcessing(false);
      setRestoreDialogOpen(false);
      setSelectedMaterial(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!selectedMaterial) return;

    setIsProcessing(true);
    try {
      await permanentDeleteMaterial(selectedMaterial.id);
      toast.success(
        `Materi "${selectedMaterial.title}" berhasil dihapus permanen`
      );
      fetchDeletedMaterials();
    } catch (error) {
      console.error("Error permanently deleting material:", error);
      toast.error("Gagal menghapus materi secara permanen");
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedMaterial(null);
    }
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
            onClick={() => router.push("/material-management")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Materi yang dihapus dapat dipulihkan atau dihapus secara permanen
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="self-start sm:self-center">
          {materials.length} materi dihapus
        </Badge>
      </div>

      <Separator />

      {/* Empty State */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Trash Kosong</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Tidak ada materi yang dihapus. Materi yang dihapus akan muncul di
            sini dan dapat dipulihkan.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/material-management")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Manajemen Materi
          </Button>
        </div>
      ) : (
        /* Material Cards */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="overflow-hidden border-dashed opacity-80 hover:opacity-100 transition-opacity"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">
                      {material.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {material.description || "Tidak ada deskripsi"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${getTypeBadgeColor(
                      material.type
                    )} border-0`}
                  >
                    <span className="flex items-center gap-1">
                      {getTypeIcon(material.type)}
                      {getTypeLabel(material.type)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Periode: {material.orPeriod || "-"}</span>
                    {material.type === "file" && material.fileName && (
                      <span className="truncate max-w-[150px]">
                        {material.fileName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dihapus: {formatDate(material.deletedAt)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestoreClick(material)}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Pulihkan
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteClick(material)}
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
              <span>Pulihkan Materi</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin memulihkan materi{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedMaterial?.title}&quot;
              </span>
              ? Materi ini akan dikembalikan ke daftar aktif.
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
              Apakah Anda yakin ingin menghapus materi{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedMaterial?.title}&quot;
              </span>{" "}
              secara permanen?
              <br />
              <br />
              <span className="font-semibold text-destructive">
                PERINGATAN:
              </span>{" "}
              Tindakan ini akan menghapus materi beserta{" "}
              <span className="font-bold">file yang terkait</span> (jika ada)
              dan semua log aksesnya. Tindakan ini{" "}
              <span className="font-semibold text-destructive">
                tidak dapat dibatalkan
              </span>
              .
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
