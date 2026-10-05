"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Image01Icon,
  Loading03Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getPublicR2Url } from "@/lib/storage/r2";
import { getPiketMemberHistoryAction } from "@/lib/actions/piket";
import type { PiketMemberHistoryEntry } from "@/lib/repositories/piket";
import { PiketLogStatusBadge } from "./piket-status-badge";
import { PiketPhotoPreviewDialog } from "./piket-photo-preview-dialog";

/**
 * Drawer riwayat piket seorang anggota. Lazy-fetch via Server Action
 * `getPiketMemberHistoryAction` saat drawer terbuka dan `profileId` tersedia.
 *
 * Kontrak: dirender oleh `PiketHistoryClient`; `open` diturunkan dari
 * `selectedProfileId !== null`, `onOpenChange(false)` mengosongkan seleksi.
 */
export function PiketHistoryMemberDrawer({
  profileId,
  memberName,
  open,
  onOpenChange,
}: {
  profileId: string | null;
  memberName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PiketMemberHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    beforeUrl: string | null;
    afterUrl: string | null;
    activeTab: "before" | "after";
  } | null>(null);

  // Lazy fetch: hanya saat drawer benar-benar terbuka dan ada profileId valid.
  // Dependency pada `open` & `profileId` mencegah re-fetch loop saat state
  // internal (data/loading/error) berubah.
  useEffect(() => {
    if (!open || !profileId) {
      return;
    }

    let cancelled = false;
    // Sinkronkan state ke pemanggilan fetch eksternal; guard `open/profileId`
    // di atas mencegah cascading render berulang.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const res = await getPiketMemberHistoryAction(profileId);
        if (cancelled) return;
        if (res.success) {
          setData(res.data ?? []);
        } else {
          setError(res.message || "Gagal memuat histori piket anggota.");
        }
      } catch {
        if (cancelled) return;
        setError("Terjadi kesalahan saat memuat histori. Coba lagi nanti.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, profileId]);

  const sorted = data
    ? [...data].sort(
        (a, b) =>
          new Date(b.dutyDate).getTime() - new Date(a.dutyDate).getTime(),
      )
    : [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-slate-900"
        >
          <SheetHeader className="border-b border-slate-100 dark:border-slate-800">
            <SheetTitle className="font-display text-base font-medium text-[#0a192f] dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={20}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Riwayat Piket Anggota
            </SheetTitle>
            <SheetDescription className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {memberName}
            </SheetDescription>
          </SheetHeader>

          <div className="p-6">
            {loading ? (
              <div
                data-testid="piket-member-drawer-loading"
                className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400"
              >
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={24}
                  className="animate-spin text-[#1e3a8a] dark:text-blue-400"
                />
                <span className="font-mono text-xs">
                  Memuat histori piket...
                </span>
              </div>
            ) : error ? (
              <div
                data-testid="piket-member-drawer-error"
                className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              >
                <HugeiconsIcon
                  icon={Alert02Icon}
                  size={28}
                  className="text-red-500"
                />
                <p className="font-mono text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Silakan tutup dan coba buka kembali drawer ini.
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div
                data-testid="piket-member-drawer-empty"
                className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              >
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={28}
                  className="text-slate-400"
                />
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Belum ada riwayat piket
                </p>
              </div>
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 dark:border-slate-800 pl-5">
                {sorted.map((entry) => {
                  const afterUrl = getPublicR2Url(entry.proofImageUrl);
                  const beforeUrl = getPublicR2Url(
                    entry.proofImageBeforeUrl,
                  );
                  return (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 size-3 rounded-full border-2 border-white dark:border-slate-900 bg-[#1e3a8a] dark:bg-blue-500" />
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {new Date(entry.dutyDate).toLocaleDateString(
                              "id-ID",
                              { dateStyle: "medium" },
                            )}
                          </span>
                          <PiketLogStatusBadge status={entry.status} />
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Pekan {entry.weekNumber}</span>
                          <span>{entry.roomTarget}</span>
                          <span>{entry.academicPeriod}</span>
                        </div>

                        {entry.notes ? (
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            {entry.notes}
                          </p>
                        ) : null}

                        {entry.status === "rejected" &&
                        entry.rejectionReason ? (
                          <p className="text-[11px] text-red-600 dark:text-red-400">
                            Alasan ditolak: {entry.rejectionReason}
                          </p>
                        ) : null}

                        {entry.verifierName ? (
                          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            Verifikator: {entry.verifierName}
                          </p>
                        ) : null}

                        {afterUrl || beforeUrl ? (
                          <div className="pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] font-mono text-xs"
                              onClick={() =>
                                setPreview({
                                  beforeUrl: beforeUrl || null,
                                  afterUrl: afterUrl || null,
                                  activeTab: afterUrl ? "after" : "before",
                                })
                              }
                            >
                              <HugeiconsIcon
                                icon={Image01Icon}
                                size={16}
                                className="mr-1.5"
                              />
                              Lihat Bukti
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PiketPhotoPreviewDialog
        open={!!preview}
        beforeUrl={preview?.beforeUrl ?? null}
        afterUrl={preview?.afterUrl ?? null}
        reporterName={memberName}
        dutyDate=""
        activeTab={preview?.activeTab ?? "after"}
        onTabChange={(tab) =>
          setPreview((prev) => (prev ? { ...prev, activeTab: tab } : null))
        }
        onClose={() => setPreview(null)}
      />
    </>
  );
}
