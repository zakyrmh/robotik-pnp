"use client";

import { Material } from "@/types/materials";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Download, Eye, FileText } from "lucide-react";
import { incrementDownloadCount, incrementOpenCount } from "@/lib/firebase/materials";
import { useState } from "react";
import { toast } from "sonner";

interface MaterialCardProps {
  material: Material;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleOpen = async () => {
    try {
      setOpening(true);
      await incrementOpenCount(material.id);
      window.open(material.fileUrl, "_blank");
    } catch {
      toast.error("Gagal membuka materi");
    } finally {
      setOpening(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await incrementDownloadCount(material.id);
      
      // Create a temporary link to force download
      const link = document.createElement("a");
      link.href = material.fileUrl;
      link.download = material.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch {
      toast.error("Gagal mendownload materi");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2 text-lg">{material.title}</CardTitle>
            <CardDescription className="text-xs">
              Diunggah oleh {material.uploadedBy} • {format(material.createdAt.toDate(), "dd MMM yyyy", { locale: id })}
            </CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {material.description || "Tidak ada deskripsi"}
        </p>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{material.openCount || 0} Dilihat</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{material.downloadCount || 0} Unduhan</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1" onClick={handleOpen} disabled={opening}>
          <Eye className="mr-2 h-4 w-4" />
          Baca
        </Button>
        <Button className="flex-1" onClick={handleDownload} disabled={downloading}>
          <Download className="mr-2 h-4 w-4" />
          Unduh
        </Button>
      </CardFooter>
    </Card>
  );
}
