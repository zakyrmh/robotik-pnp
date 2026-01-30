"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Clock,
  Users,
  User,
  Calendar,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getMaterials,
  logMaterialAccess,
} from "@/lib/firebase/services/material-service";
import { getTasks } from "@/lib/firebase/services/task-service";
import { getRecruitmentSettings } from "@/lib/firebase/services/settings-service";
import { Material, MaterialType } from "@/schemas/materials";
import { Task, TaskType } from "@/schemas/tasks";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const getTaskTypeBadge = (type: TaskType) => {
  switch (type) {
    case "individual":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200"
        >
          <User className="h-3 w-3 mr-1" />
          Individu
        </Badge>
      );
    case "group":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200"
        >
          <Users className="h-3 w-3 mr-1" />
          Kelompok
        </Badge>
      );
  }
};

const isDeadlineSoon = (deadline: Date): boolean => {
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 48; // Within 48 hours
};

const isDeadlinePassed = (deadline: Date): boolean => {
  return new Date() > deadline;
};

// =========================================================
// SUB-COMPONENTS
// =========================================================

interface MaterialCardProps {
  material: Material;
  onView: (material: Material) => void;
}

function MaterialCard({ material, onView }: MaterialCardProps) {
  return (
    <Card
      className="h-full flex flex-col hover:shadow-md transition-all hover:border-primary/30 dark:bg-slate-950/50 group cursor-pointer"
      onClick={() => onView(material)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="secondary"
            className={`text-xs font-normal ${getTypeBadgeColor(material.type)} border-0`}
          >
            <span className="flex items-center gap-1">
              {getTypeIcon(material.type)}
              {getTypeLabel(material.type)}
            </span>
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {material.title}
        </CardTitle>
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
              <span>Baca artikel</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex justify-between items-center w-full">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <Eye className="h-3 w-3" />
            {material.viewCount} views
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary group-hover:bg-primary/10"
          >
            {material.type === "file" ? (
              <>
                <Download className="h-4 w-4 mr-1" />
                Download
              </>
            ) : material.type === "link" ? (
              <>
                <ExternalLink className="h-4 w-4 mr-1" />
                Buka
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Baca
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
}

function TaskCard({ task, onView }: TaskCardProps) {
  const deadlinePassed = isDeadlinePassed(task.deadline);
  const deadlineSoon = isDeadlineSoon(task.deadline);

  return (
    <Card
      className={cn(
        "h-full flex flex-col hover:shadow-md transition-all dark:bg-slate-950/50 group cursor-pointer",
        deadlinePassed
          ? "border-red-200 dark:border-red-800/50 opacity-75"
          : deadlineSoon
            ? "border-amber-300 dark:border-amber-700/50"
            : "hover:border-primary/30",
      )}
      onClick={() => onView(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          {getTaskTypeBadge(task.taskType)}
          {deadlinePassed ? (
            <Badge variant="destructive" className="text-xs">
              Berakhir
            </Badge>
          ) : deadlineSoon ? (
            <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
              Segera Berakhir
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
          {task.description || "Tidak ada deskripsi"}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <span>Deadline:</span>
            <span
              className={cn(
                "ml-auto font-medium",
                deadlinePassed
                  ? "text-red-600 dark:text-red-400"
                  : deadlineSoon
                    ? "text-amber-600 dark:text-amber-400"
                    : "",
              )}
            >
              {formatDateTime(task.deadline)}
            </span>
          </div>
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
            <ClipboardList className="mr-2 h-4 w-4 text-slate-400" />
            <span>Poin Maksimal:</span>
            <span className="ml-auto font-medium">{task.maxPoints}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-primary group-hover:bg-primary/10"
        >
          Lihat Detail
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function LearningPage() {
  const { user } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePeriod, setActivePeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>("all");

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch active period from settings
        const settings = await getRecruitmentSettings();
        const period = settings?.activePeriod || "";
        setActivePeriod(period);

        // Fetch visible materials for this period
        const materialsData = await getMaterials({
          orPeriod: period || undefined,
          isVisible: "visible",
        });
        setMaterials(materialsData);

        // Fetch published tasks for this period
        const tasksData = await getTasks({
          orPeriod: period || undefined,
          status: "published",
        });
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching learning data:", error);
        toast.error("Gagal memuat data pembelajaran");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle material view
  const handleViewMaterial = async (material: Material) => {
    // Log access
    if (user?.uid && activePeriod) {
      const action = material.type === "file" ? "download" : "view";
      await logMaterialAccess(
        material.id,
        user.uid,
        activePeriod,
        action,
        navigator.userAgent,
      );
    }

    // Navigate based on type
    if (material.type === "file" && material.fileUrl) {
      window.open(material.fileUrl, "_blank");
    } else if (material.type === "link" && material.externalUrl) {
      window.open(material.externalUrl, "_blank");
    } else if (material.type === "article") {
      // TODO: Navigate to article detail page
      toast.info("Fitur artikel akan segera hadir");
    }
  };

  // Handle task view
  const handleViewTask = (task: Task) => {
    // TODO: Navigate to task detail/submission page
    toast.info(`Detail tugas: ${task.title}`);
  };

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      materialTypeFilter === "all" || m.type === materialTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filter tasks
  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Separate tasks by deadline status
  const activeTasks = filteredTasks.filter(
    (t) => !isDeadlinePassed(t.deadline),
  );
  const pastTasks = filteredTasks.filter((t) => isDeadlinePassed(t.deadline));

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Materi & Tugas
        </h1>
        <p className="text-sm text-muted-foreground">
          Akses materi pembelajaran dan kerjakan tugas yang diberikan oleh
          panitia
          {activePeriod && (
            <Badge variant="outline" className="ml-2">
              {activePeriod}
            </Badge>
          )}
        </p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="materials" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-2">
            <TabsTrigger value="materials" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Materi
              <Badge variant="secondary" className="ml-1">
                {materials.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Tugas
              <Badge variant="secondary" className="ml-1">
                {tasks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          {/* Material Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={materialTypeFilter}
              onValueChange={setMaterialTypeFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipe Materi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="article">Artikel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMaterials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Belum ada materi
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  {searchQuery
                    ? "Tidak ada materi yang cocok dengan pencarian Anda."
                    : "Materi pembelajaran akan ditampilkan di sini."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onView={handleViewMaterial}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Tugas Aktif</h3>
                <Badge>{activeTasks.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onView={handleViewTask} />
                ))}
              </div>
            </div>
          )}

          {/* Past Tasks */}
          {pastTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-muted-foreground">
                  Tugas Selesai
                </h3>
                <Badge variant="outline">{pastTasks.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 opacity-75">
                {pastTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onView={handleViewTask} />
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
                  <ClipboardList className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Belum ada tugas
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  {searchQuery
                    ? "Tidak ada tugas yang cocok dengan pencarian Anda."
                    : "Tugas yang diberikan panitia akan ditampilkan di sini."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
