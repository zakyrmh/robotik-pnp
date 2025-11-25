"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, ClipboardList, Users } from "lucide-react";
import { Task, TaskSubmission } from "@/types/tasks";
import { User } from "@/types/users";
import { getTaskById } from "@/lib/firebase/tasks";
import { getTaskSubmissions } from "@/lib/firebase/task-submissions";
import { getUserById } from "@/lib/firebase/users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

const formatDateTime = (value?: Date) => {
  if (!value) return "-";
  return format(value, "dd MMM yyyy HH:mm", { locale: localeId });
};

const TaskDetailPage = () => {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params?.taskId;

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      try {
        setLoadingTask(true);
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          setError("Tugas tidak ditemukan");
          return;
        }
        setTask(taskData);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat detail tugas");
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        const submissionData = await getTaskSubmissions({ taskId });
        setSubmissions(submissionData);

        const uniqueUserIds = Array.from(
          new Set(
            submissionData
              .map((submission) => submission.userId)
              .filter((id): id is string => Boolean(id))
          )
        );

        if (uniqueUserIds.length === 0) {
          setUserMap({});
          return;
        }

        const usersEntries = await Promise.all(
          uniqueUserIds.map(async (id) => {
            const result = await getUserById(id);
            if (result.success && result.data) {
              return [id, result.data] as const;
            }
            return null;
          })
        );

        const users: Record<string, User> = {};
        usersEntries.forEach((entry) => {
          if (!entry) return;
          const [id, data] = entry;
          users[id] = data;
        });

        setUserMap(users);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data CAANG");
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [taskId]);

  const tableRows = useMemo(() => {
    return submissions.map((submission) => {
      const user = submission.userId ? userMap[submission.userId] : null;
      const fullName = user?.profile.fullName ?? "Tidak diketahui";
      const nim = user?.profile.nim ?? "-";
      const score =
        typeof submission.score === "number"
          ? submission.score.toFixed(2)
          : submission.score ?? "-";

      return {
        id: submission.id,
        fullName,
        nim,
        score,
      };
    });
  }, [submissions, userMap]);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.push("/task-grade-management")}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="py-8 text-center text-red-500">
              {error}
            </CardContent>
          </Card>
        )}

        {!error && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {loadingTask ? "Memuat detail tugas..." : task?.title}
                  </CardTitle>
                  {task && (
                    <CardDescription className="space-y-2">
                      <p>{task.description}</p>
                      {task.instructions && (
                        <p className="text-sm text-muted-foreground">
                          {task.instructions}
                        </p>
                      )}
                    </CardDescription>
                  )}
                </CardHeader>
                {task && (
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          OR Period
                        </p>
                        <p className="font-semibold">{task.orPeriod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tipe</p>
                        <p className="font-semibold">
                          {task.type === "group" ? "Kelompok" : "Individual"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Deadline
                        </p>
                        <p className="font-semibold">
                          {formatDateTime(task.deadline.toDate())}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={task.isPublished ? "default" : "outline"}
                          >
                            {task.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Badge
                            variant={task.isVisible ? "default" : "outline"}
                          >
                            {task.isVisible ? "Terlihat" : "Disembunyikan"}
                          </Badge>
                          <Badge
                            variant={
                              task.isScorePublished ? "default" : "outline"
                            }
                          >
                            {task.isScorePublished
                              ? "Nilai dipublish"
                              : "Nilai belum dipublish"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Data CAANG</CardTitle>
                  <CardDescription>
                    Daftar peserta serta nilai yang terkait dengan tugas ini.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSubmissions ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex animate-pulse items-center gap-4 rounded-lg border p-4"
                        >
                          <div className="h-6 w-1/3 rounded bg-muted" />
                          <div className="h-6 w-24 rounded bg-muted" />
                          <div className="h-6 w-20 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      Belum ada submission untuk tugas ini.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIM</TableHead>
                          <TableHead>Nilai</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.fullName}</TableCell>
                            <TableCell>{row.nim}</TableCell>
                            <TableCell>{row.score}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toast.info("Fitur detail submission segera hadir")
                                }
                              >
                                Lihat
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailPage;

