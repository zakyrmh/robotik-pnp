"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskDialog from "@/components/tasks/admin/task-dialog";
import { getTasks } from "@/lib/firebase/tasks";
import { getActivities } from "@/lib/firebase/activities";
import { Task } from "@/types/tasks";
import { Activity } from "@/types/activities";
import { TaskType } from "@/types/enum";
import { format, endOfDay, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.INDIVIDUAL]: "Individual",
  [TaskType.GROUP]: "Kelompok",
};

const formatDeadline = (value?: Timestamp) => {
  if (!value) {
    return "-";
  }

  try {
    return format(value.toDate(), "dd MMM yyyy HH:mm", { locale: localeId });
  } catch {
    return "-";
  }
};

const TaskGradeManagementPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks", error);
      toast.error("Gagal memuat daftar tugas");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true);
        const data = await getActivities({ status: "all" });
        setActivities(data);
      } catch (error) {
        console.error("Failed to load activities", error);
        toast.error("Gagal memuat daftar aktivitas");
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const filteredTasks = useMemo(() => {
    const titleFilterValue = titleFilter.toLowerCase().trim();
    const searchValue = searchQuery.toLowerCase().trim();
    const fromDate = deadlineFrom ? startOfDay(new Date(deadlineFrom)) : null;
    const toDate = deadlineTo ? endOfDay(new Date(deadlineTo)) : null;

    return tasks.filter((task) => {
      const deadlineDate = task.deadline ? task.deadline.toDate() : null;
      const matchesSearch =
        !searchValue ||
        [
          task.title,
          task.description ?? "",
          task.instructions ?? "",
          task.orPeriod ?? "",
          task.type ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchValue);

      const matchesTitle =
        !titleFilterValue ||
        task.title.toLowerCase().includes(titleFilterValue);

      const matchesType =
        typeFilter === "all" || task.type === typeFilter;

      const matchesDeadline = (() => {
        if (!fromDate && !toDate) return true;
        if (!deadlineDate) return false;
        if (fromDate && deadlineDate < fromDate) return false;
        if (toDate && deadlineDate > toDate) return false;
        return true;
      })();

      return matchesSearch && matchesTitle && matchesType && matchesDeadline;
    });
  }, [tasks, searchQuery, titleFilter, typeFilter, deadlineFrom, deadlineTo]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTasks();
  };

  const handleResetFilters = () => {
    setTitleFilter("");
    setTypeFilter("all");
    setDeadlineFrom("");
    setDeadlineTo("");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900">
            Manajemen Tugas & Nilai
          </h1>
          <p className="mt-2 text-gray-600">
            Pantau seluruh tugas, filter berdasarkan kebutuhan, dan siapkan CRUD
            serta integrasi penilaian pada tahap berikutnya.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4 md:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari tugas berdasarkan judul, deskripsi, instruksi, atau OR period..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              {loading || isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Muat Ulang
            </Button>
            <Button
              className="gap-2"
              onClick={() => setIsCreateOpen(true)}
              disabled={!currentUserId || activitiesLoading}
            >
              <Plus className="h-4 w-4" />
              Tugas Baru
            </Button>
          </div>
        </motion.div>

        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Kolom
              </CardTitle>
              <CardDescription>
                Sesuaikan daftar tugas berdasarkan kolom Title, Type, dan
                Deadline.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              className="self-start"
              onClick={handleResetFilters}
              disabled={
                !titleFilter && typeFilter === "all" && !deadlineFrom && !deadlineTo
              }
            >
              Reset Filter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Title
                </p>
                <Input
                  placeholder="Filter judul"
                  value={titleFilter}
                  onChange={(event) => setTitleFilter(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <Select
                  value={typeFilter}
                  onValueChange={(value) =>
                    setTypeFilter(value as "all" | TaskType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua type</SelectItem>
                    {Object.values(TaskType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {TASK_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Deadline (From)
                </p>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={deadlineFrom}
                    onChange={(event) => setDeadlineFrom(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Deadline (To)
                </p>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={deadlineTo}
                    onChange={(event) => setDeadlineTo(event.target.value)}
                    min={deadlineFrom || undefined}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Tugas</CardTitle>
            <CardDescription>
              {loading
                ? "Sedang memuat data tugas..."
                : `${filteredTasks.length} tugas ditampilkan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="flex animate-pulse items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="h-10 w-2/5 rounded bg-muted" />
                    <div className="h-8 w-1/5 rounded bg-muted" />
                    <div className="h-8 w-1/5 rounded bg-muted" />
                    <div className="h-8 w-16 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                          <p className="text-lg font-semibold">
                            Tidak ada tugas yang cocok
                          </p>
                          <p className="text-sm">
                            Sesuaikan filter atau tambahkan tugas baru pada
                            tahap berikutnya.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {task.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description || "Tidak ada deskripsi"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                OR {task.orPeriod || "-"}
                              </Badge>
                              <Badge
                                variant={task.isScorePublished ? "default" : "outline"}
                              >
                                {task.isScorePublished
                                  ? "Nilai dipublish"
                                  : "Nilai belum dipublish"}
                              </Badge>
                              <Badge
                                variant={task.isPublished ? "default" : "outline"}
                              >
                                {task.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TASK_TYPE_LABELS[task.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {formatDeadline(task.deadline)}
                            </span>
                            {task.deadline && (
                              <span className="text-xs text-muted-foreground">
                                {task.deadline.toDate().toLocaleString("id-ID", {
                                  weekday: "long",
                                })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/task-grade-management/${task.id}`)
                              }
                            >
                              Detail
                            </Button>
                            <Button size="sm" variant="ghost" disabled>
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadTasks}
        currentUserId={currentUserId}
        activities={activities}
      />
    </div>
  );
};

export default TaskGradeManagementPage;

