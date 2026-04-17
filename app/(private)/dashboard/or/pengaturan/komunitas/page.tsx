import { Suspense } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCommunityLinks } from "@/app/actions/or-settings.action";
import { CommunityLinksForm } from "./_components/community-links-form";

export default function CommunityLinksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <LinkIcon className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Link Komunitas</h1>
          <p className="text-sm text-muted-foreground">
            Kelola link grup WhatsApp, Discord, dan platform komunitas lainnya
            untuk calon anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<CommunityLinksSkeleton />}>
        <CommunityLinksContent />
      </Suspense>
    </div>
  );
}

async function CommunityLinksContent() {
  const result = await getCommunityLinks();
  return <CommunityLinksForm initialLinks={result.data?.links ?? []} />;
}

function CommunityLinksSkeleton() {
  return (
    <div className="max-w-4xl space-y-4 lg:max-w-full">
      {/* Card: Daftar Link Komunitas */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* CardHeader */}
        <div className="p-6 pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-44" />
              </div>
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>

        {/* CardContent - link rows */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl border p-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-12 items-end">
                {/* Platform select (col-span-3) */}
                <div className="sm:col-span-3 space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                {/* Label input (col-span-3) */}
                <div className="sm:col-span-3 space-y-1.5">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                {/* URL input (col-span-4) */}
                <div className="sm:col-span-4 space-y-1.5">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                {/* Switch + delete (col-span-2) */}
                <div className="sm:col-span-2 flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
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
