"use client";

import { Users, Crown, Calendar, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { SubGroup } from "@/schemas/groups";

interface SubGroupDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup | null;
}

export function SubGroupDetailModal({
  open,
  onOpenChange,
  subGroup,
}: SubGroupDetailModalProps) {
  if (!subGroup) return null;

  // Sort members: leader first, then others by name
  const sortedMembers = [...subGroup.members].sort((a, b) => {
    if (a.userId === subGroup.leaderId) return -1;
    if (b.userId === subGroup.leaderId) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get attendance badge color
  const getAttendanceBadge = (percentage: number, isLow: boolean) => {
    if (isLow) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    }
    if (percentage >= 65) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  // Calculate group stats
  const totalMembers = subGroup.members.length;
  const avgAttendance =
    totalMembers > 0
      ? (
          subGroup.members.reduce((sum, m) => sum + m.attendancePercentage, 0) /
          totalMembers
        ).toFixed(1)
      : "0";
  const lowAttendanceCount = subGroup.members.filter(
    (m) => m.isLowAttendance
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {subGroup.orPeriod}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs ${
                  subGroup.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                } border-0`}
              >
                {subGroup.isActive ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl">{subGroup.name}</DialogTitle>
          {subGroup.description && (
            <p className="text-sm text-muted-foreground">
              {subGroup.description}
            </p>
          )}
        </DialogHeader>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalMembers}
            </div>
            <div className="text-xs text-muted-foreground">Total Anggota</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {avgAttendance}%
            </div>
            <div className="text-xs text-muted-foreground">
              Rata-rata Kehadiran
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {lowAttendanceCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Kehadiran Rendah
            </div>
          </div>
        </div>

        <Separator />

        {/* Members List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Daftar Anggota</span>
          </div>

          {sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada anggota dalam sub-kelompok ini
            </p>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map((member) => {
                const isLeader = member.userId === subGroup.leaderId;
                return (
                  <div
                    key={member.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isLeader
                        ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700"
                        : "bg-slate-50 dark:bg-slate-900/30"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={`text-sm ${
                          isLeader
                            ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${
                            isLeader ? "text-amber-800 dark:text-amber-200" : ""
                          }`}
                        >
                          {member.fullName}
                        </p>
                        {isLeader && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 border-0 text-xs"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            Ketua
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {member.nim}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {member.attendedActivities}/{member.totalActivities}{" "}
                          kegiatan
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`${getAttendanceBadge(
                        member.attendancePercentage,
                        member.isLowAttendance
                      )} border-0`}
                    >
                      {member.attendancePercentage}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Dibuat pada:{" "}
          {subGroup.createdAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
