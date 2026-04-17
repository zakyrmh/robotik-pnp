import { Suspense } from "react";
import { LayoutList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPipelineSteps } from "@/app/actions/or-settings.action";
import { TimelineForm } from "./_components/timeline-form";

export default function TimelineSetupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <LayoutList className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Timeline Seleksi
          </h1>
          <p className="text-sm text-muted-foreground">
            Atur tahapan perjalanan yang akan dilihat calon anggota di dashboard
            mereka.
          </p>
        </div>
      </div>

      <Suspense fallback={<TimelineSkeleton />}>
        <TimelineContent />
      </Suspense>
    </div>
  );
}

async function TimelineContent() {
  const result = await getPipelineSteps();
  return <TimelineForm initialSteps={result.data ?? []} />;
}

function TimelineSkeleton() {
  return (
    <div className="max-w-5xl space-y-4 lg:max-w-full">
      {/* Card: Daftar Tahapan */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* CardHeader */}
        <div className="p-6 pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>

        {/* CardContent - step rows */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-stretch gap-4 rounded-xl border bg-card p-4 shadow-sm"
            >
              {/* Left: order & sort arrows */}
              <div className="flex flex-col items-center justify-center gap-1 border-r pr-3">
                <Skeleton className="size-6 rounded" />
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="size-6 rounded" />
              </div>

              {/* Right: form grid */}
              <div className="grid flex-1 gap-4 lg:grid-cols-12">
                {/* Label + Status (col-span-4) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>

                {/* Deskripsi textarea (col-span-7) */}
                <div className="lg:col-span-7 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-[95px] w-full rounded-md" />
                </div>

                {/* Delete button (col-span-1) */}
                <div className="lg:col-span-1 flex items-start justify-end pt-1">
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
