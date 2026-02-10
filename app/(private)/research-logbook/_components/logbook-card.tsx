import {
  Calendar,
  Clock,
  ChevronRight,
  Users,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  ResearchLogbook,
  getLogbookStatusLabel,
  getLogbookStatusBadgeColor,
  getActivityCategoryLabel,
  getActivityCategoryBadgeColor,
} from "@/schemas/research-logbook";

const toDate = (value: Date | Timestamp): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return value;
};

const formatDate = (date: Date | Timestamp) => {
  return format(toDate(date), "d MMM yyyy", { locale: idLocale });
};

const formatDuration = (hours: number | undefined): string => {
  if (!hours) return "-";
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  return `${hours} jam`;
};

interface LogbookCardProps {
  logbook: ResearchLogbook;
  onView: (logbook: ResearchLogbook) => void;
  isTrash?: boolean;
  onRestore?: (logbook: ResearchLogbook) => void;
  onPermanentDelete?: (logbook: ResearchLogbook) => void;
  onSoftDelete?: (logbook: ResearchLogbook) => void;
}

export function LogbookCard({
  logbook,
  onView,
  isTrash,
  onRestore,
  onPermanentDelete,
  onSoftDelete,
}: LogbookCardProps) {
  return (
    <Card
      className={`h-full flex flex-col hover:shadow-md transition-all group cursor-pointer ${
        isTrash
          ? "border-red-200/50 bg-red-50/10 dark:border-red-900/20"
          : "hover:border-primary/30 dark:bg-slate-950/50"
      }`}
      onClick={() => !isTrash && onView(logbook)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge
            variant="secondary"
            className={`text-xs font-normal ${getActivityCategoryBadgeColor(logbook.category)} border-0`}
          >
            {getActivityCategoryLabel(logbook.category)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${getLogbookStatusBadgeColor(logbook.status)}`}
          >
            {getLogbookStatusLabel(logbook.status)}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {logbook.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
          {logbook.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <span>Tanggal:</span>
            <span className="ml-auto font-medium">
              {formatDate(logbook.activityDate)}
            </span>
          </div>
          {logbook.durationHours && (
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <Clock className="mr-2 h-4 w-4 text-slate-400" />
              <span>Durasi:</span>
              <span className="ml-auto font-medium">
                {formatDuration(logbook.durationHours)}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter
        className={`pt-3 border-t ${
          isTrash
            ? "bg-red-50/50 dark:bg-red-900/10"
            : "bg-slate-50/50 dark:bg-slate-900/20"
        }`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            {logbook.authorName}
          </span>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {isTrash ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 px-2"
                  onClick={() => onRestore?.(logbook)}
                  title="Pulihkan"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Pulihkan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                  onClick={() => onPermanentDelete?.(logbook)}
                  title="Hapus Permanen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {onSoftDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                    onClick={() => onSoftDelete(logbook)}
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary group-hover:bg-primary/10 h-8 px-2"
                  onClick={() => onView(logbook)}
                >
                  Detail
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
