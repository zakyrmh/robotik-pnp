"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BookMarked,
  Plus,
  Calendar,
  Clock,
  Filter,
  Search,
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDashboard } from "@/components/dashboard/dashboard-context";

import {
  getLogbooks,
  getLogbookStats,
  deleteLogbook,
  LogbookStats,
} from "@/lib/firebase/services/logbook-service";
import { ResearchLogbook } from "@/schemas/research-logbook";
import { LogbookFormModal } from "./_components/logbook-form-modal";
import { TeamMembersCard } from "./_components/team-members-card";
import { LogbookDetailModal } from "./_components/logbook-detail-modal";
import { LogbookEditModal } from "./_components/logbook-edit-modal";
import {
  KriTeam,
  getTeamDisplayName,
  CompetitionAssignment,
} from "@/schemas/users";
import { LogbookCard } from "./_components/logbook-card";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

// =========================================================
// SUB-COMPONENTS
// =========================================================

interface StatsCardProps {
  stats: LogbookStats;
}

function StatsCards({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.totalEntries}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                Total Entri
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.totalHours}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                Total Jam
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {stats.entriesByStatus.submitted}
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                Menunggu Review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats.entriesByStatus.approved}
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                Disetujui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function ResearchLogbookPage() {
  const router = useRouter();
  const { assignments, userProfile, user } = useDashboard();

  const [logbooks, setLogbooks] = useState<ResearchLogbook[]>([]);
  const [stats, setStats] = useState<LogbookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // State for detail view
  const [selectedLogbookId, setSelectedLogbookId] = useState<string | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // State for edit
  const [editingLogbook, setEditingLogbook] = useState<ResearchLogbook | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userTeam = useMemo((): KriTeam | null => {
    if (!assignments?.competitions) return null;

    // Find active competition assignment
    const activeAssignment = assignments.competitions.find(
      (c: CompetitionAssignment) => c.isActive,
    );

    return activeAssignment?.team || null;
  }, [assignments]);

  // Get user role position
  const userRolePosition = useMemo(() => {
    if (!userTeam || !assignments?.competitions) return null;
    const teamAssignment = assignments.competitions.find(
      (comp: CompetitionAssignment) => comp.team === userTeam && comp.isActive,
    );
    return teamAssignment?.managementPosition || null;
  }, [userTeam, assignments]);

  const isLeader = useMemo(() => {
    return ["chairman", "vice_chairman"].includes(userRolePosition || "");
  }, [userRolePosition]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!userTeam || !user || !userProfile || !assignments) return;

    try {
      // Fetch logbooks for user's team
      const logbooksData = await getLogbooks({
        team: userTeam,
        currentUserId: user.uid,
        userRolePosition: userRolePosition || undefined,
        trashed: false,
      });
      setLogbooks(logbooksData);

      // Fetch stats
      const statsData = await getLogbookStats(userTeam);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching logbook data:", error);
      throw error;
    }
  }, [userTeam, user, userProfile, assignments, userRolePosition]);

  // Fetch data on mount
  useEffect(() => {
    async function initData() {
      if (!userTeam || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await fetchData();
      } catch {
        toast.error("Gagal memuat data logbook");
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [fetchData, userTeam, user]);

  // Handle Soft Delete
  const handleSoftDelete = async (logbook: ResearchLogbook) => {
    if (!confirm("Apakah Anda yakin ingin memindahkan logbook ini ke sampah?"))
      return;

    try {
      await deleteLogbook(logbook.id, {
        id: user!.uid,
        name: userProfile!.fullName,
      });
      toast.success("Logbook dipindahkan ke sampah");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus logbook");
      console.error(error);
    }
  };

  // Handle logbook view
  const handleViewLogbook = (logbook: ResearchLogbook) => {
    setSelectedLogbookId(logbook.id);
    setIsDetailModalOpen(true);
  };

  // Handle logbook edit
  const handleEditLogbook = (logbook: ResearchLogbook) => {
    setEditingLogbook(logbook);
    setIsEditModalOpen(true);
  };

  // Handle create new logbook
  const handleCreateLogbook = () => {
    setIsFormModalOpen(true);
  };

  // Handle successful logbook creation/update
  const handleDataUpdate = async () => {
    await fetchData();
  };

  // Filter logbooks
  const filteredLogbooks = logbooks.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || log.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Memuat data...</p>
      </div>
    );
  }

  // Not assigned to any KRI team
  if (!userTeam) {
    return (
      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        {/* Header */}
        <div className="space-y-1 px-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            Logbook Riset
          </h1>
          <p className="text-sm text-muted-foreground">
            Catatan kegiatan riset dan pengembangan tim KRI
          </p>
        </div>

        <Separator />

        {/* No Access Message */}
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Akses Terbatas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2">
              Anda belum terdaftar dalam tim KRI manapun. Fitur Logbook Riset
              hanya dapat diakses oleh anggota tim KRI (KRAI, KRSBI-H, KRSBI-B,
              KRSTI, KRSRI).
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Silakan hubungi administrator untuk mendaftarkan Anda ke tim KRI.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 px-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            Logbook Riset
          </h1>
          <p className="text-sm text-muted-foreground">
            Catatan kegiatan riset dan pengembangan tim{" "}
            <Badge variant="outline" className="ml-1">
              {getTeamDisplayName(userTeam)}
            </Badge>
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row item-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/research-logbook/trash")}
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sampah
            </Button>
          </div>
          <Button onClick={handleCreateLogbook} className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Logbook
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards - Only show in active view */}
      {stats && <StatsCards stats={stats} />}

      {/* Team Members Card - Only show in active view */}
      <TeamMembersCard team={userTeam} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari logbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Menunggu Review</SelectItem>
              <SelectItem value="needs_revision">Perlu Revisi</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="design">Perancangan</SelectItem>
            <SelectItem value="fabrication">Fabrikasi</SelectItem>
            <SelectItem value="assembly">Perakitan</SelectItem>
            <SelectItem value="programming">Pemrograman</SelectItem>
            <SelectItem value="testing">Pengujian</SelectItem>
            <SelectItem value="debugging">Debugging</SelectItem>
            <SelectItem value="documentation">Dokumentasi</SelectItem>
            <SelectItem value="meeting">Rapat/Diskusi</SelectItem>
            <SelectItem value="training">Pelatihan</SelectItem>
            <SelectItem value="competition_prep">
              Persiapan Kompetisi
            </SelectItem>
            <SelectItem value="other">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logbook Grid */}
      {filteredLogbooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
              <BookMarked className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Belum ada logbook
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Tidak ada logbook yang cocok dengan filter Anda."
                : "Mulai catat kegiatan riset tim Anda dengan membuat logbook baru."}
            </p>
            {!(
              searchQuery ||
              statusFilter !== "all" ||
              categoryFilter !== "all"
            ) && (
              <Button onClick={handleCreateLogbook} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Buat Logbook Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredLogbooks.map((logbook) => (
            <LogbookCard
              key={logbook.id}
              logbook={logbook}
              onView={handleViewLogbook}
              onSoftDelete={handleSoftDelete}
            />
          ))}
        </div>
      )}

      {/* Logbook Form Modal (Create) */}
      {userTeam && userProfile && user && (
        <LogbookFormModal
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          userTeam={userTeam}
          authorId={user.uid}
          authorName={userProfile.fullName}
          onSuccess={handleDataUpdate}
        />
      )}

      {/* Logbook Detail Modal */}
      <LogbookDetailModal
        logbookId={selectedLogbookId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onEdit={handleEditLogbook}
        currentUser={
          user && userProfile
            ? { uid: user.uid, displayName: userProfile.fullName }
            : null
        }
        isLeader={isLeader}
        userTeam={userTeam}
        onUpdate={handleDataUpdate}
      />

      {/* Logbook Edit Modal */}
      <LogbookEditModal
        logbook={editingLogbook}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleDataUpdate}
        currentUserId={user?.uid}
        currentUserName={userProfile?.fullName}
      />
    </div>
  );
}
