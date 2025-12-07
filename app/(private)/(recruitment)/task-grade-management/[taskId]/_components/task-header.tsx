"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { Task } from "@/types/tasks";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

interface TaskHeaderProps {
  task: Task;
}

export const TaskHeader = ({ task }: TaskHeaderProps) => {
  const formatDateTime = (value?: Timestamp) => {
    if (!value) return "-";
    const date = value.toDate();
    return format(date, "dd MMM yyyy HH:mm", { locale: localeId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{task.title}</CardTitle>
        <CardDescription className="space-y-2">
          <p>{task.description}</p>
          {task.instructions && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              <span className="font-semibold">Instruksi:</span> {task.instructions}
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <ClipboardList className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">OR Period</p>
            <p className="font-semibold">{task.orPeriod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Tipe</p>
            <p className="font-semibold capitalize">{task.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <CalendarDays className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="font-semibold">{formatDateTime(task.deadline)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant={task.isPublished ? "default" : "secondary"} className="text-[10px]">
                {task.isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant={task.isVisible ? "outline" : "destructive"} className="text-[10px]">
                {task.isVisible ? "Visible" : "Hidden"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};