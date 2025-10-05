"use client";

import { useState } from "react";
import {
  CheckCircle,
  Download,
  Upload,
  FileText,
  Calendar,
  Briefcase,
  Loader2,
  Clock,
  Users,
} from "lucide-react";
import { doc, updateDoc, query, where, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { VolunteerData } from "@/types/volunteer-mrc";

interface AlreadyRegisteredProps {
  data: VolunteerData;
}

const BIDANG_LABELS: Record<string, string> = {
  LO: "Liaison Officer (LO)",
  PDD: "Publikasi, Desain, dan Dokumentasi (PDD)",
  Keamanan: "Keamanan",
  Admin: "Admin",
};

const HARI_LABELS: Record<string, string> = {
  both: "Sabtu (25) dan Minggu (26) Oktober 2025",
  sabtu: "Sabtu (25) Oktober 2025",
  minggu: "Minggu (26) Oktober 2025",
};

export default function AlreadyRegistered({ data }: AlreadyRegisteredProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    data.commitmentDocUrl || null
  );
  const [documentId, setDocumentId] = useState<string | null>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get document ID from Firestore
  const getDocumentId = async (): Promise<string | null> => {
    if (documentId) return documentId;

    try {
      const q = query(
        collection(db, "volunteer_mrc_ix"),
        where("userId", "==", user?.uid)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        setDocumentId(docId);
        return docId;
      }
    } catch (error) {
      console.error("Error getting document ID:", error);
    }

    return null;
  };

  // Download template dokumen komitmen
  const handleDownloadTemplate = () => {
    const templateUrl = "/doc/Surat-Komitmen-MRC.docx";
    window.open(templateUrl, "_blank");
  };

  // Upload dokumen komitmen yang sudah ditandatangani
  const handleUploadCommitment = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validasi file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung", {
        description: "Gunakan format PDF, JPG, atau PNG",
      });
      return;
    }

    // Validasi file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal 5MB",
      });
      return;
    }

    try {
      setUploading(true);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.uid}_${timestamp}.${fileExt}`;
      const filePath = `commitments/${fileName}`;

      // Upload ke Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("mrcix")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("volunteer-mrc")
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error("Failed to get public URL");

      // Get document ID
      const docId = await getDocumentId();
      if (!docId) {
        throw new Error("Document ID not found");
      }

      // Update Firestore dengan URL dokumen
      const volunteerRef = doc(db, "volunteer_mrc_ix", docId);
      await updateDoc(volunteerRef, {
        commitmentDocUrl: urlData.publicUrl,
        commitmentUploadedAt: new Date().toISOString(),
      });

      setUploadedUrl(urlData.publicUrl);
      toast.success("Dokumen Berhasil Diupload", {
        description: "Dokumen komitmen Anda telah tersimpan",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Gagal Mengupload Dokumen", {
        description: "Silakan coba lagi atau hubungi panitia",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100 mb-2">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400">
            Anda telah terdaftar sebagai volunteer MRC IX 2025
          </p>
        </div>

        {/* Data Volunteer */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Data Pendaftaran Anda
          </h2>

          <div className="space-y-4">
            {/* Pilihan Bidang Pertama */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Pilihan Bidang Pertama
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {BIDANG_LABELS[data.pilihanPertama] || data.pilihanPertama}
                </p>
              </div>
            </div>

            {/* Pilihan Bidang Kedua */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Pilihan Bidang Kedua
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {BIDANG_LABELS[data.pilihanKedua] || data.pilihanKedua}
                </p>
              </div>
            </div>

            {/* Bidang Ditempatkan (if available) */}
            {data.bidangDitempatkan && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Bidang Penempatan
                  </p>
                  <p className="text-base font-semibold text-green-900 dark:text-green-100">
                    {BIDANG_LABELS[data.bidangDitempatkan] ||
                      data.bidangDitempatkan}
                  </p>
                </div>
              </div>
            )}

            {/* Hari Tugas */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Hari Tugas
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {HARI_LABELS[data.hari] || data.hari}
                </p>
              </div>
            </div>

            {/* Alasan (if provided) */}
            {data.alasan && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Alasan
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-100 mt-1 whitespace-pre-wrap">
                    {data.alasan}
                  </p>
                </div>
              </div>
            )}

            {/* Tanggal Pendaftaran */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tanggal Pendaftaran
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(data.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Pengumuman */}
        {!data.bidangDitempatkan && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pengumuman Penempatan Bidang
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Hasil penempatan bidang akan diumumkan pada{" "}
                  <strong>13 Oktober 2025 pukul 15.00 WIB</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Download Template */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Dokumen Komitmen
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Silakan unduh template dokumen komitmen, tanda tangani, lalu upload
            kembali dokumen yang sudah ditandatangani.
          </p>

          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-lg transition-colors mb-4"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Template Dokumen Komitmen
          </button>

          {/* Upload Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <label
              htmlFor="commitment-upload"
              className={`block w-full cursor-pointer ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Mengupload...
                    </span>
                  </>
                ) : uploadedUrl ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Dokumen sudah diupload - Klik untuk upload ulang
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Upload Dokumen yang Sudah Ditandatangani
                    </span>
                  </>
                )}
              </div>
              <input
                id="commitment-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadCommitment}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Format: PDF, JPG, PNG (Maks. 5MB)
            </p>
          </div>

          {/* View Uploaded Document */}
          {uploadedUrl && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    Dokumen komitmen telah diupload
                  </span>
                </div>
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Lihat
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>Catatan:</strong> Pastikan dokumen komitmen sudah
            ditandatangani sebelum diupload. Jika ada pertanyaan, silakan
            hubungi panitia MRC IX 2025.
          </p>
        </div>
      </div>
    </div>
  );
}