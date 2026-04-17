import { Card, CardContent } from "@/components/ui/card";
import { Hourglass, Cpu, Anchor, Loader2 } from "lucide-react";

export function MagangPending() {
  return (
    <Card className="shadow-sm border border-orange-500/20 max-w-2xl mx-auto">
      <CardContent className="pt-12 pb-14 flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 mb-6">
          <Loader2 className="absolute inset-0 m-auto h-24 w-24 text-orange-500/20 animate-spin transition-all duration-1000" />
          <Hourglass className="h-10 w-10 text-orange-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Formulir Sedang Diproses</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Pendaftaran magang paralelmu telah kami terima. Saat ini, sistem sedang melakukan algoritma perhitungan pembagian kuota untuk menempatkanmu di divisi dan departemen yang paling tepat.
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="flex flex-col items-center p-4 border rounded-xl bg-card/50">
            <Cpu className="h-6 w-6 text-muted-foreground/50 mb-2" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Divisi</span>
            <span className="font-bold text-sm mt-1 text-orange-600">Menunggu Hasil</span>
          </div>
          <div className="flex flex-col items-center p-4 border rounded-xl bg-card/50">
            <Anchor className="h-6 w-6 text-muted-foreground/50 mb-2" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Departemen</span>
            <span className="font-bold text-sm mt-1 text-orange-600">Menunggu Hasil</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Harap cek kembali halaman ini berkala untuk melihat hasil pengumuman dan jadwal magang.
        </p>
      </CardContent>
    </Card>
  );
}
