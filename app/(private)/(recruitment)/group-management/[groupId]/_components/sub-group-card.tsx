"use client";

import {
  MoreVertical,
  Trash2,
  Users,
  Eye,
  Crown,
  UserCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { SubGroup, GroupMember } from "@/schemas/groups";

interface SubGroupCardProps {
  subGroup: SubGroup;
  onViewDetail: (subGroup: SubGroup) => void;
  onDelete: (subGroup: SubGroup) => void;
  onSetLeader: (subGroup: SubGroup) => void;
}

export function SubGroupCard({
  subGroup,
  onViewDetail,
  onDelete,
  onSetLeader,
}: SubGroupCardProps) {
  // Sort members: leader first, then others
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
  const getAttendanceBadge = (member: GroupMember) => {
    if (member.isLowAttendance) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    }
    if (member.attendancePercentage >= 65) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow dark:bg-slate-950/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                {subGroup.orPeriod}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs font-normal ${
                  subGroup.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                } border-0`}
              >
                {subGroup.isActive ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
            <CardTitle className="text-lg">{subGroup.name}</CardTitle>
            {subGroup.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {subGroup.description}
              </p>
            )}
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
              <DropdownMenuItem onClick={() => onViewDetail(subGroup)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetLeader(subGroup)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Set Ketua Kelompok
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(subGroup)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {/* Member Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <span>{subGroup.members.length} Anggota</span>
        </div>

        {/* Member List */}
        <div className="space-y-2">
          {sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Belum ada anggota
            </p>
          ) : (
            sortedMembers.map((member) => {
              const isLeader = member.userId === subGroup.leaderId;
              return (
                <div
                  key={member.userId}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isLeader
                      ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-900/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`text-xs ${
                          isLeader
                            ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            isLeader ? "text-amber-800 dark:text-amber-200" : ""
                          }`}
                        >
                          {member.fullName}
                        </p>
                        {isLeader && (
                          <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.nim}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getAttendanceBadge(member)} border-0`}
                  >
                    {member.attendancePercentage}%
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
