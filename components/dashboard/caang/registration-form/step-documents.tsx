"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegistrationForm } from "./registration-form-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { StorageFileType } from "@/lib/firebase/services/storage-service";

// =========================================================
// SCHEMA
// =========================================================

const documentsSchema = z.object({
  photoUrl: z.string().min(1, "Pas foto wajib diupload"),
  ktmUrl: z.string().optional(),
  igRobotikFollowUrl: z
    .string()
    .min(1, "Bukti follow IG Robotik wajib diupload"),
  igMrcFollowUrl: z.string().min(1, "Bukti follow IG MRC wajib diupload"),
  youtubeSubscribeUrl: z
    .string()
    .min(1, "Bukti subscribe YouTube wajib diupload"),
});

type DocumentsFormValues = z.infer<typeof documentsSchema>;

// =========================================================
// HELPER COMPONENT - Document Upload Card
// =========================================================

// New props for storage
interface DocumentUploadCardProps {
  label: string;
  description: string;
  required?: boolean;
  value?: string;
  onChange: (url: string) => void;
  externalLink?: string;
  externalLinkLabel?: string;
  error?: string;
  userId: string;
  period: string;
  fileType: StorageFileType;
}

function DocumentUploadCard({
  label,
  description,
  required = false,
  value,
  onChange,
  externalLink,
  externalLinkLabel,
  error,
  userId,
  period,
  fileType,
}: DocumentUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Handle file upload with storage service
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const { uploadRegistrationImage } =
        await import("@/lib/firebase/services/storage-service");

      // Upload using service (handles compression & delete old)
      const downloadUrl = await uploadRegistrationImage(
        file,
        fileType,
        userId,
        period,
        value, // Pass old URL to delete
      );

      onChange(downloadUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      // Optional: Show toast error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 border-dashed transition-all ${
        value
          ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : error
            ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
            : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            value
              ? "bg-green-500 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          {value ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <ImageIcon className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>

          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              {externalLinkLabel || "Buka link"}
            </a>
          )}

          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Upload Button */}
        <div className="shrink-0">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant={value ? "outline" : "default"}
              size="sm"
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : value ? (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Ganti
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Preview */}
      {value && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`Preview ${label}`}
            className="max-h-32 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}

// =========================================================
// COMPONENT
// =========================================================

