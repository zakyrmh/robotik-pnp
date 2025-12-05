'use client';

import { useEffect, useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebaseConfig';

interface FirebaseImageProps extends Omit<ImageProps, 'src'> {
  path?: string;
  fallbackSrc?: string;
}

export default function FirebaseImage({ 
  path, 
  fallbackSrc = '/images/avatar.jpg', // Pastikan default pakai slash '/'
  ...props 
}: FirebaseImageProps) {
  
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Reset loading state setiap path berubah
    setIsLoading(true);

    // 2. Jika path kosong/undefined, pakai fallback
    if (!path) {
        setImgSrc(fallbackSrc);
        setIsLoading(false);
        return;
    }

    // --- PERBAIKAN LOGIKA DISINI ---
    
    // KASUS A: Path Lokal (Diawali '/') -> Jangan panggil Firebase!
    if (path.startsWith('/')) {
        setImgSrc(path);
        setIsLoading(false);
        return;
    }

    // KASUS B: URL Eksternal (http/https) -> Pakai langsung
    if (path.startsWith('http')) {
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
        setImgSrc(fallbackSrc);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirebaseUrl();

  }, [path, fallbackSrc]);

  return (
    <Image
      {...props}
      src={isLoading ? '/images/avatar.jpg' :imgSrc} // Next.js Image src
      alt={props.alt || 'User Image'}
    />
  );
}