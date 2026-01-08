"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Download,
  FileText,
  Link as LinkIcon,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getMaterialById,
  logMaterialAccess,
} from "@/lib/firebase/services/material-service";
import { Material, MaterialType } from "@/schemas/materials";
import { useAuth } from "@/hooks/useAuth";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getTypeIcon = (type: MaterialType) => {
  switch (type) {
    case "file":
      return <FileText className="h-5 w-5" />;
    case "link":
      return <LinkIcon className="h-5 w-5" />;
    case "article":
      return <BookOpen className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: MaterialType) => {
  switch (type) {
    case "file":
      return "File";
    case "link":
      return "Link Eksternal";
    case "article":
      return "Artikel";
    default:
      return type;
  }
};

const getTypeBadgeColor = (type: MaterialType) => {
  switch (type) {
    case "file":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "link":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "article":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

// =========================================================
// SANITIZE HTML CONTENT
// =========================================================

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify with a safe configuration
 */
function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
      "img",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    // Force all links to open in new tab with safe rel
    FORCE_BODY: true,
  });
}

// =========================================================
// LOADING SKELETON
// =========================================================

function MaterialDetailSkeleton() {
  return (
    <div className="flex flex-col space-y-6 pt-6 pb-10">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const materialId = params.id as string;

  // Fetch material data
  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) {
        setError("ID materi tidak ditemukan");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMaterialById(materialId);
        if (!data) {
          setError("Materi tidak ditemukan");
        } else {
          setMaterial(data);
          // Log view access
          if (user?.uid) {
            logMaterialAccess(
              materialId,
              user.uid,
              data.orPeriod,
              "view",
              typeof navigator !== "undefined" ? navigator.userAgent : undefined
            );
          }
        }
      } catch (err) {
        console.error("Error fetching material:", err);
        setError("Gagal memuat materi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId, user?.uid]);

  // Handle download
  const handleDownload = () => {
    if (!material?.fileUrl) return;

    // Log download access
    if (user?.uid) {
      logMaterialAccess(
        materialId,
        user.uid,
        material.orPeriod,
        "download",
        typeof navigator !== "undefined" ? navigator.userAgent : undefined
      );
    }

    window.open(material.fileUrl, "_blank");
  };

  // Handle external link
  const handleOpenLink = () => {
    if (!material?.externalUrl) return;
    window.open(material.externalUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4">
        <MaterialDetailSkeleton />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {error || "Materi tidak ditemukan"}
          </h2>
          <p className="text-muted-foreground mb-6">
            Materi yang Anda cari mungkin telah dihapus atau tidak tersedia.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <div className="flex flex-col space-y-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Detail Materi</h1>
        </div>

        <Separator />

        {/* Material Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {material.orPeriod || "General"}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-sm ${getTypeBadgeColor(material.type)} border-0`}
            >
              <span className="flex items-center gap-1.5">
                {getTypeIcon(material.type)}
                {getTypeLabel(material.type)}
              </span>
            </Badge>
            {!material.isVisible && (
              <Badge
                variant="secondary"
                className="text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0"
              >
                Hidden
              </Badge>
            )}
          </div>

          <h2 className="text-3xl font-bold tracking-tight">
            {material.title}
          </h2>

          {material.description && (
            <p className="text-lg text-muted-foreground">
              {material.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(material.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {material.viewCount} views
            </span>
            {material.type === "file" && (
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                {material.downloadCount} downloads
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Content based on type */}
        {material.type === "file" && (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <h3 className="font-medium text-lg mb-1">
              {material.fileName || "File"}
            </h3>
            {material.fileSize && (
              <p className="text-sm text-muted-foreground mb-4">
                Ukuran: {formatFileSize(material.fileSize)}
              </p>
            )}
            {material.isDownloadable ? (
              <Button onClick={handleDownload} size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download File
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                File ini tidak tersedia untuk diunduh.
              </p>
            )}
          </div>
        )}

        {material.type === "link" && (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <LinkIcon className="h-12 w-12 mx-auto text-purple-500 mb-4" />
            <h3 className="font-medium text-lg mb-2">Link Eksternal</h3>
            <p className="text-sm text-muted-foreground mb-4 break-all max-w-xl mx-auto">
              {material.externalUrl}
            </p>
            <Button onClick={handleOpenLink} size="lg">
              <ExternalLink className="mr-2 h-5 w-5" />
              Buka Link
            </Button>
          </div>
        )}

        {material.type === "article" && (
          <div className="space-y-4">
            {/* Article Content with sanitized HTML */}
            <article
              className={[
                // Base prose styling
                "prose prose-lg dark:prose-invert max-w-none",
                // Headings
                "prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight",
                "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4",
                "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
                // Paragraphs
                "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4",
                // Strong/Emphasis
                "prose-strong:text-foreground prose-strong:font-semibold",
                "prose-em:text-foreground",
                // Blockquotes
                "prose-blockquote:border-l-4 prose-blockquote:border-primary",
                "prose-blockquote:pl-4 prose-blockquote:italic",
                "prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
                // Lists
                "prose-ul:text-foreground prose-ol:text-foreground",
                "prose-li:text-foreground prose-li:marker:text-muted-foreground",
                // Links
                "prose-a:text-primary prose-a:underline prose-a:underline-offset-4",
                // Code
                "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md",
                "prose-code:text-foreground prose-code:text-sm",
                "prose-pre:bg-muted prose-pre:rounded-lg",
              ].join(" ")}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(material.articleContent || ""),
              }}
            />
          </div>
        )}

        {/* Empty content fallback */}
        {material.type === "article" && !material.articleContent && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-1">Konten Kosong</h3>
            <p className="text-sm text-muted-foreground">
              Artikel ini belum memiliki konten.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
