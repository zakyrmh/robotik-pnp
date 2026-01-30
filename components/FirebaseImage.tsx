"use client";

import { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase/config";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

interface FirebaseImageProps extends Omit<ImageProps, "src"> {
  path?: string;
  fallbackSrc?: string;
  showIconFallback?: boolean; // If true, show User icon instead of fallback image
}

export default function FirebaseImage({
  path,
  fallbackSrc,
  showIconFallback = true, // Default to showing icon fallback
  ...props
}: FirebaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(fallbackSrc || null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 1. Reset loading state setiap path berubah
    setIsLoading(true);
    setHasError(false);

    // 2. Jika path kosong/undefined, pakai fallback atau icon
    if (!path) {
      setImgSrc(fallbackSrc || null);
      setIsLoading(false);
      if (!fallbackSrc) setHasError(true);
      return;
    }

    // --- PERBAIKAN LOGIKA DISINI ---

    // KASUS A: Path Lokal (Diawali '/') -> Jangan panggil Firebase!
    if (path.startsWith("/")) {
      setImgSrc(path);
      setIsLoading(false);
      return;
    }

    // KASUS B: URL Eksternal (http/https) -> Pakai langsung
    if (path.startsWith("http")) {
      setImgSrc(path);
      setIsLoading(false);
      return;
    }

    // KASUS C: Path Firebase Storage (users/uid/...) -> Minta URL ke Firebase
    const fetchFirebaseUrl = async () => {
      try {
        const storage = getStorage(app);
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        setImgSrc(url);
      } catch (error) {
        console.error(`Gagal load gambar: ${path}`, error);
        if (fallbackSrc) {
          setImgSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirebaseUrl();
  }, [path, fallbackSrc]);

  if (isLoading) {
    return (
      <Skeleton
        className={`bg-gray-200 dark:bg-muted ${
          props.className || "w-full h-full"
        }`}
      />
    );
  }

  // Show default user icon if no image source or has error
  if (hasError || !imgSrc) {
    if (showIconFallback) {
      return (
        <div
          className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${
            props.className || "w-full h-full"
          }`}
        >
          <User className="w-1/2 h-1/2 text-slate-400 dark:text-slate-500" />
        </div>
      );
    }
    // If no icon fallback and no fallback src, still show a placeholder
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${
          props.className || "w-full h-full"
        }`}
      >
        <User className="w-1/2 h-1/2 text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc} // Next.js Image src
      alt={props.alt || "User Image"}
      unoptimized={true} // Bypass Next.js Image Optimization to fix timeout issues
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
