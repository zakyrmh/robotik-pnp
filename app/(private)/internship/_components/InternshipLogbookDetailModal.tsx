"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Clock,
  Calendar,
  Target,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { InternshipLogbookEntry } from "@/schemas/internship";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InternshipLogbookDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entry: InternshipLogbookEntry | null;
}

export function InternshipLogbookDetailModal({
  isOpen,
  onOpenChange,
  entry,
}: InternshipLogbookDetailModalProps) {
  if (!entry) return null;

  const statusConfig = {
    draft: {
      label: "Draft",
      icon: FileText,
      color: "text-slate-600",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      borderColor: "border-slate-300",
    },
    submitted: {
      label: "Terkirim",
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-300",
    },
    approved: {
      label: "Disetujui",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-300",
    },
    rejected: {
      label: "Ditolak",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-300",
    },
  };

  const config = statusConfig[entry.status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">
                {entry.activityType}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(entry.date, "PPP", { locale: localeId })}</span>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <span>{entry.duration} Menit</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-2",
                config.color,
                config.bgColor,
                config.borderColor,
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {config.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Divisi Target */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="w-4 h-4" />
                Divisi Target
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <p className="font-semibold text-lg">{entry.targetDivision}</p>
              </div>
            </div>

            {/* Uraian Kegiatan */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                Uraian Kegiatan
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {entry.activity}
                </p>
              </div>
            </div>

            {/* Hasil/Capaian */}
            {entry.outcome && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Award className="w-4 h-4" />
                  Hasil / Capaian
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {entry.outcome}
                  </p>
                </div>
              </div>
            )}

            {/* Status Reason (untuk rejected) */}
            {entry.status === "rejected" && entry.statusReason && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <XCircle className="w-4 h-4" />
                  Alasan Penolakan
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-300">
                    {entry.statusReason}
                  </p>
                </div>
              </div>
            )}

            {/* Dokumentasi Foto */}
            {entry.documentationUrls && entry.documentationUrls.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Dokumentasi ({entry.documentationUrls.length} Foto)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {entry.documentationUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                    >
                      <Image
                        src={url}
                        alt={`Dokumentasi ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm">
                          Klik untuk perbesar
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Dibuat:</span>
                <span>
                  {format(entry.createdAt, "PPP 'pukul' HH:mm", {
                    locale: localeId,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Terakhir diubah:</span>
                <span>
                  {format(entry.updatedAt, "PPP 'pukul' HH:mm", {
                    locale: localeId,
                  })}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
