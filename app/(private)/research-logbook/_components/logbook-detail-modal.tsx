"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import {
  Calendar,
  Clock,
  User,
  Edit,
  Loader2,
  FileText,
  Target,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";

import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea"; // Ensure this import exists or add it
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getTeamMembers,
  TeamMember,
} from "@/lib/firebase/services/team-member-service";
import { KriTeam } from "@/schemas/users";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ResearchLogbook,
  getLogbookStatusLabel,
  getLogbookStatusBadgeColor,
  getActivityCategoryLabel,
  getActivityCategoryBadgeColor,
  LogbookHistory,
  LogbookHistoryAction,
} from "@/schemas/research-logbook";
import {
  getLogbookHistory,
  reviewLogbook,
} from "@/lib/firebase/services/logbook-service";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const toDate = (value: Date | Timestamp): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return value;
};

const formatDate = (date: Date | Timestamp) => {
  return format(toDate(date), "d MMMM yyyy", { locale: idLocale });
};

const formatDateTime = (date: Date | Timestamp) => {
  return format(toDate(date), "d MMMM yyyy, HH:mm", { locale: idLocale });
};

const formatDuration = (hours: number | undefined): string => {
  if (!hours) return "-";
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  return `${hours} jam`;
};

const getHistoryActionLabel = (action: LogbookHistoryAction) => {
  const labels: Record<LogbookHistoryAction, string> = {
    create: "Dibuat",
    update: "Diperbarui",
    status_change: "Status Berubah",
    invite: "Mengundang Kolaborator",
    remove_collaborator: "Menghapus Kolaborator",
  };
  return labels[action] || action;
};

const getFieldNameLabel = (field: string) => {
  const labels: Record<string, string> = {
    title: "Judul",
    category: "Kategori",
    description: "Deskripsi",
    achievements: "Hasil yang Dicapai",
    challenges: "Kendala",
    nextPlan: "Rencana Selanjutnya",
    durationHours: "Durasi (Jam)",
    status: "Status",
    activityDate: "Tanggal Kegiatan",
  };
  return labels[field] || field;
};

// =========================================================
// COMPONENT PROPS
// =========================================================

