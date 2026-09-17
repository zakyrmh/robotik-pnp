import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CaangWhatsappGroupCardProps {
  url: string | null;
}

export function CaangWhatsappGroupCard({ url }: CaangWhatsappGroupCardProps) {
  if (!url) {
    return null;
  }

  return (
    <Card className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={18}
            className="text-emerald-600 dark:text-emerald-400"
          />
          Grup WhatsApp Calon Anggota
        </CardTitle>
        <CardDescription className="text-xs">
          Bergabung untuk menerima informasi dan pengumuman Open Recruitment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs rounded-xl min-h-[44px] uppercase"
        >
          <a href={url} target="_blank" rel="noreferrer">
            Bergabung ke Grup WhatsApp
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
