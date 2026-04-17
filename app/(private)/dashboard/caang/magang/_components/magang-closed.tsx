import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

interface MagangClosedProps {
  cpName: string;
  cpRole: string;
  cpPhone: string;
}

export function MagangClosed({ cpName, cpRole, cpPhone }: MagangClosedProps) {
  return (
    <div className="flex h-[75vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-muted/60 shadow-sm border-dashed border-red-500/30">
        <CardContent className="pt-12 pb-14 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Pendaftaran Sudah Ditutup</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Batas waktu pengisian pendaftaran magang telah berakhir. Anda sudah tidak dapat lagi mendaftar secara mandiri.
          </p>
          <div className="bg-muted p-4 rounded-xl text-sm w-full text-left">
            <p className="font-semibold text-foreground mb-1">Butuh bantuan manual?</p>
            <p className="text-muted-foreground mb-2">Silakan hubungi Contact Person berikut:</p>
            <div className="bg-background border rounded-md p-3">
              <p className="font-medium text-primary">{cpName}</p>
              <p className="text-muted-foreground text-xs">{cpRole}</p>
              <p className="font-medium mt-1">{cpPhone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