interface LogbookDetailModalProps {
  logbookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (logbook: ResearchLogbook) => void;
  currentUser?: { uid: string; displayName: string } | null;
  isLeader?: boolean;
  userTeam?: KriTeam | null;
  onUpdate?: () => void;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function LogbookDetailModal({
  logbookId,
  open,
  onOpenChange,
  onEdit,
  currentUser,
  isLeader,
  userTeam,
  onUpdate,
}: LogbookDetailModalProps) {
  const [logbook, setLogbook] = useState<ResearchLogbook | null>(null);
  const [history, setHistory] = useState<LogbookHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");

  // Review State
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Fetch Team Members for Collaborator Names
  useEffect(() => {
    async function fetchMembers() {
      if (!open || !userTeam) return;
      try {
        const members = await getTeamMembers(userTeam);
        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    }
    if (open && userTeam) {
      fetchMembers();
    }
  }, [open, userTeam]);

  // Fetch Logbook Detail
  useEffect(() => {
    async function fetchLogbook() {
      if (!logbookId) {
        setLogbook(null);
        return;
      }

      setIsLoading(true);
      try {
        const { getLogbookById } =
          await import("@/lib/firebase/services/logbook-service");
        const data = await getLogbookById(logbookId);
        setLogbook(data);
      } catch (error) {
        console.error("Error fetching logbook:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open && logbookId) {
      fetchLogbook();
      setActiveTab("detail"); // Reset tab to detail on open
    }
  }, [logbookId, open]);

  // Fetch Logbook History when tab is active
  useEffect(() => {
    async function fetchHistory() {
      if (!logbookId || activeTab !== "history") return;

      setIsHistoryLoading(true);
      try {
        const historyData = await getLogbookHistory(logbookId);
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    }

    fetchHistory();
  }, [logbookId, activeTab]);

  const handleEdit = () => {
    if (logbook && onEdit) {
      onEdit(logbook);
      onOpenChange(false);
    }
  };

  const handleReview = async (status: "approved" | "needs_revision") => {
    if (!logbook || !currentUser) return;

    setIsReviewing(true);
    try {
      await reviewLogbook(
        logbook.id,
        status,
        { id: currentUser.uid, name: currentUser.displayName },
        status === "needs_revision" ? reviewNote : undefined,
      );

      toast.success(
        status === "approved"
          ? "Logbook disetujui"
          : "Permintaan revisi dikirim",
      );
      setReviewNote("");
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Gagal memproses review");
      console.error(error);
    } finally {
      setIsReviewing(false);
    }
  };

  const getCollaboratorNames = () => {
    if (!logbook?.collaboratorIds || teamMembers.length === 0) return [];
    return logbook.collaboratorIds.map((id) => {
      const member = teamMembers.find((m) => m.id === id);
      return member ? member.fullName : "Unknown";
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail Logbook
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap dan riwayat perubahan logbook
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-2 border-b bg-muted/20">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-4">
              <TabsTrigger
                value="detail"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 px-1"
              >
                Detail Informasi
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 px-1"
              >
                Riwayat Perubahan
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="detail"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col h-full"
          >
            <ScrollArea className="h-full">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Memuat data logbook...
                    </p>
                  </div>
                ) : !logbook ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Logbook tidak ditemukan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-6">
                    {/* Header Info */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={`${getActivityCategoryBadgeColor(logbook.category)} border-0`}
                        >
                          {getActivityCategoryLabel(logbook.category)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getLogbookStatusBadgeColor(logbook.status)}
                        >
                          {getLogbookStatusLabel(logbook.status)}
                        </Badge>
                      </div>

                      <h2 className="text-2xl font-bold leading-tight">
                        {logbook.title}
                      </h2>
                    </div>

                    <Separator />

                    {/* Meta Information */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Tanggal Kegiatan:
                        </span>
                        <span className="font-medium">
                          {formatDate(logbook.activityDate)}
                        </span>
                      </div>

                      {logbook.durationHours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Durasi:</span>
                          <span className="font-medium">
                            {formatDuration(logbook.durationHours)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Dibuat oleh:
                        </span>
                        <span className="font-medium">
                          {logbook.authorName}
                        </span>
                      </div>

                      {/* Collaborators */}
                      {logbook.collaboratorIds &&
                        logbook.collaboratorIds.length > 0 && (
                          <div className="flex items-start gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground whitespace-nowrap">
                              Kolaborator:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {teamMembers.length > 0 ? (
                                getCollaboratorNames().map((name, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs font-normal"
                                  >
                                    {name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs italic">
                                  Memuat...
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Deskripsi Kegiatan
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {logbook.description}
                      </p>
                    </div>

                    {/* Achievements */}
                    {logbook.achievements && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-600" />
                            Hasil yang Dicapai
                          </h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {logbook.achievements}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Challenges */}
                    {logbook.challenges && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Kendala yang Dihadapi
                          </h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {logbook.challenges}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Next Plan */}
                    {logbook.nextPlan && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            Rencana Selanjutnya
                          </h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {logbook.nextPlan}
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Timestamps */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Dibuat: {formatDateTime(logbook.createdAt)}</p>
                      <p>
                        Terakhir diubah: {formatDateTime(logbook.updatedAt)}
                      </p>
                    </div>

                    {/* Edit Button */}
                    {/* Edit Button */}
                    {onEdit &&
                      logbook.status === "draft" &&
                      currentUser?.uid === logbook.authorId && (
                        <Button onClick={handleEdit} className="w-full gap-2">
                          <Edit className="h-4 w-4" />
                          Edit Logbook
                        </Button>
                      )}

                    {/* Review Actions for Leader */}
                    {isLeader && logbook.status === "submitted" && (
                      <div className="flex gap-2 w-full pt-4 border-t">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                              Minta Revisi
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <h4 className="font-medium leading-none">
                                Catatan Revisi
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Berikan alasan atau detail revisi yang
                                diperlukan.
                              </p>
                              <Textarea
                                placeholder="Contoh: Deskripsi kurang detail..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                className="h-24"
                              />
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={!reviewNote.trim() || isReviewing}
                                onClick={() => handleReview("needs_revision")}
                              >
                                {isReviewing && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Kirim Revisi
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button
                          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleReview("approved")}
                          disabled={isReviewing}
                        >
                          {isReviewing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Setujui
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="history"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col h-full"
          >
            <ScrollArea className="h-full">
              <div className="p-6">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Memuat riwayat perubahan...
                    </p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Belum ada riwayat perubahan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-6">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="relative pl-6 pb-6 border-l last:border-0 last:pb-0"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {getHistoryActionLabel(item.action)} oleh{" "}
                              {item.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground italic">
                              &quot;{item.description}&quot;
                            </p>
                          )}

                          {/* Changes Details */}
                          {item.changes && item.changes.length > 0 && (
                            <div className="mt-2 bg-muted/50 rounded-md p-3 text-xs space-y-2 border">
                              {item.changes.map((change, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-[1fr,2fr] gap-2"
                                >
                                  <span className="font-medium text-muted-foreground">
                                    {getFieldNameLabel(change.field)}:
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-red-500/80 line-through text-[10px]">
                                      {String(change.oldValue || "-")}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      &rarr; {String(change.newValue || "-")}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
