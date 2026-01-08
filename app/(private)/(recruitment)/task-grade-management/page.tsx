"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  getTasks,
  getTaskOrPeriods,
  deleteTask,
  TaskFilters,
} from "@/lib/firebase/services/task-service";
import { Task } from "@/schemas/tasks";
import { useAuth } from "@/hooks/useAuth";

import { TaskList } from "./_components/task-list";
import { TaskFilterBar, FilterState } from "./_components/task-filters";
import { TaskFormModal } from "./_components/task-form-modal";

export default function TaskManagementPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [orPeriods, setOrPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    taskType: "all",
    status: "all",
    orPeriod: "all", // "all" represents no filter
  });

  // Fetch OR Periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const periods = await getTaskOrPeriods();
        setOrPeriods(periods);
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };
    fetchPeriods();
  }, []);

  // Fetch Tasks when filters (except query) change
  const fetchTasksData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Prepare backend filters
      const backendFilters: TaskFilters = {
        taskType: filters.taskType,
        status: filters.status,
        orPeriod: filters.orPeriod,
      };

      const data = await getTasks(backendFilters);

      // Apply search query locally
      let filteredData = data;
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredData = data.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            (t.description || "").toLowerCase().includes(lowerQuery)
        );
      }

      setTasks(filteredData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Gagal memuat daftar tugas");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  // Dependency on filters means any change triggers fetch.
  // Optimally we'd separate query filtering, but simple enough for now.

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  // Handlers
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete || !user?.uid) return;

    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id, user.uid);
      toast.success("Tugas berhasil dihapus");
      fetchTasksData(); // Refresh list
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Gagal menghapus tugas");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleCreate = () => {
    setSelectedTask(null); // Reset for create mode
    setIsModalOpen(true);
  };

  const handleGrade = (task: Task) => {
    router.push(`/task-grade-management/${task.id}`);
  };

  const handleModalSuccess = () => {
    fetchTasksData();
    // Refresh periods if it was a new task (might have new period)
    getTaskOrPeriods().then(setOrPeriods);
  };

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Tugas</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tugas dan aktivitas rekrutmen untuk peserta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/task-grade-management/trash")}
            className="shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
          <Button onClick={handleCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Tugas
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters and Actions */}
      <div className="space-y-4">
        <TaskFilterBar
          filters={filters}
          onFilterChange={setFilters}
          orPeriods={orPeriods}
        />

        {/* Task Grid */}
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGrade={handleGrade}
        />
      </div>

      <TaskFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask}
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
              <span>Hapus Tugas</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-foreground">
                &quot;{taskToDelete?.title}&quot;
              </span>
              ? Tugas ini akan disembunyikan dari daftar tetapi data tidak akan
              dihapus secara permanen.
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
                "Ya, Hapus Tugas"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
