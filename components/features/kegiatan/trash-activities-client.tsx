"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive01Icon,
  Delete01Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  hardDeleteActivity,
  restoreActivity,
  type ActivityItem,
} from "@/lib/actions/activities";

interface TrashActivitiesClientProps {
  initialDeletedActivities: ActivityItem[];
  targetAudience: "caang" | "anggota";
  backPath: string;
  userRole?: string;
}

function formatIndoDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

export function TrashActivitiesClient({
  initialDeletedActivities,
  targetAudience: initialAudienceProp,
  backPath,
  userRole,
}: TrashActivitiesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeAudience, setActiveAudience] = useState<"caang" | "anggota">(
    initialAudienceProp || (userRole === "admin-or" ? "caang" : "anggota"),
  );
  const [deletedActivities, setDeletedActivities] = useState<ActivityItem[]>(
    initialDeletedActivities,
  );
  const [hardDeleting, setHardDeleting] = useState<ActivityItem | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const canSwitchAudience = userRole === "super-admin" || userRole === "admin-or";

  const handleAudienceChange = async (aud: "caang" | "anggota") => {
    setActiveAudience(aud);
    setLoadingData(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("target_audience", aud)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      setDeletedActivities((data as ActivityItem[]) || []);
    } catch (err) {
      console.error("Gagal memuat sampah kegiatan:", err);
      toast.error("Gagal memuat sampah kegiatan.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleRestore = async (activityId: string) => {
    setRestoringId(activityId);
    const toastId = toast.loading("Memulihkan kegiatan dari tempat sampah...");
    try {
      const res = await restoreActivity(activityId);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setDeletedActivities((prev) => prev.filter((item) => item.id !== activityId));
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi saat memulihkan kegiatan.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleting) return;
    setIsHardDeleting(true);
    const toastId = toast.loading("Menghapus kegiatan secara permanen...");
    try {
      const res = await hardDeleteActivity(hardDeleting.id);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message);
        setDeletedActivities((prev) => prev.filter((item) => item.id !== hardDeleting.id));
        setHardDeleting(null);
        startTransition(() => router.refresh());
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan koneksi saat menghapus permanen.");
    } finally {
      setIsHardDeleting(false);
    }
  };

  const audienceLabel =
    activeAudience === "anggota" ? "Kegiatan Anggota" : "Kegiatan Caang";

  return (
    <div className="flex w-full max-w-7xl mx-auto flex-col gap-6 px-2 sm:px-4 lg:px-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-primary-soft text-primary shrink-0">
              <HugeiconsIcon icon={Archive01Icon} size={20} />
            </div>
            <div>
              <h1 className="font-display font-semibold tracking-tight text-lg sm:text-xl text-foreground">
                Tempat Sampah — {audienceLabel}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {deletedActivities.length} kegiatan terhapus · pulihkan atau
                hapus permanen
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(backPath)}
            className="w-full sm:w-auto rounded-md h-9 px-4 font-medium text-sm border-primary text-primary hover:bg-primary-soft"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} data-icon="inline-start" />
            Kembali ke Agenda
          </Button>
        </div>

        {canSwitchAudience && (
          <div className="flex border-b border-border pt-2 gap-2">
            <button
              type="button"
              onClick={() => handleAudienceChange("caang")}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                activeAudience === "caang"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sampah Caang
            </button>
            <button
              type="button"
              onClick={() => handleAudienceChange("anggota")}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                activeAudience === "anggota"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sampah Anggota
            </button>
          </div>
        )}
      </div>


      {/* ── Content Area ───────────────────────────────────────────────── */}
      {deletedActivities.length === 0 ? (
        <Empty className="border-border bg-card rounded-lg py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Archive01Icon} />
            </EmptyMedia>
            <EmptyTitle>Tempat sampah kosong</EmptyTitle>
            <EmptyDescription>
              Tidak ada agenda {audienceLabel.toLowerCase()} yang dihapus.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden border border-border bg-card rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface hover:bg-surface">
                  <TableHead className="w-24 text-center text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Banner
                  </TableHead>
                  <TableHead className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Nama Kegiatan
                  </TableHead>
                  <TableHead className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Tanggal &amp; Waktu
                  </TableHead>
                  <TableHead className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Dihapus Pada
                  </TableHead>
                  <TableHead className="w-56 text-center text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {deletedActivities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="text-center">
                      <div className="relative h-11 w-16 mx-auto rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center opacity-60">
                        {activity.banner_url ? (
                          <Image
                            src={activity.banner_url}
                            alt={activity.title}
                            fill
                            sizes="64px"
                            className="object-cover grayscale"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={18}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div
                        className="font-display font-medium text-foreground text-sm truncate max-w-65"
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                      <Badge className="mt-1 bg-muted text-muted-foreground border-border text-micro font-semibold uppercase">
                        Audience: {activity.target_audience}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={13}
                            className="text-muted-foreground shrink-0"
                          />
                          <span>
                            {new Date(activity.start_date).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-micro font-mono text-muted-foreground">
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={13}
                            className="text-muted-foreground shrink-0"
                          />
                          <span>
                            {new Date(activity.start_date).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}{" "}
                            WIB
                          </span>
                        </div>
                        {activity.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              size={13}
                              className="text-muted-foreground shrink-0"
                            />
                            <span className="truncate max-w-37.5">
                              {activity.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {activity.deleted_at
                        ? formatIndoDateTime(activity.deleted_at)
                        : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(activity.id)}
                          disabled={restoringId === activity.id}
                          className="rounded-md border-primary text-primary hover:bg-primary-soft h-8 px-3 font-medium text-xs"
                        >
                          <HugeiconsIcon
                            icon={ArrowReloadHorizontalIcon}
                            data-icon="inline-start"
                          />
                          {restoringId === activity.id ? "..." : "Pulihkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHardDeleting(activity)}
                          className="rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 h-8 px-3 font-medium text-xs"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            data-icon="inline-start"
                          />
                          Hapus Permanen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Layout Cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {deletedActivities.map((activity) => (
              <Card key={activity.id} className="gap-3 opacity-90">
                <CardHeader className="gap-1">
                  <span className="text-micro text-muted-foreground">
                    Dihapus pada:{" "}
                    {activity.deleted_at
                      ? formatIndoDateTime(activity.deleted_at)
                      : "—"}
                  </span>
                  <CardTitle className="font-display font-medium text-sm text-foreground truncate">
                    {activity.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-1.5 text-sm text-foreground">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <span>
                      {new Date(activity.start_date).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  {activity.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={13}
                        className="text-muted-foreground shrink-0"
                      />
                      <span>{activity.location}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(activity.id)}
                    disabled={restoringId === activity.id}
                    className="flex-1 rounded-md border-primary text-primary hover:bg-primary-soft h-9 font-medium text-xs"
                  >
                    <HugeiconsIcon
                      icon={ArrowReloadHorizontalIcon}
                      data-icon="inline-start"
                    />
                    {restoringId === activity.id ? "Memulihkan..." : "Pulihkan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHardDeleting(activity)}
                    className="flex-1 rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 h-9 font-medium text-xs"
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      data-icon="inline-start"
                    />
                    Hapus Permanen
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Alert Dialog: Konfirmasi Hard Delete ───────────────────────── */}
      <AlertDialog
        open={!!hardDeleting}
        onOpenChange={(open) => {
          if (!open && !isHardDeleting) setHardDeleting(null);
        }}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Delete01Icon} />
            </AlertDialogMedia>
            <AlertDialogTitle className="font-display font-semibold">
              Hapus Kegiatan Permanen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Peringatan: tindakan ini tidak dapat dibatalkan. Seluruh data
              kegiatan dan riwayat presensi terkait akan dihapus secara permanen
              dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setHardDeleting(null)}
              disabled={isHardDeleting}
              className="rounded-md"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              disabled={isHardDeleting}
              variant="destructive"
              className="rounded-md"
            >
              {isHardDeleting ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isPending && (
        <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-md shadow-soft">
          Memperbarui data...
        </div>
      )}
    </div>
  );
}
