"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { TaskSubmission } from "@/types/tasks";
import { User } from "@/types/users";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface SubmissionTableProps {
  submissions: TaskSubmission[];
  userMap: Record<string, User>;
}

export const SubmissionTable = ({
  submissions,
  userMap,
}: SubmissionTableProps) => {
  const formatTime = (ts?: Timestamp) => {
    if (!ts) return "-";
    return format(ts.toDate(), "dd MMM HH:mm", { locale: localeId });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>NIM</TableHead>
          <TableHead>Waktu Submit</TableHead>
          <TableHead>Lampiran</TableHead>
          <TableHead>Nilai</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((sub) => {
          const user = userMap[sub.userId!] || {};
          return (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">
                {user.profile?.fullName ?? "Unknown"}
              </TableCell>
              <TableCell>{user.profile?.nim ?? "-"}</TableCell>
              <TableCell>{formatTime(sub.submittedAt)}</TableCell>
              <TableCell>
                {sub.fileUrl ? (
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    Buka File
                  </a>
                ) : sub.linkUrl ? (
                  <a
                    href={sub.linkUrl}
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Link
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {sub.score !== undefined ? (
                  sub.score
                ) : (
                  <span className="text-muted-foreground italic">Belum dinilai</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info("Fitur detail/revisi submission segera hadir")
                  }
                >
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
