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
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { User } from "firebase/auth";

export default function Pembayaran() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // State untuk tiap file
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [igRobotik, setIgRobotik] = useState<File | null>(null);
  const [igMrc, setIgMrc] = useState<File | null>(null);
  const [youtube, setYoutube] = useState<File | null>(null);

  // State umum
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debug helper
  const addDebugInfo = (info: string) => {
    console.log('DEBUG:', info);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const isFormComplete = pasFoto && igRobotik && igMrc && youtube;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      addDebugInfo(`User authenticated: ${u.uid}`);

      try {
        const snap = await getDoc(doc(db, "caang_registration", u.uid));
        addDebugInfo(`Firestore check completed`);
        if (snap.exists() && snap.data()?.pasFoto) {
          addDebugInfo(`User already has pasFoto, redirecting`);
          router.push("/pendaftaran");
        }
      } catch (err) {
        addDebugInfo(`Firestore error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error("Gagal load data pribadi:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper: upload file dengan detailed logging
  const uploadFile = async (file: File, fieldName: string) => {
    addDebugInfo(`Starting upload for ${fieldName}`);
    addDebugInfo(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    
    try {
      // Validate file
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error(`${fieldName} format tidak didukung: ${file.type}`);
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`${fieldName} terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      const filePath = `upload/${user?.uid}_${fieldName}_${Date.now()}_${file.name}`;
      addDebugInfo(`Upload path: ${filePath}`);

      // Check Supabase connection
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        addDebugInfo(`Supabase connection error: ${bucketsError.message}`);
        throw new Error(`Koneksi Supabase gagal: ${bucketsError.message}`);
      }
      addDebugInfo(`Supabase connected, buckets found: ${buckets?.length}`);

      // Upload file
      addDebugInfo(`Starting file upload...`);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("pendaftaran")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        addDebugInfo(`Upload error: ${uploadError.message}`);
        console.error("Upload error details:", uploadError);
        throw new Error(`Upload ${fieldName} gagal: ${uploadError.message}`);
      }

      addDebugInfo(`Upload successful: ${uploadData?.path}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("pendaftaran")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        addDebugInfo(`Failed to get public URL`);
        throw new Error(`Gagal membuat URL publik untuk ${fieldName}`);
      }

      addDebugInfo(`Public URL created: ${urlData.publicUrl.substring(0, 50)}...`);
      return urlData.publicUrl;

    } catch (err) {
      addDebugInfo(`Upload failed for ${fieldName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // Handle submit dengan detailed error tracking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }
    if (!isFormComplete) {
      setError("Semua file harus diupload");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setDebugInfo([]);
    
    addDebugInfo(`Starting form submission`);
    addDebugInfo(`User: ${user.uid}`);
    addDebugInfo(`Files: ${[pasFoto, igRobotik, igMrc, youtube].map(f => f ? `${f.name} (${f.size})` : 'null').join(', ')}`);

    try {
      // Check user authentication
      if (!user.uid) {
        throw new Error("User UID tidak ditemukan");
      }

      // Upload files one by one
      addDebugInfo(`Uploading pas foto...`);
      const pasFotoUrl = await uploadFile(pasFoto!, "pasFoto");
      setSuccess("✅ Pas foto berhasil diupload");

      addDebugInfo(`Uploading IG Robotik...`);
      const igRobotikUrl = await uploadFile(igRobotik!, "igRobotik");
      setSuccess("✅ Follow IG Robotik berhasil diupload");

      addDebugInfo(`Uploading IG MRC...`);
      const igMrcUrl = await uploadFile(igMrc!, "igMrc");
      setSuccess("✅ Follow IG MRC berhasil diupload");

      addDebugInfo(`Uploading YouTube...`);
      const youtubeUrl = await uploadFile(youtube!, "youtube");
      setSuccess("✅ Subscribe YouTube berhasil diupload");

      // Save to Firestore
      addDebugInfo(`Saving to Firestore...`);
      const docData = {
        pasFoto: pasFotoUrl,
        followIgRobotik: igRobotikUrl,
        followIgMrc: igMrcUrl,
        youtubeRobotik: youtubeUrl,
      };
      
      await setDoc(
        doc(db, "caang_registration", user.uid),
        docData,
        { merge: true }
      );

      addDebugInfo(`Firestore save successful`);
      setSuccess("✅ Semua dokumen pendukung berhasil disimpan!");
      
      setTimeout(() => {
        router.push("/pendaftaran");
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kesalahan tidak diketahui';
      addDebugInfo(`ERROR: ${errorMessage}`);
      console.error("Submit error:", err);
      
      // Set specific error message
      setError(errorMessage);
      
    } finally {
      setSaving(false);
    }
  };

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
      {/* Debug Panel - Only show if there are debug info */}
      {debugInfo.length > 0 && (
        <details className="mb-4 p-3 bg-gray-50 border rounded-lg text-xs hidden">
          <summary className="cursor-pointer font-medium text-gray-700">
            🔍 Debug Info ({debugInfo.length} entries)
          </summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {debugInfo.map((info, idx) => (
              <div key={idx} className="text-gray-600 font-mono">
                {info}
              </div>
            ))}
          </div>
        </details>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PAS FOTO */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">
            Pas Foto <span className="text-red-500">*</span>
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPasFoto(file);
              if (file) addDebugInfo(`Pas foto selected: ${file.name} (${file.size} bytes)`);
            }}
            required
          />
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG, WebP • Maksimal 5MB
          </p>
          {pasFoto && (
            <p className="text-xs text-green-600">
              ✓ {pasFoto.name} ({(pasFoto.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* IG ROBOTIK */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">
            Bukti Follow Instagram Robotik <span className="text-red-500">*</span>
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setIgRobotik(file);
              if (file) addDebugInfo(`IG Robotik selected: ${file.name} (${file.size} bytes)`);
            }}
            required
          />
          <Link
            href="https://www.instagram.com/robotikpnp/"
            target="_blank"
            className="text-primary text-sm hover:underline"
          >
            @robotikpnp
          </Link>
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG, WebP • Maksimal 5MB
          </p>
          {igRobotik && (
            <p className="text-xs text-green-600">
              ✓ {igRobotik.name} ({(igRobotik.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* IG MRC */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">
            Bukti Follow Instagram MRC <span className="text-red-500">*</span>
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setIgMrc(file);
              if (file) addDebugInfo(`IG MRC selected: ${file.name} (${file.size} bytes)`);
            }}
            required
          />
          <Link
            href="https://www.instagram.com/mrcpnp/"
            target="_blank"
            className="text-primary text-sm hover:underline"
          >
            @mrcpnp
          </Link>
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG, WebP • Maksimal 5MB
          </p>
          {igMrc && (
            <p className="text-xs text-green-600">
              ✓ {igMrc.name} ({(igMrc.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* YOUTUBE */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">
            Bukti Subscribe Youtube Robotik <span className="text-red-500">*</span>
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setYoutube(file);
              if (file) addDebugInfo(`YouTube selected: ${file.name} (${file.size} bytes)`);
            }}
            required
          />
          <Link
            href="https://www.youtube.com/@robotikpnp"
            target="_blank"
            className="text-primary text-sm hover:underline"
          >
            UKM Robotik
          </Link>
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG, WebP • Maksimal 5MB
          </p>
          {youtube && (
            <p className="text-xs text-green-600">
              ✓ {youtube.name} ({(youtube.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* FEEDBACK */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-1">
                  Periksa debug info di atas untuk detail lengkap
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBMIT */}
        <Button
          type="submit"
          disabled={saving || !isFormComplete}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Simpan Dokumen ({[pasFoto, igRobotik, igMrc, youtube].filter(Boolean).length}/4)
            </>
          )}
        </Button>
        
        {!isFormComplete && (
          <p className="text-sm text-center text-muted-foreground">
            Silakan pilih semua 4 file yang diperlukan
          </p>
        )}
      </form>
    </ShowcaseSection>
  );
}