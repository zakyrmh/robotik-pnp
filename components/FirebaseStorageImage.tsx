import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebaseConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface FirebaseStorageImageProps extends Omit<ImageProps, "src"> {
  imagePath: string | null | undefined;
}

export default function FirebaseStorageImage({
  imagePath,
  alt,
  className,
  ...props
}: FirebaseStorageImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset state when path changes
    setLoading(true);
    setError(false);

    if (!imagePath) {
      setSrc(null);
      setLoading(false);
      return;
    }

    // Handle Blob or HTTP calls immediately (Local or Public URL)
    if (imagePath.startsWith("blob:") || imagePath.startsWith("http")) {
      setSrc(imagePath);
      setLoading(false);
      return;
    }

    // Handle Firebase Storage Path
    const fetchUrl = async () => {
      try {
        const storage = getStorage(app);
        const storageRef = ref(storage, imagePath);
        const url = await getDownloadURL(storageRef);
        setSrc(url);
      } catch (err) {
        console.error("Error fetching image url:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [imagePath]);

  if (loading) {
    return <Skeleton className="w-full h-full rounded-none" />;
  }

  if (error || !src) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      {...props}
      onError={() => setError(true)}
    />
  );
}
