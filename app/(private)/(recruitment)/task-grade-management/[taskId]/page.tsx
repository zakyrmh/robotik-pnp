"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

// Imports Types & Services
import { Task, TaskSubmission } from "@/types/tasks";
import { User } from "@/types/users";
import { SubmissionType } from "@/types/enum";
import { getTaskById } from "@/lib/firebase/tasks";
import { getTaskSubmissions } from "@/lib/firebase/task-submissions";
import { getUserById, getCandidatesByPeriod } from "@/lib/firebase/users";

// Imports Components
import { TaskHeader } from "@/app/(private)/(recruitment)/task-grade-management/[taskId]/_components/task-header";
import { ObservationTable } from "@/app/(private)/(recruitment)/task-grade-management/[taskId]/_components/observation-table";
import { SubmissionTable } from "@/app/(private)/(recruitment)/task-grade-management/[taskId]/_components/submission-table";
import { useAuth } from "@/hooks/useAuth";

const TaskDetailPage = () => {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params?.taskId;
  const { user: currentUser } = useAuth();

  // --- STATE ---
  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);

  // Data State
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({}); // Untuk mode submission
  const [loadingData, setLoadingData] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // --- 1. FETCH TASK METADATA ---
  useEffect(() => {
    if (!taskId) return;
    const fetchTask = async () => {
      try {
        setLoadingTask(true);
        const data = await getTaskById(taskId);
        if (!data) throw new Error("Tugas tidak ditemukan");
        setTask(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError((err as Error).message);
        }
      } finally {
        setLoadingTask(false);
      }
    };
    fetchTask();
  }, [taskId]);

  // --- 2. FETCH DATA (SUBMISSIONS / CANDIDATES) ---
  useEffect(() => {
    if (!task || !taskId) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const isObservation = task.submissionTypes.includes(
          SubmissionType.NO_INPUT
        );

        // Selalu ambil submission (nilai yang sudah ada)
        const subsData = await getTaskSubmissions({ taskId });
        setSubmissions(subsData);

        if (isObservation) {
          // --- MODE OBSERVASI ---
          // Ambil semua caang aktif
          const allCandidates = await getCandidatesByPeriod(task.orPeriod);
          setCandidates(allCandidates);
        } else {
          // --- MODE SUBMISSION BIASA ---
          // Ambil detail user hanya dari yang sudah submit
          const userIds = Array.from(
            new Set(subsData.map((s) => s.userId).filter(Boolean) as string[])
          );

          if (userIds.length > 0) {
            const userPromises = userIds.map((id) => getUserById(id));
            const responses = await Promise.all(userPromises);

            const map: Record<string, User> = {};
            responses.forEach((res) => {
              if (res.success && res.data) {
                map[res.data.id] = res.data;
              }
            });
            setUserMap(map);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data peserta");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [task, taskId]);

  // --- RENDERING ---
  if (loadingTask) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const isObservationMode = task.submissionTypes.includes(
    SubmissionType.NO_INPUT
  );

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push("/task-grade-management")}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </Button>
        </div>

        {/* Task Details Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TaskHeader task={task} />
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {isObservationMode
                  ? "Lembar Penilaian (Observasi)"
                  : "Daftar Pengumpulan Tugas"}
              </CardTitle>
              <CardDescription>
                {isObservationMode
                  ? "Input nilai secara langsung untuk setiap Caang. Nilai tersimpan otomatis saat Anda berpindah kolom."
                  : "Daftar peserta yang telah mengumpulkan tugas. Klik file untuk memeriksa."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Memuat data peserta...</p>
                </div>
              ) : (
                <>
                  {isObservationMode ? (
                    <ObservationTable
                      taskId={taskId!}
                      adminId={currentUser?.uid || "admin"}
                      candidates={candidates}
                      submissions={submissions}
                    />
                  ) : submissions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                      Belum ada yang mengumpulkan tugas ini.
                    </div>
                  ) : (
                    <SubmissionTable
                      submissions={submissions}
                      userMap={userMap}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
