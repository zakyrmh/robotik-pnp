"use client";

import { Plus, Users2 } from "lucide-react";
import { SubGroup } from "@/schemas/groups";
import { SubGroupCard } from "./sub-group-card";
import { Button } from "@/components/ui/button";

interface SubGroupListProps {
  subGroups: SubGroup[];
  isLoading: boolean;
  onViewDetail: (subGroup: SubGroup) => void;
  onDelete: (subGroup: SubGroup) => void;
  onSetLeader: (subGroup: SubGroup) => void;
  onGenerateSubGroup?: () => void;
}

export function SubGroupList({
  subGroups,
  isLoading,
  onViewDetail,
  onDelete,
  onSetLeader,
  onGenerateSubGroup,
}: SubGroupListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[280px] rounded-xl border bg-card text-card-foreground shadow animate-pulse p-6"
          >
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-4" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (subGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
        <div className="bg-slate-100 p-3 rounded-full dark:bg-slate-800 mb-4">
          <Users2 className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Belum ada sub-kelompok
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4 dark:text-slate-400">
          Tidak ada sub-kelompok yang cocok dengan pencarian Anda. Coba ubah
          kata kunci atau buat sub-kelompok baru.
        </p>
        {/* tombol generate anggota sub group otomatis */}
        {onGenerateSubGroup && (
          <Button onClick={onGenerateSubGroup} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Generate Sub-Kelompok
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {subGroups.map((subGroup) => (
        <SubGroupCard
          key={subGroup.id}
          subGroup={subGroup}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
          onSetLeader={onSetLeader}
        />
      ))}
    </div>
  );
}
