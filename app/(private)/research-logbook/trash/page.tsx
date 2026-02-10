"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Trash2,
  Filter,
  Search,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  getLogbooks,
  restoreLogbook,
  permanentDeleteLogbook,
} from "@/lib/firebase/services/logbook-service";
import { ResearchLogbook } from "@/schemas/research-logbook";
import {
  KriTeam,
  getTeamDisplayName,
  CompetitionAssignment,
} from "@/schemas/users";

import { LogbookCard } from "../_components/logbook-card";

export default function TrashLogbookPage() {
  const router = useRouter();
  const { assignments, userProfile, user } = useDashboard();

  const [logbooks, setLogbooks] = useState<ResearchLogbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const userTeam = useMemo((): KriTeam | null => {
    if (!assignments?.competitions) return null;
    const activeAssignment = assignments.competitions.find(
      (c: CompetitionAssignment) => c.isActive,
    );
    return activeAssignment?.team || null;
  }, [assignments]);

  const userRolePosition = useMemo(() => {
    if (!userTeam || !assignments?.competitions) return null;
    const teamAssignment = assignments.competitions.find(
      (comp: CompetitionAssignment) => comp.team === userTeam && comp.isActive,
    );
    return teamAssignment?.managementPosition || null;
  }, [userTeam, assignments]);

  const fetchData = useCallback(async () => {
    if (!userTeam || !user || !userProfile || !assignments) return;

    try {
      const logbooksData = await getLogbooks({
        team: userTeam,
        currentUserId: user.uid,
        userRolePosition: userRolePosition || undefined,
        trashed: true,
      });
      setLogbooks(logbooksData);
    } catch (error) {
      console.error("Error fetching trash data:", error);
      throw error;
    }
  }, [userTeam, user, userProfile, assignments, userRolePosition]);

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
        toast.error("Gagal memuat data sampah");
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, [fetchData, userTeam, user]);

  const handleRestore = async (logbook: ResearchLogbook) => {
    try {
      await restoreLogbook(logbook.id, {
        id: user!.uid,
        name: userProfile!.fullName,
      });
      toast.success("Logbook berhasil dipulihkan");
      fetchData();
    } catch (error) {
      toast.error("Gagal memulihkan logbook");
      console.error(error);
    }
  };

  const handlePermanentDelete = async (logbook: ResearchLogbook) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus logbook ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;

    try {
      await permanentDeleteLogbook(logbook.id);
      toast.success("Logbook dihapus permanen");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus logbook permanen");
      console.error(error);
    }
  };

  const filteredLogbooks = logbooks.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Memuat data sampah...</p>
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        <div className="space-y-1 px-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-destructive" />
            Sampah Logbook
          </h1>
        </div>
        <Separator />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-amber-600 mb-4" />
            <h3 className="text-lg font-medium">Akses Terbatas</h3>
            <p className="text-sm text-slate-500 mt-2">
              Anda belum terdaftar dalam tim KRI manapun.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 px-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 h-8 w-8"
              onClick={() => router.push("/research-logbook")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-destructive">
              <Trash2 className="h-6 w-6" />
              Sampah Logbook
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Logbook yang dihapus sementara dari tim{" "}
            <Badge variant="outline" className="ml-1">
              {getTeamDisplayName(userTeam)}
            </Badge>
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari logbook sampah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
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
      </div>

      {filteredLogbooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
              <Trash2 className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Belum ada logbook di sampah
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              {searchQuery || categoryFilter !== "all"
                ? "Tidak ada logbook sampah yang cocok dengan filter Anda."
                : "Logbook yang dihapus akan muncul di sini sebelum dihapus permanen."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredLogbooks.map((logbook) => (
            <LogbookCard
              key={logbook.id}
              logbook={logbook}
              onView={() => {}} // No detail view in trash usually, or maybe readonly
              isTrash={true}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
