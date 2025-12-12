"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  FileText,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getMaterials } from "@/lib/firebase/materials";
import { getActivities } from "@/lib/firebase/activities";
import { Material } from "@/types/materials";
import { Activity } from "@/types/activities";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import MaterialDialog from "@/app/(private)/(recruitment)/material-management/_components/material-dialog";
import MaterialDetailDialog from "@/app/(private)/(recruitment)/material-management/_components/material-detail-dialog";
import DeleteMaterialDialog from "@/app/(private)/(recruitment)/material-management/_components/delete-material-dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";
import { TrainingCategory } from "@/types/enum";

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterOrPeriod, setFilterOrPeriod] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const router = useRouter();

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load activities for filter
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getActivities({ status: "all" });
        setActivities(data);
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };
    loadActivities();
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const filters: {
        activityId?: string;
        orPeriod?: string;
        category?: string;
      } = {};

      if (filterActivity !== "all") filters.activityId = filterActivity;
      if (filterOrPeriod !== "all") filters.orPeriod = filterOrPeriod;
      if (filterCategory !== "all") filters.category = filterCategory as TrainingCategory;

      const data = await getMaterials(filters);
      setMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  }, [filterActivity, filterOrPeriod, filterCategory]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const filteredMaterials = materials.filter((material) =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "elektronika":
        return "Elektronika";
      case "mekanik":
        return "Mekanik";
      case "pemrograman":
        return "Pemrograman";
      default:
        return category;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "📊";
    if (fileType.includes("image")) return "🖼️";
    return "📁";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Get unique OR periods from materials
  const orPeriods = Array.from(new Set(materials.map((m) => m.orPeriod)));

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Manajemen Materi Pembelajaran
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola semua materi pembelajaran untuk calon anggota UKM Robotik
          </p>
        </motion.div>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Activity */}
            <Select value={filterActivity} onValueChange={setFilterActivity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aktivitas</SelectItem>
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter OR Period */}
            <Select value={filterOrPeriod} onValueChange={setFilterOrPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua OR Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua OR Period</SelectItem>
                {orPeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Category */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {Object.values(TrainingCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/material-management/trash")}
                className="gap-2 border-dashed"
              >
                <Trash2 className="w-4 h-4" />
                Sampah
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Upload Materi
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="hover:shadow-lg transition-shadow group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">
                            {getFileIcon(material.fileType)}
                          </span>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {material.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 dark:text-gray-400">
                              {material.description || "Tidak ada deskripsi"}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMaterial(material);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMaterial(material);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMaterial(material);
                                setIsDeleteOpen(true);
                              }}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Category & Access Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant="outline"
                          className={`gap-1 ${material.isPublic
                            ? "text-green-600 border-green-600"
                            : "text-orange-600 border-orange-600"
                            }`}
                        >
                          {material.isPublic ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {/* File Info */}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <FileText className="w-4 h-4" />
                          <span>
                            {material.fileName} (
                            {formatFileSize(material.fileSize)})
                          </span>
                        </div>

                        {/* Download Count */}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Download className="w-4 h-4" />
                          <span>{material.downloadCount || 0} unduhan</span>
                        </div>

                        {/* OR Period Badge */}
                        <Badge variant="secondary" className="mt-2">
                          {material.orPeriod}
                        </Badge>

                        {/* Created Date */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Diupload:{" "}
                          {material.createdAt
                            ? format(
                              material.createdAt instanceof Date
                                ? material.createdAt
                                : material.createdAt.toDate(),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )
                            : "-"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && filteredMaterials.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Tidak ada materi
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Tidak ditemukan materi yang sesuai dengan pencarian"
                : "Belum ada materi yang diupload"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Upload Materi Pertama
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <MaterialDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadMaterials}
        currentUserId={currentUserId}
        activities={activities}
      />

      {selectedMaterial && (
        <>
          <MaterialDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            material={selectedMaterial}
            onSuccess={loadMaterials}
            currentUserId={currentUserId}
            activities={activities}
          />

          <MaterialDetailDialog
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            material={selectedMaterial}
            activities={activities}
          />

          <DeleteMaterialDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            material={selectedMaterial}
            onSuccess={loadMaterials}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}
