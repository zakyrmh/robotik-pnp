"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { type RollingInternshipSchedule } from "@/schemas/internship";
import { getTeamDisplayName, type KriTeam } from "@/schemas/users";
import {
  format,
  differenceInDays,
  isWithinInterval,
  isPast,
  isFuture,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

interface RollingScheduleViewProps {
  schedule: RollingInternshipSchedule;
}

// Color map for different divisions
const DIVISION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  krai: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  krsbi_b: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  krsbi_h: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  krsti: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  krsri: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Aktif
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Selesai
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          Menunggu
        </Badge>
      );
  }
}

export function RollingScheduleView({ schedule }: RollingScheduleViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Jadwal Magang Rolling
            </CardTitle>
            <CardDescription className="mt-1">
              Jadwal rotasi divisi kamu ({schedule.divisionsPerWeek} divisi per
              minggu, total {schedule.totalWeeks} minggu)
            </CardDescription>
          </div>
          {getStatusBadge(schedule.scheduleStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule.weeks.map((week) => {
          const now = new Date();
          const startDate = week.startDate ? new Date(week.startDate) : null;
          const endDate = week.endDate ? new Date(week.endDate) : null;

          // Determine status based on actual dates if available, otherwise fallback to schedule.currentWeek
          let isCurrentWeek = false;
          let isPastWeek = false;
          let isFutureWeek = false;

          if (startDate && endDate) {
            isCurrentWeek = isWithinInterval(now, {
              start: startDate,
              end: endDate,
            });
            isPastWeek = isPast(endDate) && !isCurrentWeek;
            isFutureWeek = isFuture(startDate) && !isCurrentWeek;
          } else {
            isCurrentWeek = week.weekNumber === schedule.currentWeek;
            isPastWeek = (schedule.currentWeek || 0) > week.weekNumber;
            isFutureWeek =
              (schedule.currentWeek || 0) < week.weekNumber &&
              schedule.currentWeek !== 0;
          }

          // Calculate countdown for future weeks
          const daysToStart = startDate
            ? differenceInDays(startDate, now)
            : null;

          return (
            <div
              key={week.weekNumber}
              className={`rounded-lg border p-4 transition-all ${
                isCurrentWeek
                  ? "border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-400/30 shadow-md"
                  : isPastWeek
                    ? "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 opacity-75"
                    : "border-slate-200 dark:border-slate-800 bg-card"
              }`}
            >
              {/* Week Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={isCurrentWeek ? "default" : "outline"}
                    className={
                      isCurrentWeek
                        ? "bg-blue-600 hover:bg-blue-600 shadow-sm"
                        : isPastWeek
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "border-slate-300"
                    }
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Minggu {week.weekNumber}
                  </Badge>

                  {/* Date Range - Moved next to Week Label */}
                  {startDate && endDate && (
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      ({format(startDate, "dd MMM", { locale: localeId })} -{" "}
                      {format(endDate, "dd MMM yyyy", { locale: localeId })})
                    </span>
                  )}

                  {isCurrentWeek && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[10px] animate-pulse uppercase tracking-wider">
                      Aktif
                    </Badge>
                  )}
                  {isPastWeek && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-slate-500 border-slate-300 uppercase tracking-wider"
                    >
                      Selesai
                    </Badge>
                  )}
                  {isFutureWeek && daysToStart !== null && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium uppercase tracking-wider"
                    >
                      {daysToStart === 0
                        ? "Mulai Besok"
                        : `H-${daysToStart + 1}`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Division Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {week.divisions.map((division, idx) => {
                  const colors = DIVISION_COLORS[division] || {
                    bg: "bg-slate-50",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };

                  const isChosenDivision =
                    week.weekNumber === 1 &&
                    (division === schedule.primaryDivisionChoice ||
                      division === schedule.secondaryDivisionChoice);

                  return (
                    <div
                      key={`${week.weekNumber}-${division}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}
                      >
                        <Briefcase className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${colors.text}`}>
                          {getTeamDisplayName(division as KriTeam)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hari ke-{idx + 1}
                          {isChosenDivision && " • Divisi Pilihan ⭐"}
                        </p>
                      </div>
                      {isPastWeek && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                      {isCurrentWeek && (
                        <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
