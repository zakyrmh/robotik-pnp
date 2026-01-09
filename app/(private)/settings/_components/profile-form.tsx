"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Loader2,
  User,
  X,
  Camera,
  CreditCard,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import {
  updateUserProfile,
  uploadProfileImage,
  UpdateProfileData,
} from "@/lib/firebase/services/profile-service";
import { User as UserType } from "@/schemas/users";

// =========================================================
// FORM SCHEMA
// =========================================================

const profileFormSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nickname: z.string().optional(),
  nim: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.date().nullable().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  major: z.string().optional(),
  department: z.string().optional(),
  entryYear: z.string().optional(),
  photoUrl: z.string().optional(),
  ktmUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// =========================================================
// PROPS
// =========================================================

interface ProfileFormProps {
  userData: UserType | null;
  uid: string;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

// =========================================================
// IMAGE UPLOAD COMPONENT
// =========================================================

interface ImageUploadProps {
  label: string;
  type: "profile" | "ktm";
  uid: string;
  currentPath?: string;
  onUpload: (path: string) => void;
  icon: React.ReactNode;
  aspectRatio?: "square" | "card";
}

function ImageUpload({
  label,
  type,
  uid,
  currentPath,
  onUpload,
  icon,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  // Local preview for newly selected file (blob URL)
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    // Upload
    setIsUploading(true);
    try {
      const { path, error } = await uploadProfileImage(uid, file, type);
      if (error) {
        toast.error(error);
        setLocalPreview(null);
        return;
      }
      if (path) {
        onUpload(path);
        toast.success(`${label} berhasil diunggah`);
      }
    } catch {
      toast.error("Gagal mengunggah gambar");
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
      // Cleanup preview URL after a delay to allow transition
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
      }, 1000);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Determine what to show: local preview (just uploaded) or storage image
  const hasImage = localPreview || currentPath;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-colors overflow-hidden",
          "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
          aspectRatio === "card" ? "aspect-3/2 max-w-[300px]" : "w-32 h-32"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : hasImage ? (
          <>
            {/* Show local preview if just uploaded, otherwise fetch from storage */}
            {localPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={localPreview}
                alt={label}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : type === "profile" ? (
              <ProfileImagePreview storagePath={currentPath} />
            ) : (
              <KtmImagePreview storagePath={currentPath} />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full z-20"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
            {icon}
            <span className="text-xs mt-2 text-center px-2">
              Klik untuk unggah
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Format: JPG, PNG, WebP. Maks 5MB.
      </p>
    </div>
  );
}

// =========================================================
// PREVIEW COMPONENTS (Using StorageImage internally)
// =========================================================

function ProfileImagePreview({ storagePath }: { storagePath?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!storagePath) {
        setIsLoading(false);
        return;
      }

      try {
        const { getStorageUrl } = await import("@/components/ui/storage-image");
        const url = await getStorageUrl(storagePath);
        setImageUrl(url);
      } catch {
        console.error("Failed to get storage URL");
      }
      setIsLoading(false);
    };
    fetchUrl();
  }, [storagePath]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <Camera className="w-8 h-8 text-slate-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt="Foto Profil"
      className="w-full h-full object-cover rounded-xl"
    />
  );
}

