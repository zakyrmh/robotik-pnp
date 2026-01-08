"use client";

import {
  Calendar,
  FileText,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  User,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Task, TaskStatus, SubmissionType } from "@/schemas/tasks";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onGrade: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onGrade }: TaskCardProps) {
  // Helper for formatting date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "archived":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "published":
        return "Terbit";
      case "archived":
        return "Diarsipkan";
      default:
        return status;
    }
  };

  const getSubmissionIcon = (type: SubmissionType) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4 mr-1" />;
      case "link":
        return <LinkIcon className="h-4 w-4 mr-1" />;
      case "text":
        return <FileText className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow dark:bg-slate-950/50">
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                {task.orPeriod || "General"}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs font-normal ${getStatusColor(
                  task.status
                )} border-0`}
              >
                {getStatusLabel(task.status)}
              </Badge>
            </div>
            <CardTitle className="text-xl line-clamp-2">{task.title}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onGrade(task)}>
                <FileText className="mr-2 h-4 w-4" />
                Lihat Pengumpulan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 min-h-[40px]">
          {task.description || "Tidak ada deskripsi"}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <span>Deadline: {formatDate(task.deadline)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              {task.taskType === "group" ? (
                <Users className="mr-2 h-4 w-4 text-indigo-500" />
              ) : (
                <User className="mr-2 h-4 w-4 text-blue-500" />
              )}
              <span className="capitalize">
                {task.taskType === "group" ? "Kelompok" : "Individu"}
              </span>
            </div>

            <div className="flex items-center text-slate-600 dark:text-slate-300">
              {getSubmissionIcon(task.submissionType)}
              <span className="capitalize">{task.submissionType}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex justify-between items-center w-full text-xs text-slate-500">
          <span>{task.maxPoints} Poin</span>
          <span>{task.isVisible ? "Visible" : "Hidden"}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
