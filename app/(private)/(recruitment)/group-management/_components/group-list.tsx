"use client";

import { Users2 } from "lucide-react";
import { GroupParent } from "@/schemas/groups";
import { GroupCard } from "./group-card";

interface GroupListProps {
  groups: GroupParent[];
  isLoading: boolean;
  onEdit: (group: GroupParent) => void;
  onDelete: (group: GroupParent) => void;
  onViewSubGroups: (group: GroupParent) => void;
}

export function GroupList({
  groups,
  isLoading,
  onEdit,
  onDelete,
  onViewSubGroups,
}: GroupListProps) {
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

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
        <div className="bg-slate-100 p-3 rounded-full dark:bg-slate-800 mb-4">
          <Users2 className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Belum ada kelompok
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4 dark:text-slate-400">
          Tidak ada kelompok yang cocok dengan filter yang Anda gunakan. Coba
          ubah filter atau buat kelompok baru.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewSubGroups={onViewSubGroups}
        />
      ))}
    </div>
  );
}