function KtmImagePreview({ storagePath }: { storagePath?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!storagePath) {
        setIsLoading(false);
        return;
      }

      try {
        const { getStorageUrl } = await import("@/components/ui/storage-image");
        const url = await getStorageUrl(storagePath);
        setImageUrl(url);
      } catch {
        console.error("Failed to get storage URL");
      }
      setIsLoading(false);
    };
    fetchUrl();
  }, [storagePath]);

  if (isLoading) {
    return <Skeleton className="w-full h-full rounded-xl" />;
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <CreditCard className="w-8 h-8 text-slate-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt="Foto KTM"
      className="w-full h-full object-cover rounded-xl"
    />
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ProfileForm({
  userData,
  uid,
  onSuccess,
  onDirtyChange,
}: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: userData?.profile?.fullName || "",
      nickname: userData?.profile?.nickname || "",
      nim: userData?.profile?.nim || "",
      phone: userData?.profile?.phone || "",
      gender: userData?.profile?.gender,
      birthDate: userData?.profile?.birthDate
        ? userData.profile.birthDate instanceof Date
          ? userData.profile.birthDate
          : null
        : null,
      birthPlace: userData?.profile?.birthPlace || "",
      address: userData?.profile?.address || "",
      major: userData?.profile?.major || "",
      department: userData?.profile?.department || "",
      entryYear: userData?.profile?.entryYear?.toString() || "",
      photoUrl: userData?.profile?.photoUrl || "",
      ktmUrl: userData?.profile?.ktmUrl || "",
    },
  });

  // Track form dirty state
  const { isDirty } = form.formState;

  // Notify parent about dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Update form when userData changes
  useEffect(() => {
    if (userData) {
      form.reset({
        fullName: userData.profile?.fullName || "",
        nickname: userData.profile?.nickname || "",
        nim: userData.profile?.nim || "",
        phone: userData.profile?.phone || "",
        gender: userData.profile?.gender,
        birthDate: userData.profile?.birthDate
          ? userData.profile.birthDate instanceof Date
            ? userData.profile.birthDate
            : null
          : null,
        birthPlace: userData.profile?.birthPlace || "",
        address: userData.profile?.address || "",
        major: userData.profile?.major || "",
        department: userData.profile?.department || "",
        entryYear: userData.profile?.entryYear?.toString() || "",
        photoUrl: userData.profile?.photoUrl || "",
        ktmUrl: userData.profile?.ktmUrl || "",
      });
    }
  }, [userData, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);

    try {
      const updateData: UpdateProfileData = {
        fullName: values.fullName,
        nickname: values.nickname || undefined,
        nim: values.nim || undefined,
        phone: values.phone || undefined,
        gender: values.gender,
        birthDate: values.birthDate || null,
        birthPlace: values.birthPlace || undefined,
        address: values.address || undefined,
        major: values.major || undefined,
        department: values.department || undefined,
        entryYear: values.entryYear
          ? parseInt(values.entryYear, 10)
          : undefined,
        photoUrl: values.photoUrl || undefined,
        ktmUrl: values.ktmUrl || undefined,
      };

      const { success, error } = await updateUserProfile(uid, updateData);

      if (success) {
        toast.success("Profil berhasil diperbarui");
        onSuccess?.();
      } else {
        toast.error(error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Terjadi kesalahan saat memperbarui profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Photo Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
        <Controller
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <ImageUpload
              label="Foto Profil"
              type="profile"
              uid={uid}
              currentPath={field.value}
              onUpload={field.onChange}
              icon={<Camera className="w-8 h-8" />}
              aspectRatio="square"
            />
          )}
        />

        <Controller
          control={form.control}
          name="ktmUrl"
          render={({ field }) => (
            <ImageUpload
              label="Foto KTM"
              type="ktm"
              uid={uid}
              currentPath={field.value}
              onUpload={field.onChange}
              icon={<CreditCard className="w-8 h-8" />}
              aspectRatio="card"
            />
          )}
        />
      </div>

      {/* Personal Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5" />
          Informasi Pribadi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Masukkan nama lengkap"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nama Panggilan</Label>
            <Input
              id="nickname"
              placeholder="Masukkan nama panggilan"
              {...form.register("nickname")}
            />
          </div>

          {/* NIM */}
          <div className="space-y-2">
            <Label htmlFor="nim">NIM</Label>
            <Input
              id="nim"
              placeholder="Contoh: 2311522342"
              {...form.register("nim")}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">No. HP</Label>
            <Input
              id="phone"
              placeholder="Contoh: 08123456789"
              {...form.register("phone")}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(val) =>
                    field.onChange(val as "male" | "female")
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Birth Place */}
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Tempat Lahir</Label>
            <Input
              id="birthPlace"
              placeholder="Contoh: Padang"
              {...form.register("birthPlace")}
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Controller
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birthDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "d MMMM yyyy", { locale: localeId })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => field.onChange(date || null)}
                      defaultMonth={field.value || new Date(2000, 0)}
                      captionLayout="dropdown"
                      fromYear={1970}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          {/* Address - Full Width */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              placeholder="Masukkan alamat lengkap"
              className="resize-none h-20"
              {...form.register("address")}
            />
          </div>
        </div>
      </div>

      {/* Academic Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Informasi Akademik
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Jurusan</Label>
            <Input
              id="department"
              placeholder="Contoh: Teknologi Informasi"
              {...form.register("department")}
            />
          </div>

          {/* Major */}
          <div className="space-y-2">
            <Label htmlFor="major">Prodi</Label>
            <Input
              id="major"
              placeholder="Contoh: D4 Teknik Informatika"
              {...form.register("major")}
            />
          </div>

          {/* Entry Year */}
          <div className="space-y-2">
            <Label htmlFor="entryYear">Tahun Masuk</Label>
            <Input
              id="entryYear"
              type="number"
              placeholder="Contoh: 2023"
              {...form.register("entryYear")}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}

// =========================================================
// SKELETON COMPONENT
// =========================================================

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Photo Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-32 h-32 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="aspect-3/2 max-w-[300px] rounded-xl" />
        </div>
      </div>

      {/* Personal Info */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
