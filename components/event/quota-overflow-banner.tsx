import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getOverquotaCategoriesAction } from "@/lib/actions/event-admin";

/**
 * Banner laporan kategori yang melebihi kuota (over-booking).
 *
 * Server Component: mengambil ringkasan kuota lewat `getOverquotaCategoriesAction`
 * dan hanya menampilkan kategori dengan `isOverquota`. Data yang sudah over-quota
 * TIDAK diubah otomatis — banner ini murni memberi tahu panitia agar ditinjau.
 */
export async function QuotaOverflowBanner() {
  const res = await getOverquotaCategoriesAction();
  if (!res.success || !res.data) return null;

  const overquota = res.data.filter((c) => c.isOverquota);
  if (overquota.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="font-display text-sm font-semibold tracking-tight text-destructive">
            Perhatian: {overquota.length} kategori melebihi kuota
          </h2>
          <p className="text-xs text-destructive/90">
            Jumlah pendaftaran lunas + menunggu verifikasi melebihi kuota.
            Tindak lanjuti (mis. hubungi tim terkait). Sistem tidak mengubah
            data secara otomatis.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {overquota.map((c) => (
          <li
            key={c.categoryId}
            className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-background/60 px-3 py-2"
          >
            <span className="min-w-0 truncate text-xs font-semibold text-foreground">
              {c.categoryName}
            </span>
            <span className="shrink-0 font-mono text-xs font-bold text-destructive">
              {c.holdingCount}/{c.quota}{" "}
              <span className="font-sans font-medium text-destructive/80">
                (+{c.overflow})
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/manajemen-event/pendaftaran"
        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-destructive/90"
      >
        Tinjau Pendaftaran
      </Link>
    </div>
  );
}
