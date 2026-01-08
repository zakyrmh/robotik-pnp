"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Search,
  X,
  FileText,
  Link as LinkIcon,
  BookOpen,
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  MessageSquareDashed,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  getMaterials,
  getMaterialOrPeriods,
  deleteMaterial,
  toggleMaterialVisibility,
  MaterialFilters,
} from "@/lib/firebase/services/material-service";
import { Material, MaterialType } from "@/schemas/materials";
import { useAuth } from "@/hooks/useAuth";
import { MaterialFormModal } from "./_components/material-form-modal";

// =========================================================
// TYPES
// =========================================================

interface FilterState extends MaterialFilters {
  query: string;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
// SUB-COMPONENTS
// =========================================================

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onToggleVisibility: (material: Material) => void;
  onView: (material: Material) => void;
}

function MaterialCard({
  material,
  onEdit,
  onDelete,
  onToggleVisibility,
  onView,
}: MaterialCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow dark:bg-slate-950/50">
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                {material.orPeriod || "General"}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs font-normal ${getTypeBadgeColor(
                  material.type
                )} border-0`}
              >
                <span className="flex items-center gap-1">
                  {getTypeIcon(material.type)}
                  {getTypeLabel(material.type)}
                </span>
              </Badge>
              {!material.isVisible && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0"
                >
                  Hidden
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl line-clamp-2">
              {material.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(material)}>
                {material.type === "file" ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                ) : material.type === "link" ? (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buka Link
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Artikel
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(material)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleVisibility(material)}>
                {material.isVisible ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Tampilkan
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(material)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
          {material.description || "Tidak ada deskripsi"}
        </p>

        <div className="space-y-2 text-sm">
          {material.type === "file" && (
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <FileText className="mr-2 h-4 w-4 text-slate-400" />
              <span className="truncate">{material.fileName || "File"}</span>
              {material.fileSize && (
                <span className="ml-auto text-xs text-slate-400">
                  {formatFileSize(material.fileSize)}
                </span>
              )}
            </div>
          )}

          {material.type === "link" && material.externalUrl && (
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <LinkIcon className="mr-2 h-4 w-4 text-slate-400" />
              <span className="truncate text-xs">{material.externalUrl}</span>
            </div>
          )}

          {material.type === "article" && (
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
              <span>
                {(material.articleContent?.length || 0) > 0
                  ? `${material.articleContent?.length || 0} karakter`
                  : "Kosong"}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex justify-between items-center w-full text-xs text-slate-500">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {material.viewCount}
            </span>
            {material.type === "file" && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {material.downloadCount}
              </span>
            )}
          </span>
          <span>{formatDate(material.createdAt)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

interface MaterialListProps {
  materials: Material[];
  isLoading: boolean;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onToggleVisibility: (material: Material) => void;
  onView: (material: Material) => void;
}

function MaterialList({
  materials,
  isLoading,
  onEdit,
  onDelete,
  onToggleVisibility,
  onView,
}: MaterialListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[200px] rounded-xl border bg-card text-card-foreground shadow animate-pulse p-6"
          >
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
            <div className="mt-8 h-4 bg-muted rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
        <div className="bg-slate-100 p-3 rounded-full dark:bg-slate-800 mb-4">
          <MessageSquareDashed className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Belum ada materi
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4 dark:text-slate-400">
          Tidak ada materi yang cocok dengan filter yang Anda gunakan. Coba ubah
          filter atau buat materi baru.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
          onView={onView}
        />
      ))}
    </div>
  );
}

interface MaterialFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  orPeriods: string[];
  className?: string;
}

function MaterialFilterBar({
  filters,
  onFilterChange,
  orPeriods,
  className,
}: MaterialFilterBarProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, query: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      type: value === "all" ? "all" : (value as MaterialType),
    });
  };

  const handleVisibilityChange = (value: string) => {
    onFilterChange({
      ...filters,
      isVisible: value as "all" | "visible" | "hidden",
    });
  };

  const handlePeriodChange = (value: string) => {
    onFilterChange({
      ...filters,
      orPeriod: value === "all" ? undefined : value,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      query: "",
      type: "all",
      isVisible: "all",
      orPeriod: "all",
    });
  };

  const hasActiveFilters =
    filters.query ||
    filters.type !== "all" ||
    filters.isVisible !== "all" ||
    (filters.orPeriod && filters.orPeriod !== "all");

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center ${className}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari materi..."
          value={filters.query}
          onChange={handleQueryChange}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        <Select
          value={filters.orPeriod || "all"}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua OR</SelectItem>
            {orPeriods.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="article">Artikel</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.isVisible || "all"}
          onValueChange={handleVisibilityChange}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            className="shrink-0"
            title="Reset Filter"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function MaterialManagementPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [orPeriods, setOrPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    type: "all",
    isVisible: "all",
    orPeriod: "all",
  });

  // Fetch OR Periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const periods = await getMaterialOrPeriods();
        setOrPeriods(periods);
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };
    fetchPeriods();
  }, []);

  // Fetch Materials when filters change
  const fetchMaterialsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Prepare backend filters
      const backendFilters: MaterialFilters = {
        type: filters.type,
        isVisible: filters.isVisible,
        orPeriod: filters.orPeriod,
      };

      const data = await getMaterials(backendFilters);

      // Apply search query locally
      let filteredData = data;
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredData = data.filter(
          (m) =>
            m.title.toLowerCase().includes(lowerQuery) ||
            (m.description || "").toLowerCase().includes(lowerQuery) ||
            (m.fileName || "").toLowerCase().includes(lowerQuery)
        );
      }

      setMaterials(filteredData);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Gagal memuat daftar materi");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMaterialsData();
  }, [fetchMaterialsData]);

  // Handlers
  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const handleDelete = (material: Material) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete || !user?.uid) return;

    setIsDeleting(true);
    try {
      await deleteMaterial(materialToDelete.id, user.uid);
      toast.success("Materi berhasil dihapus");
      fetchMaterialsData();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Gagal menghapus materi");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  const handleCreate = () => {
    setSelectedMaterial(null);
    setIsModalOpen(true);
  };

  const handleToggleVisibility = async (material: Material) => {
    try {
      await toggleMaterialVisibility(material.id, !material.isVisible);
      toast.success(
        material.isVisible ? "Materi disembunyikan" : "Materi ditampilkan"
      );
      fetchMaterialsData();
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Gagal mengubah visibility");
    }
  };

  const handleView = (material: Material) => {
    if (material.type === "file" && material.fileUrl) {
      // Open file URL in new tab for download
      window.open(material.fileUrl, "_blank");
    } else if (material.type === "link" && material.externalUrl) {
      // Open external link
      window.open(material.externalUrl, "_blank");
    } else if (material.type === "article") {
      // Navigate to article view page
      router.push(`/material-management/${material.id}`);
    }
  };

  const handleModalSuccess = () => {
    fetchMaterialsData();
    // Refresh periods if it was a new material (might have new period)
    getMaterialOrPeriods().then(setOrPeriods);
  };

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Materi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pustaka materi pembelajaran untuk peserta rekrutmen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/material-management/trash")}
            className="shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
          <Button onClick={handleCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Materi
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters and Actions */}
      <div className="space-y-4">
        <MaterialFilterBar
          filters={filters}
          onFilterChange={setFilters}
          orPeriods={orPeriods}
        />

        {/* Material Grid */}
        <MaterialList
          materials={materials}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          onView={handleView}
        />
      </div>

      {/* Form Modal */}
      <MaterialFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        material={selectedMaterial}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  className="h-5 w-5 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <span>Hapus Materi</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus materi{" "}
              <span className="font-semibold text-foreground">
                &quot;{materialToDelete?.title}&quot;
              </span>
              ? Materi ini akan dipindahkan ke trash dan dapat dipulihkan nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus Materi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
