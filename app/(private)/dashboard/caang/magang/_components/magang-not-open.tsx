import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";

export function MagangNotOpen() {
  return (
    <div className="flex h-[75vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-muted/60 shadow-sm border-dashed">
        <CardContent className="pt-12 pb-14 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 mb-6">
            <Timer className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Pendaftaran Belum Dibuka</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Halaman pendaftaran magang belum memasuki masa buka. Harap persiapkan diri Anda dan tunggu informasi selanjutnya dari panitia Open Recruitment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
