import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export default function RejectedPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border/50 bg-card/50 text-center shadow-xl backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-8 ring-red-500/5">
              <HugeiconsIcon icon={Cancel01Icon} size={40} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
              Pendaftaran Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Maaf, pendaftaran kamu sebagai Calon Anggota UKM Robotik PNP tidak dapat disetujui saat ini.
            </p>

            <div className="flex items-center justify-center gap-3 font-medium text-red-600 dark:text-red-400 bg-red-500/5 py-4 px-4 rounded-xl border border-red-500/10 text-sm">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={20}
                className="shrink-0"
              />
              <span className="text-left">
                Silakan hubungi pengurus untuk informasi lebih lanjut.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Ada pertanyaan?{" "}
            <a
              href="https://instagram.com/ukmrobotikpnp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors underline"
            >
              Hubungi Instagram Kami
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
