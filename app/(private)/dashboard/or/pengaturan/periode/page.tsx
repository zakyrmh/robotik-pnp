import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRegistrationPeriod } from "@/app/actions/or-settings.action";
import { PeriodeForm } from "./_components/periode-form";

export default function PengaturanPeriodePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <CalendarDays className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Periode Pendaftaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal pembukaan dan penutupan pendaftaran Open Recruitment.
          </p>
        </div>
      </div>

      <Suspense fallback={<PeriodeSkeleton />}>
        <PeriodeContent />
      </Suspense>
    </div>
  );
}

async function PeriodeContent() {
  const result = await getRegistrationPeriod();
  return <PeriodeForm initialData={result.data} />;
}

function PeriodeSkeleton() {
  return (
    <div className="max-w-2xl lg:max-w-full rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* CardHeader */}
      <div className="p-6 pb-4 space-y-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* CardContent */}
      <div className="p-6 pt-0 space-y-8">
        {/* Periode OR label + input */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </div>

        {/* Toggle status panel */}
        <div className="rounded-xl border p-5 flex items-center justify-between bg-muted/20">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-11 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Input tanggal grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>

      {/* CardFooter */}
      <div className="flex justify-end p-6 pt-4 border-t">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
