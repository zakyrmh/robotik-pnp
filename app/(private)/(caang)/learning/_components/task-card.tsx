"use client";

import { Task, TaskSubmission } from "@/types/tasks";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { SubmissionType } from "@/types/enum";
import { SubmissionModal } from "@/app/(private)/(caang)/learning/_components/submission-modal";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  submission?: TaskSubmission;
  currentUserId: string;
}

export function TaskCard({ task, submission, currentUserId }: TaskCardProps) {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);

  // Determine status and style
  const isSubmitted = !!submission;
  const isLate = submission ? submission.submittedAt.toMillis() > task.deadline.toMillis() : false;
  const isOverdue = !isSubmitted && new Date().getTime() > task.deadline.toMillis();
  


  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={task.type === "group" ? "secondary" : "outline"}>
                  {task.type === "group" ? "Kelompok" : "Individu"}
                </Badge>
                {isSubmitted ? (
                  <Badge variant={isLate ? "destructive" : "default"} className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {isLate ? "Terlambat" : "Selesai"}
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Terlewat
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
                    <Clock className="h-3 w-3" />
                    Belum Submit
                  </Badge>
                )}
              </div>
              <CardTitle className="line-clamp-2 text-lg">{task.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Deadline: {format(task.deadline.toDate(), "dd MMM yyyy, HH:mm", { locale: id })}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {task.description}
          </p>
          <div className="flex gap-2 flex-wrap">
            {task.submissionTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type === SubmissionType.FILE && "Upload File"}
                {type === SubmissionType.LINK && "Link"}
                {type === SubmissionType.TEXT && "Teks"}
                {type === SubmissionType.NO_INPUT && "Tanpa Input"}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => setIsSubmissionOpen(true)}
            variant={isSubmitted ? "secondary" : "default"}
          >
            {isSubmitted ? "Lihat Submission" : "Kerjakan Tugas"}
          </Button>
        </CardFooter>
      </Card>

      <SubmissionModal 
        open={isSubmissionOpen}
        onOpenChange={setIsSubmissionOpen}
        task={task}
        existingSubmission={submission}
        currentUserId={currentUserId}
      />
    </>
  );
}
