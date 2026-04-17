import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Kegiatan - Dalam Pengembangan",
};

export default function KegiatanPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-muted/60 shadow-sm border-dashed">
        <CardContent className="pt-12 pb-14 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 mb-6">
            <Wrench className="h-10 w-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Halaman Kegiatan</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Halaman ini sedang berada dalam tahapan pengembangan sistem. Harap bersabar dan periksa kembali secara berkala.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
