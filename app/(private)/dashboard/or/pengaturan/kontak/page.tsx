import { Suspense } from "react";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnnouncementSettings } from "@/app/actions/or-settings.action";
import { KontakForm } from "./_components/kontak-form";

export default function KontakSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <Megaphone className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kontak & Pengumuman
          </h1>
          <p className="text-sm text-muted-foreground">
            Atur pesan pengumuman dan daftar panitia yang bisa dihubungi oleh
            calon anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<KontakSkeleton />}>
        <KontakContent />
      </Suspense>
    </div>
  );
}

async function KontakContent() {
  const result = await getAnnouncementSettings();
  return <KontakForm initialData={result.data} />;
}

function KontakSkeleton() {
  return (
    <div className="max-w-4xl space-y-4 lg:max-w-full">
      {/* Card: Pesan Pengumuman */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* CardHeader with border-b bg-muted/30 */}
        <div className="p-6 pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        </div>
        {/* CardContent */}
        <div className="p-6 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-[120px] w-full rounded-md" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      {/* Card: Kontak Panitia */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* CardHeader */}
        <div className="p-6 pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
        {/* CardContent - contact rows */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-stretch gap-4 rounded-xl border p-4"
            >
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
              <div className="flex items-center justify-end sm:border-l sm:pl-2">
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
