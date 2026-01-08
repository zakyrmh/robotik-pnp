"use client";

import { MessageSquareDashed } from "lucide-react";
import { Task } from "@/schemas/tasks";
import { TaskCard } from "./task-card";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onGrade: (task: Task) => void;
}

export function TaskList({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onGrade,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[200px] rounded-xl border bg-card text-card-foreground shadow animate-pulse p-6"
          >
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
            <div className="mt-8 h-4 bg-muted rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
        <div className="bg-slate-100 p-3 rounded-full dark:bg-slate-800 mb-4">
          <MessageSquareDashed className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Belum ada tugas
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4 dark:text-slate-400">
          Tidak ada tugas yang cocok dengan filter yang Anda gunakan. Coba ubah
          filter atau buat tugas baru.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onGrade={onGrade}
        />
      ))}
    </div>
  );
}
