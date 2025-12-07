"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { upsertGrade } from "@/lib/firebase/task-submissions";
import { User } from "@/types/users";
import { TaskSubmission } from "@/types/tasks";

interface ObservationTableProps {
  taskId: string;
  adminId: string;
  candidates: User[];
  submissions: TaskSubmission[]; // Data nilai yang sudah ada
}

export const ObservationTable = ({ taskId, adminId, candidates, submissions }: ObservationTableProps) => {
  const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});

  const handleGradeChange = async (userId: string, newScore: number) => {
    setLoadingRows((prev) => ({ ...prev, [userId]: true }));
    try {
      await upsertGrade(taskId, userId, newScore, adminId);
      toast.success("Nilai tersimpan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan nilai");
    } finally {
      setLoadingRows((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Lengkap</TableHead>
          <TableHead>NIM</TableHead>
          <TableHead className="w-[200px]">Nilai (0-100)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((user) => {
          // Cari apakah user ini sudah punya nilai sebelumnya
          const existingSubmission = submissions.find((s) => s.userId === user.id);
          const currentScore = existingSubmission?.score ?? "";

          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.profile?.fullName ?? "Tanpa Nama"}</TableCell>
              <TableCell>{user.profile?.nim ?? "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Nilai"
                    defaultValue={currentScore}
                    className="w-24"
                    disabled={loadingRows[user.id]}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      // Simpan hanya jika angka valid dan berbeda dari sebelumnya
                      if (!isNaN(val) && val !== currentScore) {
                        handleGradeChange(user.id, val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur(); // Trigger onBlur
                      }
                    }}
                  />
                  {loadingRows[user.id] && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};