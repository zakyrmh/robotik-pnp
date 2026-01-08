"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import { getTaskById } from "@/lib/firebase/services/task-service";
import {
  getAssignmentsByTask,
  gradeAssignment,
} from "@/lib/firebase/services/assignment-service";
// Note: We need a service to get ALL users (candidates) to list them even if they haven't submitted
// I'll use getAllCaangUsers from caang-service
import { getAllCaangUsers } from "@/lib/firebase/services/caang-service";

import { Task } from "@/schemas/tasks";
import { Assignment } from "@/schemas/assignments";

type FilterStatus = "all" | "submitted" | "not_submitted" | "graded";

// Helper type for the table row
interface StudentGradeRow {
  userId: string;
  name: string;
  nim: string;
  avatarUrl?: string; // Optional
  assignment?: Assignment;
  // Local state for editing
  gradeInput: number;
  feedbackInput: string;
  isDirty: boolean;
}

export default function GradeTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [rows, setRows] = useState<StudentGradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Task
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          toast.error("Tugas tidak ditemukan");
          router.push("/task-grade-management");
          return;
        }
        setTask(taskData);

        // 2. Fetch All Candidates (Caang)
        const caangUsers = await getAllCaangUsers();

        // 3. Fetch Assignments
        const assignments = await getAssignmentsByTask(taskId);

        // Debug logging
        console.log("[GradeTaskPage] Assignments fetched:", assignments);
        console.log("[GradeTaskPage] Caang users fetched:", caangUsers.length);

        // 4. Merge Data
        const mergedRows: StudentGradeRow[] = caangUsers.map((caang) => {
          const assignment = assignments.find(
            (a) => a.userId === caang.user.id
          );

          // Debug: log matching
          if (assignment) {
            console.log(
              `[GradeTaskPage] Match found for ${caang.user.profile.fullName}:`,
              {
                caangUserId: caang.user.id,
                assignmentUserId: assignment.userId,
                score: assignment.score,
                feedback: assignment.feedback,
              }
            );
          }

          return {
            userId: caang.user.id,
            name: caang.user.profile.fullName,
            nim: caang.user.profile.nim || "-",
            avatarUrl: caang.user.profile.photoUrl,
            assignment: assignment,
            gradeInput: assignment?.score ?? 0,
            feedbackInput: assignment?.feedback ?? "",
            isDirty: false,
          };
        });

        // Optional filtering by Task Period could happen here if User has Period info
        // For now, we list all Caang.
        // Improvement: Filter mergedArgs if task.orPeriod matches user period (if available)

        setRows(mergedRows.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Error loading grade data:", error);
        toast.error("Gagal memuat data penilaian");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId, router]);

  const handleGradeChange = (userId: string, value: string) => {
    const score = parseFloat(value);
    if (isNaN(score)) return;

    setRows((prev) =>
      prev.map((row) =>
        row.userId === userId
          ? { ...row, gradeInput: score, isDirty: true }
          : row
      )
    );
  };

  const handleFeedbackChange = (userId: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.userId === userId
          ? { ...row, feedbackInput: value, isDirty: true }
          : row
      )
    );
  };

  const handleSaveRow = async (row: StudentGradeRow) => {
    if (!user?.uid) return;
    if (!task) return;

    // Validate score max points
    if (row.gradeInput > task.maxPoints) {
      toast.error(`Nilai tidak boleh melebihi ${task.maxPoints}`);
      return;
    }

    try {
      await gradeAssignment(
        task.id,
        row.userId,
        row.gradeInput,
        row.feedbackInput,
        user.uid
      );

      toast.success(`Nilai untuk ${row.name} tersimpan`);

      // Update row state to clean
      setRows((prev) =>
        prev.map((r) =>
          r.userId === row.userId
            ? {
                ...r,
                isDirty: false,
                assignment: {
                  ...r.assignment!, // This might be creating a new assignment structure if it didn't exist, strictly speaking we should re-fetch or construct full object.
                  // But for UI "dirty" state clearing, this is enough.
                  // To be safe, we might just re-fetch properly or manually update status
                  status: "graded" as const,
                  score: row.gradeInput,
                  feedback: row.feedbackInput,
                } as Assignment,
              }
            : r
        )
      );

      // Re-fetching just to be safe about ID and timestamps?
      // Maybe overkill for every row save.
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Gagal menyimpan nilai");
    }
  };

  const filteredRows = rows.filter((row) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "submitted")
      return row.assignment?.status === "submitted";
    if (filterStatus === "graded") return row.assignment?.status === "graded";
    if (filterStatus === "not_submitted")
      return !row.assignment || row.assignment.status === "not_submitted";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Separator />

        {/* Filters Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Table Skeleton */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-[100px]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-[250px]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <Skeleton className="h-4 w-8 ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            Max Poin: {task.maxPoints} • Tipe: {task.submissionType} •{" "}
            {task.orPeriod || "General"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter Status:</span>
          <Select
            value={filterStatus}
            onValueChange={(val) => setFilterStatus(val as FilterStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="submitted">Sudah Mengumpulkan</SelectItem>
              <SelectItem value="graded">Sudah Dinilai</SelectItem>
              <SelectItem value="not_submitted">Belum Mengumpulkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {filteredRows.length} Peserta
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nama Peserta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pengumpulan</TableHead>
              <TableHead className="w-[100px]">
                Nilai (Msg {task.maxPoints})
              </TableHead>
              <TableHead className="w-[250px]">Feedback</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.nim}</div>
                </TableCell>
                <TableCell>
                  {row.assignment ? (
                    <Badge
                      variant={
                        row.assignment.status === "graded"
                          ? "default"
                          : row.assignment.status === "submitted"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {row.assignment.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      Belum Mengumpulkan
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {row.assignment?.submissionContent ? (
                    task.submissionType === "link" ? (
                      <a
                        href={row.assignment.submissionContent}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        Link <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    ) : task.submissionType === "file" ? (
                      <a
                        href={row.assignment.submissionContent}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        File <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    ) : (
                      <span
                        className="text-sm line-clamp-2"
                        title={row.assignment.submissionContent}
                      >
                        {row.assignment.submissionContent}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={task.maxPoints}
                    value={row.gradeInput}
                    onChange={(e) =>
                      handleGradeChange(row.userId, e.target.value)
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={row.feedbackInput}
                    onChange={(e) =>
                      handleFeedbackChange(row.userId, e.target.value)
                    }
                    placeholder="Feedback..."
                    className="h-9 min-h-[36px] resize-none"
                  />
                </TableCell>
                <TableCell className="text-right">
                  {row.isDirty && (
                    <Button size="sm" onClick={() => handleSaveRow(row)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Tidak ada data peserta.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
