"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  CreditCard,
  Instagram,
  Youtube,
  X,
} from "lucide-react";
import { Registration } from "@/types/registrations";
import {
  uploadFileWithProgress,
  validateFileSize,
  validateFileType,
} from "@/lib/firebase/services/storage-service";
import { updateRegistration } from "@/lib/firebase/services/registration-service";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { RegistrationStatus } from "@/types/registrations";
import UploadProgressModal from "./UploadProgressModal";

interface UploadDocumentsFormProps {
  user: FirebaseUser | null;
  registration: Registration | null;
}

interface DocumentFile {
  file: File | null;
  preview: string;
}

interface UploadStep {
  label: string;
  progress: number;
  status: "pending" | "uploading" | "completed";
}

export default function UploadDocumentsForm({
  user,
  registration,
}: UploadDocumentsFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // State untuk file dan preview
  const [photoFile, setPhotoFile] = useState<DocumentFile>({
    file: null,
    preview: registration?.documents?.photoUrl || "",
  });

  const [ktmFile, setKtmFile] = useState<DocumentFile>({
    file: null,
    preview: registration?.documents?.ktmUrl || "",
  });

  const [igRobotikFile, setIgRobotikFile] = useState<DocumentFile>({
    file: null,
    preview: registration?.documents?.igRobotikFollowUrl || "",
  });

  const [igMrcFile, setIgMrcFile] = useState<DocumentFile>({
    file: null,
    preview: registration?.documents?.igMrcFollowUrl || "",
  });

  const [youtubeFile, setYoutubeFile] = useState<DocumentFile>({
    file: null,
    preview: registration?.documents?.youtubeSubscribeUrl || "",
  });

  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([
    { label: "Upload Foto Profil", progress: 0, status: "pending" },
    { label: "Upload Bukti Follow IG Robotik", progress: 0, status: "pending" },
    { label: "Upload Bukti Follow IG MRC", progress: 0, status: "pending" },
    {
      label: "Upload Bukti Subscribe YT Robotik",
      progress: 0,
      status: "pending",
    },
  ]);

  // Handler untuk memilih file dengan preview
  const handleFileSelect = (
    file: File,
    setter: React.Dispatch<React.SetStateAction<DocumentFile>>,
    maxSizeMB: number = 2
  ) => {
    // Validasi ukuran file
    if (!validateFileSize(file, maxSizeMB)) {
      toast.error(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    // Validasi tipe file
    if (!validateFileType(file, ["image/*"])) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    // Buat preview
    const preview = URL.createObjectURL(file);
    setter({ file, preview });
  };

  // Handler untuk menghapus file
  const handleRemoveFile = (
    setter: React.Dispatch<React.SetStateAction<DocumentFile>>,
    preview: string
  ) => {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setter({ file: null, preview: "" });
  };

  // Update progress step
  const updateStepProgress = (
    index: number,
    progress: number,
    status: "pending" | "uploading" | "completed"
  ) => {
    setUploadSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, progress, status } : step
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation - KTM is optional for new students
    if (!photoFile.preview) {
      toast.error("Foto profil wajib diunggah");
      return;
    }

    if (!igRobotikFile.preview) {
      toast.error("Bukti follow Instagram Robotik wajib diunggah");
      return;
    }

    if (!igMrcFile.preview) {
      toast.error("Bukti follow Instagram MRC wajib diunggah");
      return;
    }

    if (!youtubeFile.preview) {
      toast.error("Bukti subscribe YouTube Robotik wajib diunggah");
      return;
    }

    try {
      setUploading(true);
      setShowProgressModal(true);

      const uploadedUrls: {
        photoUrl: string;
        ktmUrl?: string;
        igRobotikFollowUrl: string;
        igMrcFollowUrl: string;
        youtubeSubscribeUrl: string;
      } = {
        photoUrl: "",
        igRobotikFollowUrl: "",
        igMrcFollowUrl: "",
        youtubeSubscribeUrl: "",
      };

      // Helper to get extension
      const getExt = (file: File) => file.name.split(".").pop() || "jpg";

      // 1. Upload Foto Profil
      updateStepProgress(0, 0, "uploading");
      if (photoFile.file) {
        const ext = getExt(photoFile.file);
        const path = `users/${user.uid}/profile.${ext}`;
        const result = await uploadFileWithProgress(
          path,
          photoFile.file,
          (progress) => updateStepProgress(0, progress, "uploading")
        );
        uploadedUrls.photoUrl = result.path;
      } else {
        uploadedUrls.photoUrl = photoFile.preview;
      }
      updateStepProgress(0, 100, "completed");

      // 2. Upload Bukti Follow IG Robotik
      updateStepProgress(1, 0, "uploading");
      if (igRobotikFile.file) {
        const ext = getExt(igRobotikFile.file);
        const path = `registrations/${
          user.uid
        }/ig_robotik_follow_${Date.now()}.${ext}`;
        const result = await uploadFileWithProgress(
          path,
          igRobotikFile.file,
          (progress) => updateStepProgress(1, progress, "uploading")
        );
        uploadedUrls.igRobotikFollowUrl = result.path;
      } else {
        uploadedUrls.igRobotikFollowUrl = igRobotikFile.preview;
      }
      updateStepProgress(1, 100, "completed");

      // 3. Upload Bukti Follow IG MRC
      updateStepProgress(2, 0, "uploading");
      if (igMrcFile.file) {
        const ext = getExt(igMrcFile.file);
        const path = `registrations/${
          user.uid
        }/ig_mrc_follow_${Date.now()}.${ext}`;
        const result = await uploadFileWithProgress(
          path,
          igMrcFile.file,
          (progress) => updateStepProgress(2, progress, "uploading")
        );
        uploadedUrls.igMrcFollowUrl = result.path;
      } else {
        uploadedUrls.igMrcFollowUrl = igMrcFile.preview;
      }
      updateStepProgress(2, 100, "completed");

      // 4. Upload Bukti Subscribe YT Robotik
      updateStepProgress(3, 0, "uploading");
      if (youtubeFile.file) {
        const ext = getExt(youtubeFile.file);
        const path = `registrations/${
          user.uid
        }/youtube_subscribe_${Date.now()}.${ext}`;
        const result = await uploadFileWithProgress(
          path,
          youtubeFile.file,
          (progress) => updateStepProgress(3, progress, "uploading")
        );
        uploadedUrls.youtubeSubscribeUrl = result.path;
      } else {
        uploadedUrls.youtubeSubscribeUrl = youtubeFile.preview;
      }
      updateStepProgress(3, 100, "completed");

      // Upload KTM jika ada
      if (ktmFile.file) {
        const ext = getExt(ktmFile.file);
        const path = `registrations/${user.uid}/ktm_${Date.now()}.${ext}`;
        const result = await uploadFileWithProgress(path, ktmFile.file);
        uploadedUrls.ktmUrl = result.path;
      } else if (ktmFile.preview) {
        uploadedUrls.ktmUrl = ktmFile.preview;
      }

      // Update Registration Document
      await updateRegistration(user.uid, {
        documents: {
          ...registration?.documents,
          ...uploadedUrls,
          allUploaded: true,
          uploadedAt: Timestamp.now(),
        },
        status: RegistrationStatus.DOCUMENTS_UPLOADED,
      });

      // Update User Profile (photoUrl & ktmUrl)
      // Assuming 'users_new' is the collection name based on other services
      const userRef = doc(db, "users_new", user.uid);
      await updateDoc(userRef, {
        "profile.photoUrl": uploadedUrls.photoUrl,
        "profile.ktmUrl": uploadedUrls.ktmUrl || null,
        updatedAt: Timestamp.now(),
      });

      toast.success("Semua dokumen berhasil diunggah", {
        description: "Menunggu verifikasi dari admin",
      });

      // Redirect ke dashboard setelah 2 detik
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Gagal mengunggah dokumen");
      setShowProgressModal(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto Profil */}
        <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
              <ImageIcon className="w-6 h-6" aria-label="Ikon foto profil" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Foto Profil <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unggah foto formal dengan ukuran maksimal 2MB
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {photoFile.preview && (
              <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 group">
                {photoFile.preview.startsWith("blob:") ? (
                  <Image
                    src={photoFile.preview}
                    alt="Preview Foto Profil"
                    className="w-full h-full object-cover"
                    width={192}
                    height={192}
                  />
                ) : (
                  <Image
                    src={photoFile.preview}
                    alt="Preview Foto Profil"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveFile(setPhotoFile, photoFile.preview)
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block">
                <span className="sr-only">Pilih foto profil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, setPhotoFile);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* KTM - OPTIONAL */}
        <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center dark:bg-green-900/30 dark:text-green-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Kartu Tanda Mahasiswa (KTM){" "}
                <span className="text-gray-400 text-sm font-normal">
                  (Optional)
                </span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Untuk mahasiswa baru yang belum memiliki KTM, bisa dilewati
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {ktmFile.preview && (
              <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 group">
                {ktmFile.preview.startsWith("blob:") ? (
                  <Image
                    src={ktmFile.preview}
                    alt="Preview KTM"
                    className="w-full h-full object-cover"
                    width={192}
                    height={192}
                  />
                ) : (
                  <Image
                    src={ktmFile.preview}
                    alt="Preview KTM"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(setKtmFile, ktmFile.preview)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block">
                <span className="sr-only">Pilih foto KTM</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, setKtmFile);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bukti Follow & Subscribe */}
        <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center dark:bg-purple-900/30 dark:text-purple-400">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Bukti Follow & Subscribe <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload screenshot bukti follow Instagram dan subscribe YouTube
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Screenshot Follow IG Robotik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                <Instagram className="w-4 h-4 inline mr-1" />
                Screenshot Follow @robotika_undip *
              </label>
              {igRobotikFile.preview && (
                <div className="relative w-full max-w-md h-64 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-3 group">
                  {igRobotikFile.preview.startsWith("blob:") ? (
                    <Image
                      src={igRobotikFile.preview}
                      alt="Preview Bukti Follow IG Robotik"
                      className="w-full h-full object-contain"
                      width={192}
                      height={192}
                    />
                  ) : (
                    <Image
                      src={igRobotikFile.preview}
                      alt="Preview Bukti Follow IG Robotik"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 448px"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFile(setIgRobotikFile, igRobotikFile.preview)
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setIgRobotikFile);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                disabled={uploading}
              />
            </div>

            {/* Screenshot Follow IG MRC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                <Instagram className="w-4 h-4 inline mr-1" />
                Screenshot Follow @mrc_robotika_undip *
              </label>
              {igMrcFile.preview && (
                <div className="relative w-full max-w-md h-64 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-3 group">
                  {igMrcFile.preview.startsWith("blob:") ? (
                    <Image
                      src={igMrcFile.preview}
                      alt="Preview Bukti Follow IG MRC"
                      className="w-full h-full object-contain"
                      width={192}
                      height={192}
                    />
                  ) : (
                    <Image
                      src={igMrcFile.preview}
                      alt="Preview Bukti Follow IG MRC"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 448px"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFile(setIgMrcFile, igMrcFile.preview)
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setIgMrcFile);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                disabled={uploading}
              />
            </div>

            {/* Screenshot Subscribe YouTube */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                <Youtube className="w-4 h-4 inline mr-1" />
                Screenshot Subscribe YouTube Robotika Undip *
              </label>
              {youtubeFile.preview && (
                <div className="relative w-full max-w-md h-64 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-3 group">
                  {youtubeFile.preview.startsWith("blob:") ? (
                    <Image
                      src={youtubeFile.preview}
                      alt="Preview Bukti Subscribe YouTube"
                      className="w-full h-full object-contain"
                      width={192}
                      height={192}
                    />
                  ) : (
                    <Image
                      src={youtubeFile.preview}
                      alt="Preview Bukti Subscribe YouTube"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 448px"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFile(setYoutubeFile, youtubeFile.preview)
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setYoutubeFile);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900/30 dark:file:text-red-400"
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard">
            <Button variant="outline" type="button" disabled={uploading}>
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Mengunggah..." : "Upload Dokumen"}
          </Button>
        </div>
      </form>

      {/* Upload Progress Modal */}
      <UploadProgressModal
        isOpen={showProgressModal}
        uploadSteps={uploadSteps}
      />
    </>
  );
}
