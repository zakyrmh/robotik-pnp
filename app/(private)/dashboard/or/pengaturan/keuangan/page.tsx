import { Suspense } from "react";
import { Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPaymentAccounts,
  getRegistrationFee,
} from "@/app/actions/or-settings.action";
import { KeuanganManager } from "./_components/keuangan-manager";

export default function PengaturanKeuanganPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Landmark className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Data Rekening & Biaya
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola rekening pembayaran dan nominal biaya pendaftaran Open
            Recruitment.
          </p>
        </div>
      </div>

      <Suspense fallback={<KeuanganSkeleton />}>
        <KeuanganContent />
      </Suspense>
    </div>
  );
}

async function KeuanganContent() {
  const [accountsResult, feeResult] = await Promise.all([
    getPaymentAccounts(),
    getRegistrationFee(),
  ]);

  return (
    <KeuanganManager
      initialAccounts={accountsResult.data ?? []}
      initialFee={feeResult.data?.amount ?? 50000}
    />
  );
}

function KeuanganSkeleton() {
  return (
    <div className="space-y-6">
      {/* Biaya Pendaftaran Card */}
      <div className="rounded-xl border border-dashed bg-muted/10 shadow-sm">
        <div className="p-6 pb-2 space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="grid gap-2 flex-1 w-full max-w-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* Header Daftar Rekening */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Grid Rekening Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="p-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {/* Card Content */}
            <div className="p-6 pt-0 space-y-1">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-3 w-32" />
              <div className="flex items-center justify-end gap-2 mt-6">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
