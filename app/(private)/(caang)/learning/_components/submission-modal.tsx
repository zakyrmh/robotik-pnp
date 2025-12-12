"use client";


import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task, TaskSubmission } from "@/types/tasks";
import { SubmissionType, TaskStatus } from "@/types/enum";
import { createTaskSubmission, updateTaskSubmission } from "@/lib/firebase/task-submissions";
import { uploadMaterialFile } from "@/lib/firebase/materials"; // Reusing material upload for now, ideally should be a separate bucket/path
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  existingSubmission?: TaskSubmission;
  currentUserId: string;
}

export function SubmissionModal({
  open,
  onOpenChange,
  task,
  existingSubmission,
  currentUserId,
}: SubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(task.submissionTypes[0] || "file");
  
  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState(existingSubmission?.linkUrl || "");
  const [text, setText] = useState(existingSubmission?.textAnswer || "");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let fileData = { url: existingSubmission?.fileUrl, name: existingSubmission?.fileName, size: existingSubmission?.fileSize, type: existingSubmission?.fileType };

      // Handle File Upload if new file selected
      if (activeTab === SubmissionType.FILE && file) {
        const uploadResult = await uploadMaterialFile(file); // Note: using material upload helper
        fileData = {
          url: uploadResult.url,
          name: file.name,
          size: file.size,
          type: file.type
        };
      }

      const payload: Partial<TaskSubmission> & {
        taskId: string;
        userId: string;
        orPeriod: string;
        submissionType: SubmissionType;
        isLate: boolean;
        status: TaskStatus;
        submittedAt: Timestamp;
      } = {
        taskId: task.id,
        userId: currentUserId,
        orPeriod: task.orPeriod,
        submissionType: activeTab as SubmissionType,
        isLate: new Date().getTime() > task.deadline.toMillis(),
        status: TaskStatus.SUBMITTED,
        submittedAt: Timestamp.now(),
      };

      if (activeTab === SubmissionType.FILE) {
        payload.fileUrl = fileData.url;
        payload.fileName = fileData.name;
        payload.fileSize = fileData.size;
        payload.fileType = fileData.type;
      } else if (activeTab === SubmissionType.LINK) {
        payload.linkUrl = link;
      } else if (activeTab === SubmissionType.TEXT) {
        payload.textAnswer = text;
      }

      if (existingSubmission) {
        await updateTaskSubmission(existingSubmission.id, payload);
        toast.success("Submission berhasil diperbarui");
      } else {
        await createTaskSubmission(payload);
        toast.success("Tugas berhasil dikumpulkan");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengumpulkan tugas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengumpulan Tugas</DialogTitle>
          <DialogDescription>
            {task.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
             {task.submissionTypes.includes(SubmissionType.FILE) && (
              <TabsTrigger value={SubmissionType.FILE}>File</TabsTrigger>
            )}
            {task.submissionTypes.includes(SubmissionType.LINK) && (
              <TabsTrigger value={SubmissionType.LINK}>Link</TabsTrigger>
            )}
            {task.submissionTypes.includes(SubmissionType.TEXT) && (
              <TabsTrigger value={SubmissionType.TEXT}>Teks</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={SubmissionType.FILE} className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">File Tugas</Label>
              <Input 
                id="file" 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              {existingSubmission?.fileName && !file && (
                <p className="text-sm text-muted-foreground">
                  File terupload: {existingSubmission.fileName}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Allowed types: {task.allowedFileTypes?.join(", ") || "All files"}
            </div>
          </TabsContent>

          <TabsContent value={SubmissionType.LINK} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link">Link Tugas</Label>
              <Input 
                id="link" 
                placeholder="https://..." 
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value={SubmissionType.TEXT} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="text">Jawaban Teks</Label>
              <Textarea 
                id="text" 
                placeholder="Tulis jawaban anda disini..." 
                className="h-32"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingSubmission ? "Update Submission" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
