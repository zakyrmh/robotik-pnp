"use client";

import Link from "next/link";
import Image from "next/image";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  ClipboardCheck,
  Copy,
  Download,
  IdCard,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  correctEventCheckinAction,
  exportEventCheckinsAction,
  getEventCheckinMetricsAction,
  getEventCheckinRegistrationAction,
  recordAdvisorBadgeAction,
  recordEventCheckinsAction,
  searchEventCheckinsAction,
} from "@/lib/actions/event-checkin";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/event-registration";
import type {
  EventCheckinAccess,
  EventCheckinAction,
  EventCheckinAttendanceFilter,
  EventCheckinBadgeFilter,
  EventCheckinMetrics,
  EventCheckinRegistration,
  EventCheckinSearchRow,
} from "@/types/event-checkin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 20;

type Feedback = { tone: "success" | "error"; message: string } | null;
type ProxyRole = "leader" | "advisor";
type CorrectionDraft = {
  target: "member" | "advisor";
  field: "attendance" | "badge";
  memberId?: string;
  expectedVersion: number;
  label: string;
};

interface MrcCheckinDeskProps {
  initialRows: EventCheckinSearchRow[];
  initialTotal: number;
  initialMetrics: EventCheckinMetrics;
  categories: Pick<EventCategory, "id" | "name">[];
  access: EventCheckinAccess;
}

const emptyMetrics: EventCheckinMetrics = {
  eligibleMembers: 0,
  presentMembers: 0,
  handedBadges: 0,
  representedBadges: 0,
  teamsNone: 0,
  teamsPartial: 0,
  teamsComplete: 0,
  advisorBadgesHanded: 0,
  advisorBadgesPending: 0,
};

function paymentLabel(status: EventCheckinSearchRow["payment_status"]) {
  const labels: Record<EventCheckinSearchRow["payment_status"], string> = {
    unpaid: "Belum bayar",
    pending: "Menunggu bayar",
    pending_verification: "Verifikasi pembayaran",
    paid: "Lunas",
    rejected: "Ditolak",
    expired: "Kedaluwarsa",
    failed: "Gagal",
  };
  return labels[status];
}

