"use client";

import { useState, useEffect } from "react";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

// =========================================================
// HELPER FUNCTION
// =========================================================

/**
 * Get download URL from Firebase Storage path
 */
export const getStorageUrl = async (
  storagePath: string
): Promise<string | null> => {
  if (!storagePath) return null;

  // If already a full URL, return as is
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  try {
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error getting storage URL:", error);
    return null;
  }
};

// =========================================================
// PROFILE IMAGE COMPONENT
// =========================================================

interface ProfileImageProps {
  storagePath?: string | null;
  fallbackName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Component to render profile photo from Firebase Storage path
 * Shows default avatar icon while loading or if no image
 */
export function ProfileImage({
  storagePath,
  fallbackName,
  className,
  size = "md",
}: ProfileImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!storagePath);
  const [hasError, setHasError] = useState(false);

  // Size mapping
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  useEffect(() => {
    const fetchUrl = async () => {
      if (!storagePath) {
        setImageUrl(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const url = await getStorageUrl(storagePath);
      if (url) {
        setImageUrl(url);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    };

    fetchUrl();
  }, [storagePath]);

  // Get initials for fallback
  const getInitials = (name?: string): string => {
    if (!name) return "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {isLoading ? (
        <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
          <User
            className={cn(iconSizes[size], "text-slate-400 animate-pulse")}
          />
        </AvatarFallback>
      ) : imageUrl && !hasError ? (
        <>
          <AvatarImage
            src={imageUrl}
            alt={fallbackName || "Profile"}
            onError={() => setHasError(true)}
          />
          <AvatarFallback className="bg-blue-600 text-white font-semibold">
            {fallbackName ? (
              getInitials(fallbackName)
            ) : (
              <User className={iconSizes[size]} />
            )}
          </AvatarFallback>
        </>
      ) : (
        <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
          {fallbackName ? (
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {getInitials(fallbackName)}
            </span>
          ) : (
            <User className={cn(iconSizes[size], "text-slate-400")} />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

// =========================================================
// KTM IMAGE COMPONENT
// =========================================================

interface KtmImageProps {
  storagePath?: string | null;
  className?: string;
  aspectRatio?: "auto" | "card";
}

/**
 * Component to render KTM photo from Firebase Storage path
 * Shows skeleton loader while loading
 */
export function KtmImage({
  storagePath,
  className,
  aspectRatio = "card",
}: KtmImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!storagePath);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!storagePath) {
        setImageUrl(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const url = await getStorageUrl(storagePath);
      if (url) {
        setImageUrl(url);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    };

    fetchUrl();
  }, [storagePath]);

  const aspectClasses = aspectRatio === "card" ? "aspect-3/2" : "";

  if (isLoading) {
    return (
      <Skeleton className={cn("w-full rounded-xl", aspectClasses, className)} />
    );
  }

  if (!imageUrl || hasError) {
    return (
      <div
        className={cn(
          "w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400",
          aspectClasses,
          className
        )}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="2" />
            <circle cx="8" cy="10" r="2" strokeWidth="2" />
            <path d="m14 12 3-3 4 4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xs">Tidak ada foto KTM</span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt="Kartu Tanda Mahasiswa"
      className={cn("w-full rounded-xl object-cover", aspectClasses, className)}
      onError={() => setHasError(true)}
    />
  );
}

// =========================================================
// STORAGE IMAGE WRAPPER (Generic)
// =========================================================

interface StorageImageProps {
  storagePath?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generic component to render any image from Firebase Storage path
 */
export function StorageImage({
  storagePath,
  alt,
  className,
  fallback,
  onLoad,
  onError,
}: StorageImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!storagePath);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!storagePath) {
        setImageUrl(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const url = await getStorageUrl(storagePath);
      if (url) {
        setImageUrl(url);
      } else {
        setHasError(true);
        onError?.();
      }
      setIsLoading(false);
    };

    fetchUrl();
  }, [storagePath, onError]);

  if (isLoading) {
    return fallback || <Skeleton className={cn("w-full h-full", className)} />;
  }

  if (!imageUrl || hasError) {
    return fallback || null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
}
