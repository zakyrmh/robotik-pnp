"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  FolderOpen,
  Calendar,
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

import { GroupParent } from "@/schemas/groups";

interface GroupCardProps {
  group: GroupParent;
  onEdit: (group: GroupParent) => void;
  onDelete: (group: GroupParent) => void;
  onViewSubGroups: (group: GroupParent) => void;
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
  onViewSubGroups,
}: GroupCardProps) {
  // Helper for formatting date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Aktif" : "Tidak Aktif";
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow dark:bg-slate-950/50">
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                {group.orPeriod || "General"}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs font-normal ${getStatusColor(
                  group.isActive
                )} border-0`}
              >
                {getStatusLabel(group.isActive)}
              </Badge>
            </div>
            <CardTitle className="text-xl line-clamp-2">{group.name}</CardTitle>
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
              <DropdownMenuItem onClick={() => onViewSubGroups(group)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Lihat Sub-Kelompok
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(group)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(group)}
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
          {group.description || "Tidak ada deskripsi"}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <span>Dibuat: {formatDate(group.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <FolderOpen className="mr-2 h-4 w-4 text-indigo-500" />
              <span>{group.totalSubGroups} Sub-Kelompok</span>
            </div>

            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <Users className="mr-2 h-4 w-4 text-blue-500" />
              <span>{group.totalMembers} Anggota</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex justify-between items-center w-full text-xs text-slate-500">
          <span>{group.orPeriod}</span>
          <span>{group.isActive ? "Aktif" : "Nonaktif"}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
