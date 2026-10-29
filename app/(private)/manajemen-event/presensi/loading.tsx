import { Skeleton } from "@/components/ui/skeleton";

export default function EventCheckinLoading() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6" aria-busy="true">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.45fr)]">
        <Skeleton className="h-[36rem] rounded-lg" />
        <Skeleton className="h-[36rem] rounded-lg" />
      </div>
      <span className="sr-only">Memuat meja daftar ulang MRC…</span>
    </main>
  );
}