function teamAttendanceStatus(presentCount: number, memberCount: number) {
  if (presentCount === 0) {
    return {
      label: "Belum hadir",
      Icon: Clock,
      className: "border-warning/30 bg-warning-soft text-warning",
    };
  }
  if (presentCount === memberCount) {
    return {
      label: "Hadir lengkap",
      Icon: Check,
      className: "border-success/30 bg-success-soft text-success",
    };
  }
  return {
    label: "Hadir sebagian",
    Icon: Users,
    className: "border-primary/30 bg-primary-soft text-primary",
  };
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <Icon aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <strong className="font-mono text-xl font-semibold tracking-tight text-foreground">
          {value}
        </strong>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function MrcCheckinDesk({
  initialRows,
  initialTotal,
  initialMetrics,
  categories,
  access,
}: MrcCheckinDeskProps) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [metrics, setMetrics] = useState(initialMetrics ?? emptyMetrics);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [attendance, setAttendance] =
    useState<EventCheckinAttendanceFilter>("all");
  const [badge, setBadge] = useState<EventCheckinBadgeFilter>("all");
  const [page, setPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | null
  >(null);
  const [registration, setRegistration] =
    useState<EventCheckinRegistration | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [proxyRole, setProxyRole] = useState<ProxyRole>("leader");
  const [correction, setCorrection] = useState<CorrectionDraft | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSequence = useRef(0);
  const detailSequence = useRef(0);
  const isInitialSearch = useRef(true);

  const runSearch = useCallback(
    async (nextPage: number) => {
      const sequence = ++searchSequence.current;
      setIsSearching(true);
      const result = await searchEventCheckinsAction({
        query,
        categoryId,
        attendance,
        badge,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      if (sequence !== searchSequence.current) return;
      setIsSearching(false);
      if (!result.success) {
        setFeedback({ tone: "error", message: result.error });
        return;
      }
      setRows(result.data.rows);
      setTotal(result.data.total);
      setPage(nextPage);
    },
    [attendance, badge, categoryId, query],
  );

  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(() => void runSearch(0));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [runSearch]);

  const loadDetail = useCallback(async (registrationId: string) => {
    const sequence = ++detailSequence.current;
    setSelectedRegistrationId(registrationId);
    setIsLoadingDetail(true);
    setSelectedMemberIds(new Set());
    const result = await getEventCheckinRegistrationAction(registrationId);
    if (sequence !== detailSequence.current) return;
    setIsLoadingDetail(false);
    if (!result.success) {
      setRegistration(null);
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    setRegistration(result.data);
  }, []);

  const refreshMetrics = useCallback(async () => {
    const result = await getEventCheckinMetricsAction();
    if (result.success) setMetrics(result.data);
  }, []);

  async function refreshWorkspace(message?: string) {
    await Promise.all([
      selectedRegistrationId
        ? loadDetail(selectedRegistrationId)
        : Promise.resolve(),
      runSearch(page),
      refreshMetrics(),
    ]);
    if (message) setFeedback({ tone: "success", message });
  }

  const selectedMembers = useMemo(
    () =>
      registration?.members.filter((member) =>
        selectedMemberIds.has(member.id),
      ) ?? [],
    [registration, selectedMemberIds],
  );

  const eligibleMemberIds = useMemo(
    () =>
      registration?.members
        .filter(
          (member) =>
            !member.checkin?.checked_in_at || !member.checkin.badge_handed_at,
        )
        .map((member) => member.id) ?? [],
    [registration],
  );

  const leader = registration?.members.find((member) =>
    member.role_in_team?.toLowerCase().includes("ketua"),
  );

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedMemberIds((current) =>
      current.size === eligibleMemberIds.length
        ? new Set()
        : new Set(eligibleMemberIds),
    );
  }

  async function recordMembers(
    action: EventCheckinAction,
    representative?: ProxyRole,
  ) {
    if (!registration || selectedMembers.length === 0) return;
    setIsMutating(true);
    setFeedback(null);
    const expectedVersions = Object.fromEntries(
      selectedMembers.map((member) => [
        member.id,
        member.checkin?.version ?? 0,
      ]),
    );
    const result = await recordEventCheckinsAction({
      registrationId: registration.id,
      memberIds: selectedMembers.map((member) => member.id),
      action,
      expectedVersions,
      proxyRole: representative,
      proxyMemberId: representative === "leader" ? leader?.id : undefined,
    });
    setIsMutating(false);
    if (!result.success) {
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    setProxyOpen(false);
    await refreshWorkspace(result.message);
  }

  async function recordAdvisor(recipientRole: "advisor" | "leader") {
    if (!registration) return;
    setIsMutating(true);
    setFeedback(null);
    const result = await recordAdvisorBadgeAction({
      registrationId: registration.id,
      recipientRole,
      proxyMemberId: recipientRole === "leader" ? leader?.id : undefined,
      expectedVersion: registration.advisor_badge_version,
    });
    setIsMutating(false);
    if (!result.success) {
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    await refreshWorkspace(result.message);
  }

  async function submitCorrection() {
    if (!registration || !correction) return;
    setIsMutating(true);
    setFeedback(null);
    const result = await correctEventCheckinAction({
      registrationId: registration.id,
      target: correction.target,
      field: correction.field,
      memberId: correction.memberId,
      expectedVersion: correction.expectedVersion,
      reason: correctionReason,
    });
    setIsMutating(false);
    if (!result.success) {
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    setCorrection(null);
    setCorrectionReason("");
    await refreshWorkspace(result.message);
  }

  async function exportCsv() {
    setIsExporting(true);
    const result = await exportEventCheckinsAction();
    setIsExporting(false);
    if (!result.success) {
      setFeedback({ tone: "error", message: result.error });
      return;
    }
    const blob = new Blob([result.data.csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.data.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Laporan CSV berhasil dibuat." });
  }

  async function copyBadgeCode(code: string, memberName: string) {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback({
        tone: "success",
        message: `Kode kokarde ${memberName} disalin.`,
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Kode tidak dapat disalin. Pilih teks kode secara manual.",
      });
    }
  }

  function nextParticipant() {
    detailSequence.current += 1;
    setRegistration(null);
    setSelectedRegistrationId(null);
    setSelectedMemberIds(new Set());
    setQuery("");
    setFeedback(null);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  const paid = registration?.payment_status === "paid";
  const presentMemberCount =
    registration?.members.filter((member) => member.checkin?.checked_in_at)
      .length ?? 0;
  const badgeHandedCount =
    registration?.members.filter((member) => member.checkin?.badge_handed_at)
      .length ?? 0;
  const memberCount = registration?.members.length ?? 0;
  const currentTeamAttendanceStatus = teamAttendanceStatus(
    presentMemberCount,
    memberCount,
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allEligibleSelected =
    eligibleMemberIds.length > 0 &&
    eligibleMemberIds.every((id) => selectedMemberIds.has(id));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <ClipboardCheck aria-hidden="true" />
            Operasional satu kali · 3–5 meja aktif
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Presensi & Kokarde MRC
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cari peserta atau tim, cocokkan kode kokarde, lalu selesaikan
            skenario normal dalam satu klik. Status antar-meja dilindungi dari
            pembaruan bersamaan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/manajemen-event/verifikasi"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Scanner Lapangan (Anti-Joki)
          </Link>
          {access.canCorrect && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={isExporting}
              onClick={() => void exportCsv()}
            >
              {isExporting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Download data-icon="inline-start" aria-hidden="true" />
              )}
              Ekspor CSV
            </Button>
          )}
        </div>
      </header>

      <section
        aria-label="Ringkasan daftar ulang"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Kehadiran peserta"
          value={`${metrics.presentMembers}/${metrics.eligibleMembers}`}
          description="Peserta lunas yang sudah hadir"
          icon={UserCheck}
        />
        <MetricCard
          label="Kokarde peserta"
          value={`${metrics.handedBadges}/${metrics.eligibleMembers}`}
          description={`${metrics.representedBadges} diserahkan melalui perwakilan`}
          icon={IdCard}
        />
        <MetricCard
          label="Tim selesai"
          value={String(metrics.teamsComplete)}
          description={`${metrics.teamsPartial} parsial · ${metrics.teamsNone} belum hadir`}
          icon={Users}
        />
        <MetricCard
          label="Kokarde pembimbing"
          value={String(metrics.advisorBadgesHanded)}
          description={`${metrics.advisorBadgesPending} masih menunggu`}
          icon={UserRoundCheck}
        />
      </section>

      {access.roleEvent === "panitia-pertandingan" && !access.isSuperAdmin && (
        <Alert>
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Mode baca saja</AlertTitle>
          <AlertDescription>
            Panitia pertandingan dapat melihat progres operasional tanpa foto,
            token QR, identitas penerima kokarde, atau tombol mutasi.
          </AlertDescription>
        </Alert>
      )}

      <div aria-live="polite" aria-atomic="true">
        {feedback && (
          <Alert
            variant={feedback.tone === "error" ? "destructive" : "default"}
          >
            {feedback.tone === "error" ? (
              <ShieldAlert aria-hidden="true" />
            ) : (
              <Check aria-hidden="true" />
            )}
            <AlertTitle>
              {feedback.tone === "error" ? "Belum berhasil" : "Tersimpan"}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.45fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Cari peserta atau tim</CardTitle>
            <CardDescription>
              Nama peserta, nama tim, instansi, atau kode pendaftaran.
            </CardDescription>
            {isSearching && (
              <CardAction>
                <Spinner />
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkin-search" className="sr-only">
                  Cari peserta atau tim
                </FieldLabel>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchInputRef}
                    id="checkin-search"
                    className="min-h-11 pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Contoh: Andi, Politeknik, MRC-..."
                    autoComplete="off"
                  />
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="checkin-category">Kategori</FieldLabel>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger
                      id="checkin-category"
                      className="min-h-11 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua kategori</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkin-attendance">
                    Kehadiran
                  </FieldLabel>
                  <Select
                    value={attendance}
                    onValueChange={(value) =>
                      setAttendance(value as EventCheckinAttendanceFilter)
                    }
                  >
                    <SelectTrigger
                      id="checkin-attendance"
                      className="min-h-11 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="none">Belum hadir</SelectItem>
                        <SelectItem value="partial">Sebagian hadir</SelectItem>
                        <SelectItem value="complete">Lengkap</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkin-badge">Kokarde</FieldLabel>
                  <Select
                    value={badge}
                    onValueChange={(value) =>
                      setBadge(value as EventCheckinBadgeFilter)
                    }
                  >
                    <SelectTrigger
                      id="checkin-badge"
                      className="min-h-11 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="pending">Belum lengkap</SelectItem>
                        <SelectItem value="complete">Lengkap</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{total} tim ditemukan</span>
              <span>
                Halaman {page + 1} dari {totalPages}
              </span>
            </div>

            {rows.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Tidak ada tim yang cocok</EmptyTitle>
                  <EmptyDescription>
                    Periksa ejaan atau longgarkan filter pencarian.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-2">
                {rows.map((row) => {
                  const isSelected =
                    row.registration_id === selectedRegistrationId;
                  const attendanceStatus = teamAttendanceStatus(
                    row.present_count,
                    row.member_count,
                  );
                  const AttendanceIcon = attendanceStatus.Icon;
                  return (
                    <button
                      key={row.registration_id}
                      type="button"
                      className={cn(
                        "flex min-h-11 w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/60",
                      )}
                      onClick={() => void loadDetail(row.registration_id)}
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">
                            {row.team_name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {row.institution}
                          </span>
                        </span>
                        <Badge
                          variant={
                            row.payment_status === "paid"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {paymentLabel(row.payment_status)}
                        </Badge>
                      </span>
                      <span className="flex w-full flex-wrap items-center gap-2 text-[0.6875rem] text-muted-foreground">
                        <code className="font-mono">
                          {row.registration_code}
                        </code>
                        <span aria-hidden="true">·</span>
                        <span>{row.category_name}</span>
                      </span>
                      <span className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "min-h-7 gap-1.5 px-2.5 text-xs font-semibold",
                            attendanceStatus.className,
                          )}
                        >
                          <AttendanceIcon aria-hidden="true" />
                          {attendanceStatus.label}
                        </Badge>
                        <span className="text-xs font-medium text-foreground">
                          {row.present_count} dari {row.member_count} hadir
                          <span
                            className="px-1.5 text-muted-foreground"
                            aria-hidden="true"
                          >
                            ·
                          </span>
                          Kokarde {row.badge_count}/{row.member_count}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={page === 0 || isSearching}
              onClick={() => void runSearch(page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={page + 1 >= totalPages || isSearching}
              onClick={() => void runSearch(page + 1)}
            >
              Berikutnya
            </Button>
          </CardFooter>
        </Card>

        <Card className="xl:sticky xl:top-6">
          {isLoadingDetail ? (
            <CardContent className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Memuat detail tim…
              </div>
            </CardContent>
          ) : !registration ? (
            <CardContent>
              <Empty className="min-h-80 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Pilih tim untuk mulai</EmptyTitle>
                  <EmptyDescription>
                    Detail peserta, kode kokarde, dan aksi daftar ulang akan
                    muncul di panel ini.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle className="truncate text-base">
                    {registration.team_name}
                  </CardTitle>
                  <CardDescription>
                    {registration.institution} · {registration.category?.name}
                  </CardDescription>
                  <code className="font-mono text-[0.6875rem] text-muted-foreground">
                    {registration.registration_code}
                  </code>
                </div>
                <CardAction className="flex items-center gap-2">
                  <Badge variant={paid ? "secondary" : "destructive"}>
                    {paymentLabel(registration.payment_status)}
                  </Badge>
                  <Button
                    type="button"
                    size="icon-lg"
                    variant="outline"
                    className="min-h-11 min-w-11"
                    aria-label="Muat ulang status tim"
                    disabled={isLoadingDetail || isMutating}
                    onClick={() =>
                      void refreshWorkspace("Status tim dimuat ulang.")
                    }
                  >
                    <RefreshCw aria-hidden="true" />
                  </Button>
                </CardAction>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <section
                  aria-label="Status kehadiran dan kokarde tim"
                  className="grid gap-3 border-y border-border py-3 sm:grid-cols-2"
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Status kehadiran tim
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "min-h-7 gap-1.5 px-2.5 text-xs font-semibold",
                          currentTeamAttendanceStatus.className,
                        )}
                      >
                        <currentTeamAttendanceStatus.Icon aria-hidden="true" />
                        {currentTeamAttendanceStatus.label}
                      </Badge>
                      <span className="text-xs font-medium text-foreground">
                        {presentMemberCount} dari {memberCount} anggota hadir
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Penyerahan kokarde peserta
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {badgeHandedCount} dari {memberCount} diserahkan
                    </p>
                  </div>
                </section>

                {!paid && (
                  <Alert variant="destructive">
                    <ShieldAlert aria-hidden="true" />
                    <AlertTitle>Belum dapat diproses</AlertTitle>
                    <AlertDescription>
                      Pembayaran harus berstatus lunas. Setelah peserta selesai
                      di meja verifikasi, tekan “Muat ulang status” di kanan
                      atas.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-foreground">Anggota tim</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedMemberIds.size} dipilih dari{" "}
                      {registration.members.length}
                    </p>
                  </div>
                  {access.canRecord && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11"
                      disabled={!paid || eligibleMemberIds.length === 0}
                      onClick={toggleAll}
                    >
                      {allEligibleSelected
                        ? "Batalkan semua"
                        : "Pilih yang belum selesai"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {registration.members.map((member) => {
                    const isSelected = selectedMemberIds.has(member.id);
                    const isComplete = Boolean(
                      member.checkin?.checked_in_at &&
                      member.checkin.badge_handed_at,
                    );
                    return (
                      <article
                        key={member.id}
                        className={cn(
                          "grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr]",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {access.canRecord && (
                            <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md focus-within:ring-2 focus-within:ring-ring/30">
                              <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                checked={isSelected}
                                disabled={!paid || isComplete || isMutating}
                                onChange={() => toggleMember(member.id)}
                                aria-label={`Pilih ${member.full_name}`}
                              />
                            </label>
                          )}
                          {member.photo_url ? (
                            <Image
                              src={member.photo_url}
                              alt={`Foto ${member.full_name}`}
                              width={48}
                              height={48}
                              className="size-12 rounded-md object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border">
                              <Users className="size-5" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-medium text-foreground">
                                {member.full_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {member.role_in_team || "Anggota"}
                              </p>
                            </div>
                            {access.canSeeSensitive &&
                              member.member_qr_token && (
                                <div className="flex max-w-full items-center gap-1 rounded-md bg-muted pl-2">
                                  <span className="flex min-w-0 flex-col py-1">
                                    <span className="text-[0.625rem] text-muted-foreground">
                                      Kode kokarde / QR
                                    </span>
                                    <code className="break-all font-mono text-[0.6875rem] text-foreground">
                                      {member.member_qr_token}
                                    </code>
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon-lg"
                                    variant="ghost"
                                    className="min-h-11 min-w-11"
                                    aria-label={`Salin kode kokarde ${member.full_name}`}
                                    onClick={() =>
                                      void copyBadgeCode(
                                        member.member_qr_token,
                                        member.full_name,
                                      )
                                    }
                                  >
                                    <Copy aria-hidden="true" />
                                  </Button>
                                </div>
                              )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "min-h-7 gap-1.5 px-2.5 text-xs font-semibold",
                                member.checkin?.checked_in_at
                                  ? "border-success/30 bg-success-soft text-success"
                                  : "border-warning/30 bg-warning-soft text-warning",
                              )}
                            >
                              {member.checkin?.checked_in_at ? (
                                <Check aria-hidden="true" />
                              ) : (
                                <Clock aria-hidden="true" />
                              )}
                              {member.checkin?.checked_in_at
                                ? "Hadir"
                                : "Belum Hadir"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="min-h-7 px-2.5 text-xs font-medium"
                            >
                              {member.checkin?.badge_handed_at
                                ? "Kokarde diserahkan"
                                : "Kokarde belum diserahkan"}
                            </Badge>
                            {member.checkin?.badge_handoff_type ===
                              "representative" && (
                              <Badge variant="outline">Diwakilkan</Badge>
                            )}
                          </div>
                          {member.checkin?.badge_recipient_name && (
                            <p className="text-xs text-muted-foreground">
                              Diterima {member.checkin.badge_recipient_name} (
                              {member.checkin.badge_recipient_role})
                            </p>
                          )}
                          {access.canCorrect && member.checkin && (
                            <div className="flex flex-wrap gap-2">
                              {member.checkin.checked_in_at && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="min-h-11"
                                  onClick={() =>
                                    setCorrection({
                                      target: "member",
                                      field: "attendance",
                                      memberId: member.id,
                                      expectedVersion:
                                        member.checkin?.version ?? 0,
                                      label: `kehadiran ${member.full_name}`,
                                    })
                                  }
                                >
                                  Koreksi hadir
                                </Button>
                              )}
                              {member.checkin.badge_handed_at && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="min-h-11"
                                  onClick={() =>
                                    setCorrection({
                                      target: "member",
                                      field: "badge",
                                      memberId: member.id,
                                      expectedVersion:
                                        member.checkin?.version ?? 0,
                                      label: `kokarde ${member.full_name}`,
                                    })
                                  }
                                >
                                  Koreksi kokarde
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {registration.advisor_name && (
                  <>
                    <Separator />
                    <section
                      className="flex flex-col gap-3"
                      aria-labelledby="advisor-badge-heading"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2
                            id="advisor-badge-heading"
                            className="font-medium text-foreground"
                          >
                            Kokarde pembimbing
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {registration.advisor_name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            registration.advisor_badge_handed_at
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {registration.advisor_badge_handed_at
                            ? "Sudah diserahkan"
                            : "Belum diserahkan"}
                        </Badge>
                      </div>
                      {registration.advisor_badge_recipient_name && (
                        <p className="text-xs text-muted-foreground">
                          Diterima {registration.advisor_badge_recipient_name} (
                          {registration.advisor_badge_recipient_role}) ·{" "}
                          {formatDateTime(registration.advisor_badge_handed_at)}
                        </p>
                      )}
                      {access.canRecord &&
                        !registration.advisor_badge_handed_at && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11"
                              disabled={!paid || isMutating}
                              onClick={() => void recordAdvisor("advisor")}
                            >
                              Serahkan ke Pembimbing
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11"
                              disabled={!paid || !leader || isMutating}
                              onClick={() => void recordAdvisor("leader")}
                            >
                              Diwakili Ketua
                            </Button>
                          </div>
                        )}
                      {access.canCorrect &&
                        registration.advisor_badge_handed_at && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="min-h-11 self-start"
                            onClick={() =>
                              setCorrection({
                                target: "advisor",
                                field: "badge",
                                expectedVersion:
                                  registration.advisor_badge_version,
                                label: `kokarde pembimbing ${registration.advisor_name}`,
                              })
                            }
                          >
                            Koreksi kokarde pembimbing
                          </Button>
                        )}
                    </section>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex-col items-stretch gap-3 border-t">
                {access.canRecord && (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      className="min-h-11"
                      disabled={
                        !paid || selectedMemberIds.size === 0 || isMutating
                      }
                      onClick={() => void recordMembers("present_and_badge")}
                    >
                      {isMutating ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <BadgeCheck
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                      )}
                      Hadir & Serahkan Kokarde
                    </Button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={
                          !paid || selectedMemberIds.size === 0 || isMutating
                        }
                        onClick={() => void recordMembers("present_only")}
                      >
                        Catat Hadir Saja
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={
                          !paid ||
                          selectedMemberIds.size === 0 ||
                          (!leader && !registration.advisor_name) ||
                          isMutating
                        }
                        onClick={() => {
                          setProxyRole(leader ? "leader" : "advisor");
                          setProxyOpen(true);
                        }}
                      >
                        Serahkan Kokarde (Diwakilkan)
                      </Button>
                    </div>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11"
                  onClick={nextParticipant}
                >
                  Lanjut ke peserta berikutnya
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      <Dialog open={proxyOpen} onOpenChange={setProxyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Serahkan kokarde melalui perwakilan</DialogTitle>
            <DialogDescription>
              Anggota yang dipilih tetap berstatus belum hadir. Sistem hanya
              mencatat penyerahan kokarde dan penerimanya.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="proxy-role">Penerima kokarde</FieldLabel>
              <Select
                value={proxyRole}
                onValueChange={(value) => setProxyRole(value as ProxyRole)}
              >
                <SelectTrigger id="proxy-role" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {leader && (
                      <SelectItem value="leader">
                        Ketua tim — {leader.full_name}
                      </SelectItem>
                    )}
                    {registration?.advisor_name && (
                      <SelectItem value="advisor">
                        Pembimbing — {registration.advisor_name}
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {selectedMemberIds.size} kokarde peserta akan diserahkan.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setProxyOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={
                isMutating ||
                (proxyRole === "leader" && !leader) ||
                (proxyRole === "advisor" && !registration?.advisor_name)
              }
              onClick={() => void recordMembers("proxy_badge", proxyRole)}
            >
              {isMutating && <Spinner data-icon="inline-start" />}
              Konfirmasi penyerahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(correction)}
        onOpenChange={(open) => {
          if (!open) {
            setCorrection(null);
            setCorrectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koreksi status daftar ulang</DialogTitle>
            <DialogDescription>
              Status {correction?.label} akan dikembalikan ke kondisi belum
              tercatat. Alasan koreksi disimpan di audit log.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field
              data-invalid={
                correctionReason.length > 0 &&
                correctionReason.trim().length < 3
              }
            >
              <FieldLabel htmlFor="correction-reason">
                Alasan koreksi
              </FieldLabel>
              <Textarea
                id="correction-reason"
                className="min-h-24"
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
                placeholder="Contoh: Kokarde salah diberikan kepada anggota lain"
                maxLength={500}
                aria-invalid={
                  correctionReason.length > 0 &&
                  correctionReason.trim().length < 3
                }
              />
              <FieldDescription>
                Minimal 3 karakter, maksimal 500 karakter.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setCorrection(null);
                setCorrectionReason("");
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              disabled={correctionReason.trim().length < 3 || isMutating}
              onClick={() => void submitCorrection()}
            >
              {isMutating && <Spinner data-icon="inline-start" />}
              Simpan koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
