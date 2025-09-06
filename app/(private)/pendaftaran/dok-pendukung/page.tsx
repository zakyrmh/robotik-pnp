"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Camera, Image as ImageIcon, Check } from "lucide-react";
import { User } from "firebase/auth";

export default function Pembayaran() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // State untuk tiap file
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [igRobotik, setIgRobotik] = useState<File | null>(null);
  const [igMrc, setIgMrc] = useState<File | null>(null);
  const [youtube, setYoutube] = useState<File | null>(null);

  // State preview
  const [pasFotoPreview, setPasFotoPreview] = useState<string>("");
  const [igRobotikPreview, setIgRobotikPreview] = useState<string>("");
  const [igMrcPreview, setIgMrcPreview] = useState<string>("");
  const [youtubePreview, setYoutubePreview] = useState<string>("");

  // State umum
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const isFormComplete = pasFoto && igRobotik && igMrc && youtube;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const snap = await getDoc(doc(db, "caang_registration", u.uid));
        if (snap.exists() && snap.data()?.pasFoto) {
          router.push("/pendaftaran");
        }
      } catch (err) {
        console.error("Gagal load data pribadi:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper: handle file change dengan preview
  const handleFileChange = (
    file: File | null, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>,
    fieldName: string
  ) => {
    if (!file) {
      setFile(null);
      setPreview("");
      return;
    }

    // Validasi format
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError(`${fieldName} harus format JPG, PNG, atau WebP`);
      setFile(null);
      setPreview("");
      return;
    }

    // Validasi ukuran
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`${fieldName} maksimal 5MB`);
      setFile(null);
      setPreview("");
      return;
    }

    setError("");
    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper: upload file dengan error handling
  const uploadFile = async (file: File, fieldName: string): Promise<string> => {
    const filePath = `upload/${user?.uid}_${fieldName}_${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("pendaftaran")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload ${fieldName} gagal: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("pendaftaran")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(`Gagal membuat URL untuk ${fieldName}`);
    }

    return data.publicUrl;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormComplete) return;
    
    setSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress("");

    try {
      // Upload files dengan progress
      setUploadProgress("Mengupload pas foto...");
      const pasFotoUrl = await uploadFile(pasFoto!, "pasFoto");
      
      setUploadProgress("Mengupload bukti follow IG Robotik...");
      const igRobotikUrl = await uploadFile(igRobotik!, "igRobotik");
      
      setUploadProgress("Mengupload bukti follow IG MRC...");
      const igMrcUrl = await uploadFile(igMrc!, "igMrc");
      
      setUploadProgress("Mengupload bukti subscribe YouTube...");
      const youtubeUrl = await uploadFile(youtube!, "youtube");

      // Save to Firestore
      setUploadProgress("Menyimpan data...");
      await setDoc(
        doc(db, "caang_registration", user.uid),
        {
          pasFoto: pasFotoUrl,
          followIgRobotik: igRobotikUrl,
          followIgMrc: igMrcUrl,
          youtubeRobotik: youtubeUrl,
        },
        { merge: true }
      );

      setSuccess("Semua dokumen pendukung berhasil disimpan! ✅");
      setUploadProgress("");
      
      // Redirect after success
      setTimeout(() => {
        router.push("/pendaftaran");
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data';
      setError(errorMessage);
      setUploadProgress("");
    } finally {
      setSaving(false);
    }
  };

  // File upload component
  const FileUploadInput = ({ 
    label, 
    file, 
    preview, 
    onChange, 
    linkUrl,
    linkText,
    required = true 
  }: {
    label: string;
    file: File | null;
    preview: string;
    onChange: (file: File | null) => void;
    linkUrl?: string;
    linkText?: string;
    required?: boolean;
  }) => (
    <div className="space-y-3 p-4 border rounded-lg bg-card/50">
      <div className="flex items-center justify-between">
        <label className="font-medium flex items-center gap-2">
          {isMobile ? <Camera className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {file && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="w-3 h-3" />
            <span>Siap</span>
          </div>
        )}
      </div>
      
      {linkUrl && linkText && (
        <Link
          href={linkUrl}
          target="_blank"
          className="text-primary text-sm hover:underline inline-flex items-center gap-1"
        >
          🔗 {linkText}
        </Link>
      )}
      
      <Input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        required={required}
        className="cursor-pointer file:cursor-pointer"
      />
      
      <div className="text-xs text-muted-foreground">
        <p>📱 Format: JPG, PNG, WebP • Maksimal: 5MB</p>
        {isMobile && <p className="text-blue-600">Tip: Gunakan kamera atau galeri untuk hasil terbaik</p>}
      </div>
      
      {file && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
      
      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview:</p>
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-xs h-auto rounded-md border object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">Memuat formulir...</span>
      </div>
    );
  }

  return (
    <ShowcaseSection title="Dokumen Pendukung" className="!p-6">
      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          {isMobile ? <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /> : <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
          <div>
            <h3 className="font-medium text-blue-900">Upload Dokumen Pendukung</h3>
            <p className="text-sm text-blue-700 mt-1">
              {isMobile 
                ? "Pastikan foto jelas dan terlihat dengan baik. Anda dapat menggunakan kamera atau memilih dari galeri."
                : "Pastikan semua dokumen jelas dan mudah dibaca. Format yang didukung: JPG, PNG, WebP."
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FileUploadInput
          label="Pas Foto"
          file={pasFoto}
          preview={pasFotoPreview}
          onChange={(file) => handleFileChange(file, setPasFoto, setPasFotoPreview, "Pas Foto")}
        />

        <FileUploadInput
          label="Bukti Follow Instagram Robotik"
          file={igRobotik}
          preview={igRobotikPreview}
          onChange={(file) => handleFileChange(file, setIgRobotik, setIgRobotikPreview, "Follow IG Robotik")}
          linkUrl="https://www.instagram.com/robotikpnp/"
          linkText="@robotikpnp"
        />

        <FileUploadInput
          label="Bukti Follow Instagram MRC"
          file={igMrc}
          preview={igMrcPreview}
          onChange={(file) => handleFileChange(file, setIgMrc, setIgMrcPreview, "Follow IG MRC")}
          linkUrl="https://www.instagram.com/mrcpnp/"
          linkText="@mrcpnp"
        />

        <FileUploadInput
          label="Bukti Subscribe Youtube Robotik"
          file={youtube}
          preview={youtubePreview}
          onChange={(file) => handleFileChange(file, setYoutube, setYoutubePreview, "Subscribe YouTube")}
          linkUrl="https://www.youtube.com/@robotikpnp"
          linkText="UKM Robotik"
        />

        {/* Progress indicator */}
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-blue-700 font-medium">{uploadProgress}</p>
            </div>
          </motion.div>
        )}

        {/* Success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </motion.div>
        )}
        
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700">{error}</p>
            <p className="text-red-600 text-sm mt-1">
              Silakan periksa file dan coba lagi.
            </p>
          </motion.div>
        )}

        {/* Submit button */}
        <div className="space-y-4">
          <Button
            type="submit"
            disabled={saving || !isFormComplete}
            className="w-full py-3 text-base"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                {isMobile ? <Camera className="mr-2 h-5 w-5" /> : <Upload className="mr-2 h-5 w-5" />}
                Simpan Dokumen ({[pasFoto, igRobotik, igMrc, youtube].filter(Boolean).length}/4)
              </>
            )}
          </Button>
          
          {/* Form completion indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {[
              { name: "Pas Foto", file: pasFoto },
              { name: "IG Robotik", file: igRobotik },
              { name: "IG MRC", file: igMrc },
              { name: "YouTube", file: youtube }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {item.file ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={item.file ? "text-green-600" : "text-muted-foreground"}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          
          {!isFormComplete && (
            <p className="text-sm text-center text-muted-foreground">
              Silakan upload semua dokumen yang diperlukan untuk melanjutkan
            </p>
          )}
        </div>
      </form>
    </ShowcaseSection>
  );
}