"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User as FirebaseUser,
  updateEmail,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthError,
} from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebaseConfig";
import { getUserById, updateUser } from "@/lib/firebase/users";
import { getJurusanProdi } from "@/lib/firebase/jurusan-prodi";
import { updateFileInSupabase } from "@/lib/supabase-storage";
import { User } from "@/types/users";
import { Gender } from "@/types/enum";
import { Jurusan } from "@/types/jurusan-prodi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  User as UserIcon,
  Mail,
  Lock,
  Upload,
  Save,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ImageCropDialog } from "@/components/ImageCropDialog";

interface ProfileFormData {
  fullName: string;
  nickname: string;
  nim: string;
  phone: string;
  gender: Gender;
  birthDate: Date;
  birthPlace: string;
  address: string;
  major: string;
  department: string;
  entryYear: number;
  photoUrl?: string;
  ktmUrl?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmailFormData {
  newEmail: string;
  password: string;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [selectedJurusan, setSelectedJurusan] = useState<Jurusan | null>(null);

  // File states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [ktmPreview, setKtmPreview] = useState<string>("");

  // Crop dialog states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");

  // Upload progress states
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number>(0);
  const [ktmUploadProgress, setKtmUploadProgress] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingKtm, setIsUploadingKtm] = useState(false);

  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: "",
    nickname: "",
    nim: "",
    phone: "",
    gender: Gender.MALE,
    birthDate: new Date(),
    birthPlace: "",
    address: "",
    major: "",
    department: "",
    entryYear: new Date().getFullYear(),
    photoUrl: "",
    ktmUrl: "",
  });

  const [emailData, setEmailData] = useState<EmailFormData>({
    newEmail: "",
    password: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push("/login");
          return;
        }

        setFirebaseUser(currentUser);

        // Get user data from Firestore
        const response = await getUserById(currentUser.uid);
        if (!response.success || !response.data) {
          toast.error("Gagal memuat data user");
          return;
        }

        const user = response.data;
        setUserData(user);

        // Convert Timestamp to Date
        const birthDate =
          user.profile.birthDate instanceof Timestamp
            ? user.profile.birthDate.toDate()
            : new Date();

        // Set profile data
        setProfileData({
          fullName: user.profile.fullName || "",
          nickname: user.profile.nickname || "",
          nim: user.profile.nim || "",
          phone: user.profile.phone || "",
          gender: user.profile.gender || Gender.MALE,
          birthDate: birthDate,
          birthPlace: user.profile.birthPlace || "",
          address: user.profile.address || "",
          major: user.profile.major || "",
          department: user.profile.department || "",
          entryYear: user.profile.entryYear || new Date().getFullYear(),
          photoUrl: user.profile.photoUrl || "",
          ktmUrl: user.profile.ktmUrl || "",
        });

        setPhotoPreview(user.profile.photoUrl || "");
        setKtmPreview(user.profile.ktmUrl || "");

        // Load jurusan-prodi data
        const jurusanResponse = await getJurusanProdi();
        if (jurusanResponse.success && jurusanResponse.data) {
          setJurusanList(jurusanResponse.data);

          // Find and set selected jurusan
          const currentJurusan = jurusanResponse.data.find(
            (j) => j.nama === user.profile.major
          );
          if (currentJurusan) {
            setSelectedJurusan(currentJurusan);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Handle jurusan change
  const handleJurusanChange = (jurusanNama: string) => {
    const jurusan = jurusanList.find((j) => j.nama === jurusanNama);
    setSelectedJurusan(jurusan || null);
    setProfileData((prev) => ({
      ...prev,
      major: jurusanNama,
      department: "", // Reset department when jurusan changes
    }));
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        e.target.value = "";
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        e.target.value = "";
        return;
      }

      // Show crop dialog
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Handle crop complete
  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], "profile-photo.jpg", {
      type: "image/jpeg",
    });

    // Validate file size after crop (max 2MB)
    if (croppedFile.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file setelah crop masih terlalu besar. Coba zoom out lebih banyak.");
      return;
    }

    setPhotoFile(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
  };

  // Handle KTM upload
  const handleKtmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        e.target.value = "";
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        e.target.value = "";
        return;
      }

      setKtmFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtmPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!firebaseUser || !userData) {
        toast.error("User tidak ditemukan");
        return;
      }

      let photoUrl = profileData.photoUrl;
      let ktmUrl = profileData.ktmUrl;

      // Upload photo if changed
      if (photoFile) {
        setIsUploadingPhoto(true);
        setPhotoUploadProgress(0);

        const uploadResult = await updateFileInSupabase(
          photoFile,
          "user-photos",
          `photo_${firebaseUser.uid}`,
          profileData.photoUrl,
          (progress) => setPhotoUploadProgress(progress)
        );

        setIsUploadingPhoto(false);

        if (!uploadResult.success) {
          toast.error("Gagal upload foto profil");
          setSaving(false);
          return;
        }

        photoUrl = uploadResult.url;
      }

      // Upload KTM if changed
      if (ktmFile) {
        setIsUploadingKtm(true);
        setKtmUploadProgress(0);

        const uploadResult = await updateFileInSupabase(
          ktmFile,
          "user-ktm",
          `ktm_${firebaseUser.uid}`,
          profileData.ktmUrl,
          (progress) => setKtmUploadProgress(progress)
        );

        setIsUploadingKtm(false);

        if (!uploadResult.success) {
          toast.error("Gagal upload foto KTM");
          setSaving(false);
          return;
        }

        ktmUrl = uploadResult.url;
      }

      // Convert Date to Timestamp
      const birthDateTimestamp = Timestamp.fromDate(profileData.birthDate);

      // Update user profile in Firestore
      const updatedProfile: Partial<User> = {
        profile: {
          fullName: profileData.fullName,
          nickname: profileData.nickname,
          nim: profileData.nim,
          phone: profileData.phone,
          gender: profileData.gender,
          birthDate: birthDateTimestamp,
          birthPlace: profileData.birthPlace,
          address: profileData.address,
          major: profileData.major,
          department: profileData.department,
          entryYear: profileData.entryYear,
          photoUrl: photoUrl,
          ktmUrl: ktmUrl,
        },
      };

      const updateResponse = await updateUser(firebaseUser.uid, updatedProfile);

      if (!updateResponse.success) {
        toast.error("Gagal mengupdate profil");
        return;
      }

      // Update Firebase Auth display name and photo
      await updateProfile(firebaseUser, {
        displayName: profileData.fullName,
        photoURL: photoUrl,
      });

      toast.success("Profil berhasil diupdate");

      // Refresh user data
      const response = await getUserById(firebaseUser.uid);
      if (response.success && response.data) {
        setUserData(response.data);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal mengupdate profil");
    } finally {
      setSaving(false);
    }
  };

  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!firebaseUser) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Validate email
      if (!emailData.newEmail || !emailData.password) {
        toast.error("Email dan password harus diisi");
        setSaving(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        firebaseUser.email!,
        emailData.password
      );

      await reauthenticateWithCredential(firebaseUser, credential);

      // Update email
      await updateEmail(firebaseUser, emailData.newEmail);

      toast.success("Email berhasil diupdate");
      setShowEmailModal(false);
      setEmailData({ newEmail: "", password: "" });

      // Refresh page
      router.refresh();
    } catch (error) {
      console.error("Error updating email:", error);

      let errorMessage = "Gagal mengupdate email";

      if (error && typeof error === "object" && "code" in error) {
        const authError = error as AuthError;

        if (authError.code === "auth/wrong-password") {
          errorMessage = "Password salah";
        } else if (authError.code === "auth/invalid-email") {
          errorMessage = "Format email tidak valid";
        } else if (authError.code === "auth/email-already-in-use") {
          errorMessage = "Email sudah digunakan";
        } else if (authError.code === "auth/requires-recent-login") {
          errorMessage = "Silakan login ulang untuk mengubah email";
        }
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!firebaseUser) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Validate passwords
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        toast.error("Semua field password harus diisi");
        setSaving(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("Password baru dan konfirmasi tidak sama");
        setSaving(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error("Password baru minimal 6 karakter");
        setSaving(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        firebaseUser.email!,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, passwordData.newPassword);

      toast.success("Password berhasil diupdate");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);

      let errorMessage = "Gagal mengupdate password";

      if (error && typeof error === "object" && "code" in error) {
        const authError = error as AuthError;

        if (authError.code === "auth/wrong-password") {
          errorMessage = "Password lama salah";
        } else if (authError.code === "auth/weak-password") {
          errorMessage = "Password terlalu lemah";
        } else if (authError.code === "auth/requires-recent-login") {
          errorMessage = "Silakan login ulang untuk mengubah password";
        }
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pengaturan Akun</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Informasi Profil
            </CardTitle>
            <CardDescription>
              Update informasi profil pribadi Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Foto Profil</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                    <Label htmlFor="photo" className={cn("cursor-pointer", isUploadingPhoto && "opacity-50 cursor-not-allowed")}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="w-4 h-4" />
                        Upload Foto
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maksimal 2MB, format JPG, PNG
                    </p>
                    {isUploadingPhoto && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Uploading...</span>
                          <span>{photoUploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${photoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KTM Upload */}
              <div className="space-y-2">
                <Label>Foto KTM</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 rounded-md overflow-hidden bg-muted border">
                    {ktmPreview ? (
                      <Image
                        src={ktmPreview}
                        alt="KTM"
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="ktm"
                      type="file"
                      accept="image/*"
                      onChange={handleKtmChange}
                      className="hidden"
                      disabled={isUploadingKtm}
                    />
                    <Label htmlFor="ktm" className={cn("cursor-pointer", isUploadingKtm && "opacity-50 cursor-not-allowed")}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="w-4 h-4" />
                        Upload KTM
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maksimal 2MB, format JPG, PNG
                    </p>
                    {isUploadingKtm && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Uploading...</span>
                          <span>{ktmUploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${ktmUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nama Panggilan</Label>
                  <Input
                    id="nickname"
                    value={profileData.nickname}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        nickname: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nim">
                    NIM <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nim"
                    value={profileData.nim}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        nim: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        gender: value as Gender,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Laki-laki</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !profileData.birthDate && "text-muted-foreground"
                        )}
                      >
                        {profileData.birthDate ? (
                          format(profileData.birthDate, "PPP", {
                            locale: localeId,
                          })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-2">
                        {/* Year and Month Selectors */}
                        <div className="flex gap-2">
                          <Select
                            value={profileData.birthDate
                              .getFullYear()
                              .toString()}
                            onValueChange={(value) => {
                              const newDate = new Date(profileData.birthDate);
                              newDate.setFullYear(parseInt(value));
                              setProfileData((prev) => ({
                                ...prev,
                                birthDate: newDate,
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 100 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                  <SelectItem
                                    key={year}
                                    value={year.toString()}
                                  >
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          <Select
                            value={profileData.birthDate.getMonth().toString()}
                            onValueChange={(value) => {
                              const newDate = new Date(profileData.birthDate);
                              newDate.setMonth(parseInt(value));
                              setProfileData((prev) => ({
                                ...prev,
                                birthDate: newDate,
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date(2000, i, 1);
                                return (
                                  <SelectItem key={i} value={i.toString()}>
                                    {format(date, "MMMM", { locale: localeId })}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Calendar */}
                        <Calendar
                          mode="single"
                          selected={profileData.birthDate}
                          onSelect={(date) =>
                            setProfileData((prev) => ({
                              ...prev,
                              birthDate: date || new Date(),
                            }))
                          }
                          month={profileData.birthDate}
                          onMonthChange={(date) =>
                            setProfileData((prev) => ({
                              ...prev,
                              birthDate: date,
                            }))
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthPlace">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="birthPlace"
                    value={profileData.birthPlace}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        birthPlace: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryYear">
                    Tahun Masuk <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={profileData.entryYear.toString()}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        entryYear: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Alamat <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </div>

              {/* Academic Information */}
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">
                    Jurusan <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={profileData.major}
                    onValueChange={handleJurusanChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurusanList.map((jurusan) => (
                        <SelectItem key={jurusan.nama} value={jurusan.nama}>
                          {jurusan.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Program Studi <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={profileData.department}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        department: value,
                      }))
                    }
                    disabled={!selectedJurusan}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih program studi" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedJurusan?.program_studi.map((prodi) => (
                        <SelectItem key={prodi.nama} value={prodi.nama}>
                          {prodi.jenjang} - {prodi.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Keamanan Akun
            </CardTitle>
            <CardDescription>
              Kelola email dan password akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {firebaseUser?.email}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowEmailModal(true)}>
                Ubah Email
              </Button>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">????????????</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Ubah Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Email</DialogTitle>
            <DialogDescription>
              Masukkan email baru dan password Anda untuk konfirmasi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email Baru</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailData.newEmail}
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    newEmail: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailPassword">Password</Label>
              <Input
                id="emailPassword"
                type="password"
                value={emailData.password}
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Masukkan password lama dan password baru Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Lama</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        imageUrl={imageToCrop}
        onCropComplete={handleCropComplete}
        onClose={() => setShowCropDialog(false)}
      />
    </div>
  );
}
