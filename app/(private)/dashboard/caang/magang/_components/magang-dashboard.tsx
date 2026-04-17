import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MagangDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="size-5" /> Jadwal Magang
          </CardTitle>
          <CardDescription>Jadwal dan aktivitas magang yang akan datang</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="py-20 text-center border border-dashed rounded-xl">
            <Clock className="size-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Belum ada jadwal magang yang ditambahkan.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen className="size-5" /> Logbook Magang
              </CardTitle>
              <CardDescription>Catatan kegiatan magang harian</CardDescription>
            </div>
            <Button variant="outline" size="sm">Tambah Logbook</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="py-20 text-center border border-dashed rounded-xl">
            <BookOpen className="size-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Belum ada logbook yang diisi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
