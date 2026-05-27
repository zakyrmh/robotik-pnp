"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTask, submitTaskSubmission, gradeTaskSubmission } from "@/lib/actions/tasks";

// Custom SVG Icons
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-rose-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  profile_id: string;
  submission_url: string;
  notes: string | null;
  grade: number | null;
  feedback: string | null;
  status: "belum_selesai" | "diperiksa" | "selesai" | "revisi";
  updated_at: string;
  caang_name: string; // empty if Caang view
  caang_nim: string; // empty if Caang view
}

interface TasksClientProps {
  profile: {
    id: string;
    role: string;
  };
  tasks: Task[];
  submissions: Submission[];
}

export function TasksClient({ profile, tasks, submissions }: TasksClientProps) {
  const router = useRouter();
  const isAdmin = ["admin-or", "super-admin"].includes(profile.role);

  // Client tabs (Active vs History)
  const [activeTab, setActiveTab] = useState<string>("daftar-tugas");

  // --- ADMIN: Create Task Dialog States ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // --- ADMIN: Grading Dialog States ---
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(80);
  const [feedbackText, setFeedbackText] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // --- CAANG: Submission Dialog & Drag-Drop States ---
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newDueDate) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    setIsCreating(true);
    const loadToast = toast.loading("Membuat tugas baru...");

    try {
      const res = await createTask({
        title: newTitle,
        description: newDescription,
        dueDate: new Date(newDueDate).toISOString(),
      });

      toast.dismiss(loadToast);
      if (res.success) {
        toast.success(res.message);
        setIsCreateDialogOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal membuat tugas.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // Grade Submission Handler
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    if (gradeValue < 0 || gradeValue > 100) {
      toast.error("Nilai harus di antara 0 - 100.");
      return;
    }

    setIsGrading(true);
    const loadToast = toast.loading("Menyimpan penilaian...");

    try {
      const res = await gradeTaskSubmission(gradingSubmission.id, gradeValue, feedbackText);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setGradingSubmission(null);
        setFeedbackText("");
        setGradeValue(80);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menyimpan penilaian.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsGrading(false);
    }
  };

  // File drop / select for Caang submission
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowed = ["txt", "pdf", "docx", "png", "jpg", "jpeg", "gif"];
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!ext || !allowed.includes(ext)) {
        toast.error("Format berkas ditolak. Gunakan file gambar, PDF, Word, atau teks.");
        return;
      }

      setSubmissionFile(file);
      setFilePreview(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const allowed = ["txt", "pdf", "docx", "png", "jpg", "jpeg", "gif"];
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!ext || !allowed.includes(ext)) {
        toast.error("Format berkas ditolak. Gunakan file gambar, PDF, Word, atau teks.");
        return;
      }

      setSubmissionFile(file);
      setFilePreview(file.name);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmit || !submissionFile) {
      toast.error("Unggah berkas tugas terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Mengunggah berkas tugas...");

    const formData = new FormData();
    formData.append("task_id", selectedTaskForSubmit.id);
    formData.append("notes", submissionNotes);
    formData.append("file", submissionFile);

    try {
      const res = await submitTaskSubmission(formData);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setSelectedTaskForSubmit(null);
        setSubmissionNotes("");
        setSubmissionFile(null);
        setFilePreview(null);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mengumpulkan tugas.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Tugas & Penilaian LMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Kelola tugas Caang, pantau submission, dan berikan penilaian angka serta umpan balik."
              : "Unggah dokumen pengerjaan tugas kegiatan secara langsung ke sistem."}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-indigo-500/20 py-5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <PlusIcon />
            Buat Tugas Baru
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl w-full grid grid-cols-2">
          <TabsTrigger value="daftar-tugas" className="rounded-lg data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-500/30">
            Daftar Tugas Aktif
          </TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-500/30">
            {isAdmin ? "Data Submission Caang" : "Riwayat Pengumpulan"}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Task Lists */}
        <TabsContent value="daftar-tugas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.length === 0 ? (
              <Card className="col-span-full border border-dashed border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center">
                <CardContent className="space-y-3 pt-6">
                  <div className="inline-flex p-4 rounded-full bg-white/5 text-muted-foreground">
                    <DocumentIcon />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Belum Ada Tugas</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Panitia belum mempublikasikan tugas pendaftaran untuk calon anggota.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                const sub = submissions.find((s) => s.task_id === task.id);
                const isOverdue = new Date(task.due_date) < new Date();

                return (
                  <Card key={task.id} className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {task.title}
                        </CardTitle>
                        {sub ? (
                          <Badge
                            className={
                              sub.status === "selesai"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]"
                                : sub.status === "revisi"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]"
                            }
                          >
                            {sub.status.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                            BELUM KUMPUL
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-3 mt-1 min-h-[50px] leading-relaxed">
                        {task.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 pt-1 flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span>Batas Pengumpulan:</span>
                        <span className={`font-medium ${isOverdue && !sub ? "text-rose-400" : "text-foreground"}`}>
                          {new Date(task.due_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                      {sub?.grade !== null && sub?.grade !== undefined && (
                        <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl px-2.5 py-1 text-center">
                          <p className="text-[8px] text-indigo-300 font-medium">NILAI</p>
                          <p className="text-sm font-bold font-mono">{sub.grade}</p>
                        </div>
                      )}
                    </CardContent>
                    {!isAdmin && (
                      <CardFooter className="bg-black/10 border-t border-white/5 py-3">
                        <Button
                          onClick={() => setSelectedTaskForSubmit(task)}
                          disabled={isOverdue && !sub}
                          className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium py-3 rounded-xl border border-indigo-500/20 text-xs transition-all"
                        >
                          {sub ? "Kirim Ulang / Perbarui" : "Kumpulkan Tugas"}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Submissions Table */}
        <TabsContent value="submissions">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {isAdmin ? "Rekapitulasi Tugas Caang" : "Riwayat Pengumpulan Tugas Anda"}
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Daftar lengkap berkas tugas yang dikirim oleh calon anggota beserta panel nilai."
                  : "Daftar tugas yang telah Anda kumpulkan."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-x-auto">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Belum ada tugas yang dikumpulkan.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground font-medium text-xs">
                      <th className="px-4 py-3">Tugas</th>
                      {isAdmin && <th className="px-4 py-3">Pengirim</th>}
                      <th className="px-4 py-3">Tanggal Kirim</th>
                      <th className="px-4 py-3">Berkas</th>
                      <th className="px-4 py-3">Nilai</th>
                      <th className="px-4 py-3">Status</th>
                      {isAdmin && <th className="px-4 py-3">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {submissions.map((sub) => {
                      const task = tasks.find((t) => t.id === sub.task_id);
                      return (
                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4 font-semibold text-foreground">
                            {task?.title || "Tugas Tidak Diketahui"}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{sub.caang_name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{sub.caang_nim}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-4 text-xs text-muted-foreground font-mono">
                            {new Date(sub.updated_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-4 py-4">
                            <a
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"}/storage/v1/object/sign/task-submissions/${sub.submission_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              Unduh Berkas
                            </a>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-foreground">
                            {sub.grade !== null && sub.grade !== undefined ? sub.grade : "-"}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              className={
                                sub.status === "selesai"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]"
                                  : sub.status === "revisi"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]"
                              }
                            >
                              {sub.status.toUpperCase()}
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeValue(sub.grade || 80);
                                  setFeedbackText(sub.feedback || "");
                                }}
                                className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs py-1.5 px-3 flex items-center gap-1.5"
                              >
                                <PencilIcon />
                                Nilai
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- DIALOG 1: ADMIN - Create Task Form --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-center">Buat Tugas Baru</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center mt-1">
              Buat rincian pengerjaan tugas baru untuk seluruh Calon Anggota (Caang).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 my-4">
            <div className="space-y-1">
              <Label htmlFor="task-title" className="text-xs text-slate-300">Judul Tugas</Label>
              <Input
                id="task-title"
                required
                placeholder="Contoh: Log Book Pertemuan 1 & Tugas Sensor Arduino"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-desc" className="text-xs text-slate-300">Rincian Deskripsi Tugas</Label>
              <Textarea
                id="task-desc"
                required
                placeholder="Tulis instruksi pengerjaan tugas secara detail..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 h-28 text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-due" className="text-xs text-slate-300">Batas Pengumpulan (Deadline)</Label>
              <Input
                id="task-due"
                type="datetime-local"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 text-white"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-white/5 bg-transparent text-slate-400 hover:text-white rounded-xl py-5 hover:bg-white/5 flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-5 flex-1 shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                {isCreating ? "Menyimpan..." : "Buat Tugas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 2: ADMIN - Grade Task Dialog --- */}
      <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-center">Penilaian Tugas Caang</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center mt-1">
              Berikan skor pengerjaan dan umpan balik pembimbing kepada {gradingSubmission?.caang_name}.
            </DialogDescription>
          </DialogHeader>

          {gradingSubmission && (
            <form onSubmit={handleGradeSubmission} className="space-y-4 my-4">
              <div className="space-y-1">
                <Label htmlFor="grade" className="text-xs text-slate-300">Nilai Angka (0 - 100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeValue}
                  onChange={(e) => setGradeValue(parseInt(e.target.value))}
                  className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 text-white placeholder-slate-500"
                />
                <span className="text-[10px] text-slate-400">
                  * Nilai &gt;= 50 otomatis set status &quot;Selesai&quot;. Nilai &lt; 50 set status &quot;Revisi&quot;.
                </span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="feedback" className="text-xs text-slate-300">Umpan Balik / Catatan Evaluasi</Label>
                <Textarea
                  id="feedback"
                  placeholder="Berikan saran perbaikan atau catatan apresiasi..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 h-24 text-white placeholder-slate-500"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGradingSubmission(null)}
                  className="border-white/5 bg-transparent text-slate-400 hover:text-white rounded-xl py-5 hover:bg-white/5 flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isGrading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-5 flex-1 shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  {isGrading ? "Menilai..." : "Simpan Nilai"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 3: CAANG - Upload Submission Dialog --- */}
      <Dialog open={!!selectedTaskForSubmit} onOpenChange={(open) => !open && setSelectedTaskForSubmit(null)}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-center">Pengumpulan Tugas</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center mt-1">
              Kumpulkan file bukti jawaban Anda untuk tugas: {selectedTaskForSubmit?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTaskForSubmit && (
            <form onSubmit={handleTaskSubmit} className="space-y-4 my-4">
              {/* Dropzone Upload */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">File Jawaban</Label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-xl border border-dashed border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden group"
                >
                  {filePreview ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4">
                      <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                        <DocumentIcon />
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[250px]" title={filePreview}>
                        {filePreview}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubmissionFile(null);
                          setFilePreview(null);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-medium bg-rose-500/10 border border-rose-500/20 py-1 px-2.5 rounded-lg"
                      >
                        <TrashIcon />
                        Hapus File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-center"><UploadIcon /></div>
                      <p className="text-xs font-medium text-foreground">Klik / seret file ke sini</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Mendukung PDF, Word (docx), Teks (txt), Gambar (png, jpg, jpeg) max 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submit-notes" className="text-xs text-slate-300">Catatan Tambahan (Opsional)</Label>
                <Textarea
                  id="submit-notes"
                  placeholder="Tulis pesan/link pengerjaan alternatif kepada panitia jika ada..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 h-20 text-white placeholder-slate-500"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTaskForSubmit(null)}
                  className="border-white/5 bg-transparent text-slate-400 hover:text-white rounded-xl py-5 hover:bg-white/5 flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-5 flex-1 shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  {isSubmitting ? "Mengirim..." : "Kumpulkan Tugas"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