export function StepDocuments() {
  const { updateDocuments, isSaving, setCurrentStep, registration } =
    useRegistrationForm();
  const { user } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);

  // Get period from registration data or use default
  const period = registration?.orPeriod || "OR_xx";
  const userId = user?.uid || "";

  const form = useForm<DocumentsFormValues>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      photoUrl: "",
      ktmUrl: "",
      igRobotikFollowUrl: "",
      igMrcFollowUrl: "",
      youtubeSubscribeUrl: "",
    },
  });

  // State for dynamic social media links
  const [socialLinks, setSocialLinks] = useState<{
    instagramRobotikUrl: string;
    instagramMrcUrl: string;
    youtubeRobotikUrl: string;
  }>({
    instagramRobotikUrl: "https://instagram.com/ukmrobotikpnp", // Fallback
    instagramMrcUrl: "https://instagram.com/mrcukmrobotik", // Fallback
    youtubeRobotikUrl: "https://youtube.com/@UKMRobotikPNP", // Fallback
  });

  // Load existing documents & settings
  useEffect(() => {
    async function init() {
      if (!user?.uid) return;

      setIsLoading(true);

      try {
        // 1. Load Settings
        const { getRecruitmentSettings } =
          await import("@/lib/firebase/services/settings-service");
        const settings = await getRecruitmentSettings();

        if (settings?.externalLinks) {
          setSocialLinks({
            instagramRobotikUrl:
              settings.externalLinks.instagramRobotikUrl ||
              "https://instagram.com/ukmrobotikpnp",
            instagramMrcUrl:
              settings.externalLinks.instagramMrcUrl ||
              "https://instagram.com/mrcukmrobotik",
            youtubeRobotikUrl:
              settings.externalLinks.youtubeRobotikUrl ||
              "https://youtube.com/@UKMRobotikPNP",
          });
        }

        // 2. Load Documents
        const regRef = doc(db, "registrations", user.uid);
        const regSnap = await getDoc(regRef);

        if (regSnap.exists()) {
          const regData = regSnap.data();
          const docs = regData.documents || {};

          form.setValue("photoUrl", docs.photoUrl || "");
          form.setValue("ktmUrl", docs.ktmUrl || "");
          form.setValue("igRobotikFollowUrl", docs.igRobotikFollowUrl || "");
          form.setValue("igMrcFollowUrl", docs.igMrcFollowUrl || "");
          form.setValue("youtubeSubscribeUrl", docs.youtubeSubscribeUrl || "");
        }
      } catch (error) {
        console.error("Error initializing documents step:", error);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [user?.uid, form]);

  const onSubmit = async (data: DocumentsFormValues) => {
    try {
      await updateDocuments(data);
    } catch (error) {
      console.error("Error saving documents:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Dokumen Persyaratan</CardTitle>
        <CardDescription>
          Upload dokumen-dokumen yang diperlukan untuk pendaftaran. Pastikan
          gambar jelas dan mudah dibaca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Format yang diterima: JPG, PNG, atau WebP. Ukuran maksimal 5MB
                per file.
              </AlertDescription>
            </Alert>

            {/* Documents */}
            <div className="space-y-4">
              {/* Pas Foto */}
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <DocumentUploadCard
                      label="Pas Foto"
                      description="Foto formal dengan latar belakang polos (3x4 atau 4x6)"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                      fileType="photo"
                      userId={userId}
                      period={period}
                    />
                  </FormItem>
                )}
              />

              {/* KTM */}
              <FormField
                control={form.control}
                name="ktmUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <DocumentUploadCard
                      label="Kartu Tanda Mahasiswa (KTM)"
                      description="Foto KTM yang jelas (jika sudah memiliki)"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                      fileType="ktm"
                      userId={userId}
                      period={period}
                    />
                  </FormItem>
                )}
              />

              {/* IG Robotik */}
              <FormField
                control={form.control}
                name="igRobotikFollowUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <DocumentUploadCard
                      label="Bukti Follow Instagram UKM Robotik"
                      description="Screenshot yang menunjukkan Anda sudah follow akun @ukmrobotikpnp"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      externalLink={socialLinks.instagramRobotikUrl}
                      externalLinkLabel="Buka Instagram Robotik"
                      error={fieldState.error?.message}
                      fileType="ig_robotik"
                      userId={userId}
                      period={period}
                    />
                  </FormItem>
                )}
              />

              {/* IG MRC */}
              <FormField
                control={form.control}
                name="igMrcFollowUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <DocumentUploadCard
                      label="Bukti Follow Instagram MRC"
                      description="Screenshot yang menunjukkan Anda sudah follow akun @mrcukmrobotik"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      externalLink={socialLinks.instagramMrcUrl}
                      externalLinkLabel="Buka Instagram MRC"
                      error={fieldState.error?.message}
                      fileType="ig_mrc"
                      userId={userId}
                      period={period}
                    />
                  </FormItem>
                )}
              />

              {/* YouTube */}
              <FormField
                control={form.control}
                name="youtubeSubscribeUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <DocumentUploadCard
                      label="Bukti Subscribe YouTube Robotik"
                      description="Screenshot yang menunjukkan Anda sudah subscribe channel YouTube UKM Robotik"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      externalLink={socialLinks.youtubeRobotikUrl}
                      externalLinkLabel="Buka YouTube Robotik"
                      error={fieldState.error?.message}
                      fileType="yt_subscribe"
                      userId={userId}
                      period={period}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={isSaving}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>

              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Simpan & Lanjutkan
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
