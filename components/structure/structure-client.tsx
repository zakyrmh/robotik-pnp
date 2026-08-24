"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete01Icon,
  PlusSignIcon,
  Search01Icon,
  Camera01Icon,
  HierarchyIcon,
  UserGroupIcon,
  Calendar03Icon,
  Building01Icon,
  Layers01Icon,
  FilterIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import NextImage from "next/image";
import { ImageCropperModal } from "@/components/onboarding/image-cropper-modal";
import imageCompression from "browser-image-compression";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  createMembershipPeriod,
  updateMembershipPeriod,
  deleteMembershipPeriod,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createLegacyMember,
  updateLegacyMember,
  deleteLegacyMember,
  createDivision,
  updateDivision,
  deleteDivision,
  createOrgHistory,
  updateOrgHistory,
  deleteOrgHistory,
} from "@/lib/actions/structure";

// --- Types ---

export interface Period {
  id: string;
  period_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  category: string;
  sort_order: number | null;
  created_at: string;
}

export interface LegacyMember {
  nim: string;
  full_name: string;
  gender: string | null;
  study_program_id: string | null;
  avatar_url: string | null;
  study_program: { name: string } | null;
}

export interface StudyProgram {
  id: string;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  is_active: boolean;
  sort_order: number | null;
}

export interface OrgHistory {
  id: string;
  period_id: string;
  nim_member: string;
  department_id: string;
  division_id: string | null;
  role_name: string;
  sub_section: string | null;
  sort_order: number | null;
  period: { period_name: string } | null;
  member: { full_name: string; gender: string | null } | null;
  department: { name: string } | null;
  division: { name: string } | null;
}

export interface StructureClientProps {
  initialPeriods: Period[];
  initialDepartments: Department[];
  initialLegacyMembers: LegacyMember[];
  initialDivisions: Division[];
  initialOrgHistories: OrgHistory[];
  initialStudyPrograms: StudyProgram[];
}

export function StructureClient({
  initialPeriods,
  initialDepartments,
  initialLegacyMembers,
  initialDivisions,
  initialOrgHistories,
  initialStudyPrograms,
}: StructureClientProps) {
  const router = useRouter();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>("org_histories");

  // Search & Filter states
  const [searchOrg, setSearchOrg] = useState("");
  const [selectedPeriodFilter, setSelectedPeriodFilter] =
    useState<string>("all");
  const [searchMembers, setSearchMembers] = useState("");
  const [searchDepartments, setSearchDepartments] = useState("");
  const [searchDivisions, setSearchDivisions] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "update">("create");

  const [activeItem, setActiveItem] = useState<Record<string, unknown> | null>(
    null,
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studyProgramOpen, setStudyProgramOpen] = useState(false);

  // Avatar states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<
    string | null
  >(null);

  // Helper to open create/update dialog
  const handleOpenDialog = (
    type: "create" | "update",
    item: Record<string, unknown> | null = null,
  ) => {
    setDialogType(type);
    setActiveItem(item);
    setAvatarFile(null);
    if (type === "create") {
      // Set sensible defaults
      if (activeTab === "periods") {
        setFormData({ is_active: true });
      } else if (activeTab === "divisions") {
        setFormData({ is_active: true });
      } else if (activeTab === "org_histories") {
        const activePeriod = initialPeriods.find((p) => p.is_active);
        setFormData({
          period_id: activePeriod?.id || initialPeriods[0]?.id || "",
          role_name: "Anggota",
        });
      } else {
        setFormData({});
      }
      setAvatarPreview(null);
    } else {
      setFormData(item || {});
      setAvatarPreview((item?.avatar_url as string) || null);
    }
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: Record<string, unknown>) => {
    setActiveItem(item);
    setDeleteDialogOpen(true);
  };

  // ---------------------------------------------
  // TAB TITLES & CTA LABELS
  // ---------------------------------------------
  const getTabMeta = () => {
    switch (activeTab) {
      case "org_histories":
        return {
          title: "Struktur Organisasi",
          subtitle:
            "Penetapan pengurus, jabatan, dan penempatan divisi per periode kepengurusan.",
          buttonLabel: "Tambah Pengurus",
          count: initialOrgHistories.length,
        };
      case "members":
        return {
          title: "Database Anggota",
          subtitle: "Master data seluruh anggota dan alumni UKM Robotik PNP.",
          buttonLabel: "Tambah Anggota",
          count: initialLegacyMembers.length,
        };
      case "periods":
        return {
          title: "Periode Kepengurusan",
          subtitle:
            "Daftar masa bakti dan status aktif kepengurusan organisasi.",
          buttonLabel: "Tambah Periode",
          count: initialPeriods.length,
        };
      case "departments":
        return {
          title: "Departemen Organisasi",
          subtitle:
            "Struktur departemen internal (BPH, Kestari, Komdis, Humas, dll).",
          buttonLabel: "Tambah Departemen",
          count: initialDepartments.length,
        };
      case "divisions":
        return {
          title: "Divisi Teknis & Riset",
          subtitle:
            "Kelompok divisi lomba dan teknologi robotika (KRSBI, KRI, KRSTI, dll).",
          buttonLabel: "Tambah Divisi",
          count: initialDivisions.length,
        };
      default:
        return {
          title: "Manajemen Struktur",
          subtitle:
            "Kelola struktur organisasi, divisi, departemen, dan data anggota.",
          buttonLabel: "Tambah Data",
          count: 0,
        };
    }
  };

  // ---------------------------------------------
  // FORM HANDLERS
  // ---------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let result: { success: boolean; error?: string } = {
      success: false,
      error: "Gagal memproses",
    };

    try {
      if (activeTab === "periods") {
        const payload = {
          period_name: (formData.period_name as string) || "",
          is_active:
            formData.is_active === true || formData.is_active === "true",
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result =
          dialogType === "create"
            ? await createMembershipPeriod(payload)
            : await updateMembershipPeriod(activeItem?.id as string, payload);
      } else if (activeTab === "departments") {
        const payload = {
          name: (formData.name as string) || "",
          category: (formData.category as string) || "General",
          sort_order: formData.sort_order
            ? parseInt(formData.sort_order as string, 10)
            : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result =
          dialogType === "create"
            ? await createDepartment(payload)
            : await updateDepartment(activeItem?.id as string, payload);
      } else if (activeTab === "members") {
        const formDataPayload = new FormData();
        formDataPayload.append("nim", (formData.nim as string) || "");
        formDataPayload.append(
          "full_name",
          (formData.full_name as string) || "",
        );
        formDataPayload.append("gender", (formData.gender as string) || "");
        formDataPayload.append(
          "study_program_id",
          (formData.study_program_id as string) || "",
        );

        if (avatarFile) {
          formDataPayload.append("avatar", avatarFile);
        } else if (formData.avatar_url === null && dialogType === "update") {
          formDataPayload.append("remove_avatar", "true");
        }

        if (dialogType === "update" && !activeItem?.nim) return;
        result =
          dialogType === "create"
            ? await createLegacyMember(formDataPayload)
            : await updateLegacyMember(
                activeItem?.nim as string,
                formDataPayload,
              );
      } else if (activeTab === "divisions") {
        const payload = {
          name: (formData.name as string) || "",
          slug: (formData.slug as string) || "",
          short_description: (formData.short_description as string) || "",
          is_active:
            formData.is_active === true || formData.is_active === "true",
          sort_order: formData.sort_order
            ? parseInt(formData.sort_order as string, 10)
            : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result =
          dialogType === "create"
            ? await createDivision(payload)
            : await updateDivision(activeItem?.id as string, payload);
      } else if (activeTab === "org_histories") {
        const payload = {
          period_id: (formData.period_id as string) || "",
          nim_member: (formData.nim_member as string) || "",
          department_id: (formData.department_id as string) || "",
          division_id: (formData.division_id as string) || null,
          role_name: (formData.role_name as string) || "Anggota",
          sub_section: (formData.sub_section as string) || null,
          sort_order: formData.sort_order
            ? parseInt(formData.sort_order as string, 10)
            : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result =
          dialogType === "create"
            ? await createOrgHistory(payload)
            : await updateOrgHistory(activeItem?.id as string, payload);
      }

      if (result.success) {
        toast.success(
          `Berhasil ${dialogType === "create" ? "menambahkan" : "memperbarui"} data!`,
        );
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Gagal menyimpan data.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    let result: { success: boolean; error?: string } = {
      success: false,
      error: "Gagal menghapus",
    };

    try {
      if (activeItem) {
        if (activeTab === "periods" && activeItem.id)
          result = await deleteMembershipPeriod(activeItem.id as string);
        else if (activeTab === "departments" && activeItem.id)
          result = await deleteDepartment(activeItem.id as string);
        else if (activeTab === "members" && activeItem.nim)
          result = await deleteLegacyMember(activeItem.nim as string);
        else if (activeTab === "divisions" && activeItem.id)
          result = await deleteDivision(activeItem.id as string);
        else if (activeTab === "org_histories" && activeItem.id)
          result = await deleteOrgHistory(activeItem.id as string);
      }

      if (result.success) {
        toast.success("Berhasil menghapus data!");
        setDeleteDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Gagal menghapus data.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const processAvatarImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 512,
      useWebWorker: true,
    };
    try {
      const compressed = await imageCompression(file, options);
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(compressed);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(
              new File([compressed], "avatar.webp", { type: "image/webp" }),
            );
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], "avatar.webp", { type: "image/webp" }),
                );
              } else {
                resolve(
                  new File([compressed], "avatar.webp", { type: "image/webp" }),
                );
              }
            },
            "image/webp",
            0.85,
          );
        };
        img.onerror = () => {
          resolve(
            new File([compressed], "avatar.webp", { type: "image/webp" }),
          );
        };
      });
    } catch (error) {
      console.error("Error processing avatar image:", error);
      return file;
    }
  };

  // Filtered lists
  const filteredOrgHistories = useMemo(() => {
    return initialOrgHistories.filter((item) => {
      const matchSearch =
        !searchOrg ||
        item.member?.full_name
          .toLowerCase()
          .includes(searchOrg.toLowerCase()) ||
        item.nim_member.includes(searchOrg) ||
        item.role_name.toLowerCase().includes(searchOrg.toLowerCase()) ||
        (item.department?.name &&
          item.department.name
            .toLowerCase()
            .includes(searchOrg.toLowerCase())) ||
        (item.division?.name &&
          item.division.name.toLowerCase().includes(searchOrg.toLowerCase()));

      const matchPeriod =
        selectedPeriodFilter === "all" ||
        item.period_id === selectedPeriodFilter;

      return matchSearch && matchPeriod;
    });
  }, [initialOrgHistories, searchOrg, selectedPeriodFilter]);

  const filteredMembers = useMemo(() => {
    if (!searchMembers) return initialLegacyMembers;
    const q = searchMembers.toLowerCase();
    return initialLegacyMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.nim.includes(q) ||
        (m.study_program?.name &&
          m.study_program.name.toLowerCase().includes(q)),
    );
  }, [initialLegacyMembers, searchMembers]);

  const filteredDepartments = useMemo(() => {
    if (!searchDepartments) return initialDepartments;
    const q = searchDepartments.toLowerCase();
    return initialDepartments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }, [initialDepartments, searchDepartments]);

  const filteredDivisions = useMemo(() => {
    if (!searchDivisions) return initialDivisions;
    const q = searchDivisions.toLowerCase();
    return initialDivisions.filter(
      (div) =>
        div.name.toLowerCase().includes(q) ||
        div.slug.toLowerCase().includes(q) ||
        div.short_description?.toLowerCase().includes(q),
    );
  }, [initialDivisions, searchDivisions]);

  // ---------------------------------------------
  // RENDER MODAL FORM FIELDS
  // ---------------------------------------------

  const renderFormFields = () => {
    if (activeTab === "periods") {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="period_name" className="text-sm font-medium">
              Nama Periode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="period_name"
              placeholder="Contoh: 2025/2026 atau Periode XXX"
              value={(formData.period_name as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, period_name: e.target.value })
              }
              className="min-h-[44px] rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="is_active" className="text-sm font-medium">
              Status Periode
            </Label>
            <Select
              value={
                formData.is_active === true || formData.is_active === "true"
                  ? "true"
                  : "false"
              }
              onValueChange={(val) =>
                setFormData({ ...formData, is_active: val === "true" })
              }
            >
              <SelectTrigger className="min-h-[44px] rounded-lg">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Aktif (Sedang Berjalan)</span>
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span>Tidak Aktif (Demisioner/Arsip)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (activeTab === "departments") {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Nama Departemen <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Badan Pengurus Harian (BPH)"
              value={(formData.name as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="min-h-[44px] rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-medium">
              Kategori / Tipe
            </Label>
            <Input
              id="category"
              placeholder="Contoh: Inti, Operasional, Teknis"
              value={(formData.category as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="min-h-[44px] rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sort_order" className="text-sm font-medium">
              Urutan Tampil (Sort Order)
            </Label>
            <Input
              id="sort_order"
              type="number"
              placeholder="1, 2, 3..."
              value={(formData.sort_order as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: e.target.value })
              }
              className="min-h-[44px] rounded-lg font-mono"
            />
          </div>
        </div>
      );
    }

    if (activeTab === "members") {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nim" className="text-sm font-medium">
              Nomor Induk Mahasiswa (NIM){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nim"
              placeholder="Contoh: 2101092001"
              value={(formData.nim as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, nim: e.target.value })
              }
              disabled={dialogType === "update"}
              className="min-h-[44px] rounded-lg font-mono uppercase"
              required
            />
            {dialogType === "update" && (
              <p className="text-[11px] text-muted-foreground">
                NIM adalah pengenal unik identitas anggota dan tidak dapat
                diubah langsung.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-sm font-medium">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Masukkan nama lengkap anggota"
              value={(formData.full_name as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="min-h-[44px] rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-sm font-medium">
                Jenis Kelamin
              </Label>
              <Select
                value={(formData.gender as string) || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, gender: val })
                }
              >
                <SelectTrigger className="min-h-[44px] rounded-lg">
                  <SelectValue placeholder="Pilih JK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-Laki (L)</SelectItem>
                  <SelectItem value="P">Perempuan (P)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="study_program_id" className="text-sm font-medium">
                Program Studi
              </Label>
              <Popover
                open={studyProgramOpen}
                onOpenChange={setStudyProgramOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studyProgramOpen}
                    className="w-full justify-between min-h-[44px] rounded-lg font-normal text-xs text-left"
                  >
                    <span className="truncate">
                      {formData.study_program_id
                        ? initialStudyPrograms.find(
                            (sp) => sp.id === formData.study_program_id,
                          )?.name || "Pilih Program Studi"
                        : "Pilih Program Studi"}
                    </span>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={14}
                      className="ml-2 shrink-0 opacity-50"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0 rounded-lg"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Cari program studi..." />
                    <CommandList>
                      <CommandEmpty>
                        Program studi tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              study_program_id: null,
                            });
                            setStudyProgramOpen(false);
                          }}
                        >
                          -- Tanpa Program Studi --
                        </CommandItem>
                        {initialStudyPrograms.map((sp) => (
                          <CommandItem
                            key={sp.id}
                            value={sp.name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                study_program_id: sp.id,
                              });
                              setStudyProgramOpen(false);
                            }}
                          >
                            {sp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Foto Profil</Label>
            <div className="flex items-center gap-4 border border-border p-3.5 rounded-xl bg-surface/50 dark:bg-card">
              {avatarPreview ? (
                <div className="relative w-16 h-16 rounded-full border border-border overflow-hidden bg-muted shrink-0 shadow-xs">
                  <NextImage
                    src={avatarPreview}
                    alt="Preview Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground shrink-0 shadow-xs">
                  <HugeiconsIcon icon={Camera01Icon} size={22} />
                </div>
              )}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[36px] text-xs font-medium rounded-lg"
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "avatar-upload-input",
                      );
                      if (fileInput) fileInput.click();
                    }}
                  >
                    Pilih Foto
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-[36px] text-xs text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setFormData({ ...formData, avatar_url: null });
                      }}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Format JPG/PNG/WEBP · Max 2MB · Crop 1:1 otomatis.
                </span>
              </div>
            </div>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedImageForCrop(URL.createObjectURL(file));
                  setCropperModalOpen(true);
                }
              }}
            />
          </div>
        </div>
      );
    }

    if (activeTab === "divisions") {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Nama Divisi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: KRSBI Beroda, KRSTI, Robot Sepak Bola"
              value={(formData.name as string) || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                })
              }
              className="min-h-[44px] rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-sm font-medium">
              Slug URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="krsbi-beroda"
              value={(formData.slug as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="min-h-[44px] rounded-lg font-mono text-xs"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short_description" className="text-sm font-medium">
              Deskripsi Singkat Divisi
            </Label>
            <Input
              id="short_description"
              placeholder="Fokus pada perancangan robot berkaki humanoid..."
              value={(formData.short_description as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, short_description: e.target.value })
              }
              className="min-h-[44px] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="is_active" className="text-sm font-medium">
                Status Divisi
              </Label>
              <Select
                value={
                  formData.is_active === false || formData.is_active === "false"
                    ? "false"
                    : "true"
                }
                onValueChange={(val) =>
                  setFormData({ ...formData, is_active: val === "true" })
                }
              >
                <SelectTrigger className="min-h-[44px] rounded-lg">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort_order" className="text-sm font-medium">
                Urutan Tampil
              </Label>
              <Input
                id="sort_order"
                type="number"
                placeholder="1, 2, 3..."
                value={(formData.sort_order as string) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
                className="min-h-[44px] rounded-lg font-mono"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "org_histories") {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="period_id" className="text-sm font-medium">
              Periode Kepengurusan <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(formData.period_id as string) || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, period_id: val })
              }
              required
            >
              <SelectTrigger className="min-h-[44px] rounded-lg">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {initialPeriods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.period_name}</span>
                      {p.is_active && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-primary-soft text-primary font-medium"
                        >
                          Aktif
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nim_member" className="text-sm font-medium">
              Anggota Organisasi (NIM){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={(formData.nim_member as string) || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, nim_member: val })
              }
              required
            >
              <SelectTrigger className="min-h-[44px] rounded-lg">
                <SelectValue placeholder="Pilih Anggota" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {initialLegacyMembers.map((m) => (
                  <SelectItem key={m.nim} value={m.nim}>
                    <span>{m.full_name}</span>{" "}
                    <span className="font-mono text-muted-foreground text-xs">
                      ({m.nim})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="department_id" className="text-sm font-medium">
                Departemen <span className="text-destructive">*</span>
              </Label>
              <Select
                value={(formData.department_id as string) || ""}
                onValueChange={(val) =>
                  setFormData({ ...formData, department_id: val })
                }
                required
              >
                <SelectTrigger className="min-h-[44px] rounded-lg">
                  <SelectValue placeholder="Pilih Departemen" />
                </SelectTrigger>
                <SelectContent>
                  {initialDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="division_id" className="text-sm font-medium">
                Divisi Teknis (Opsional)
              </Label>
              <Select
                value={(formData.division_id as string) || "none"}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    division_id: val === "none" ? null : val,
                  })
                }
              >
                <SelectTrigger className="min-h-[44px] rounded-lg">
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Tanpa Divisi --</SelectItem>
                  {initialDivisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role_name" className="text-sm font-medium">
                Nama Jabatan / Peran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role_name"
                value={(formData.role_name as string) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, role_name: e.target.value })
                }
                placeholder="Contoh: Ketua Umum, Koordinator, Anggota"
                className="min-h-[44px] rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort_order" className="text-sm font-medium">
                Urutan Hirarki
              </Label>
              <Input
                id="sort_order"
                type="number"
                placeholder="1 (Paling Atas)"
                value={(formData.sort_order as string) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
                className="min-h-[44px] rounded-lg font-mono"
              />
            </div>
          </div>
        </div>
      );
    }
  };

  const meta = getTabMeta();

  // ---------------------------------------------
  // MAIN COMPONENT RENDER
  // ---------------------------------------------

  return (
    <div className="space-y-6">
      {/* HERO / HEADER SECTION */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <HugeiconsIcon icon={HierarchyIcon} size={22} />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Manajemen Struktur Organisasi
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Kelola struktur kepengurusan, divisi riset, departemen, dan
                  keanggotaan UKM Robotik PNP.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleOpenDialog("create")}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-xs flex items-center justify-center gap-2 text-sm transition-all"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
            <span>{meta.buttonLabel}</span>
          </Button>
        </div>
      </div>

      {/* CONTENT TABS */}
      <Tabs
        defaultValue="org_histories"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        {/* RESPONSIVE SCROLLABLE TABS LIST */}
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/70 dark:bg-muted/40 p-1 rounded-xl border border-border h-auto inline-flex min-w-full sm:min-w-0 gap-1">
            <TabsTrigger
              value="org_histories"
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <HugeiconsIcon icon={HierarchyIcon} size={16} />
              <span>Struktur Organisasi</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full">
                {initialOrgHistories.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="members"
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Data Anggota</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full">
                {initialLegacyMembers.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="periods"
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              <span>Periode</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full">
                {initialPeriods.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="departments"
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <HugeiconsIcon icon={Building01Icon} size={16} />
              <span>Departemen</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full">
                {initialDepartments.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="divisions"
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2"
            >
              <HugeiconsIcon icon={Layers01Icon} size={16} />
              <span>Divisi</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full">
                {initialDivisions.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* MAIN TAB CARD CONTAINER */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xs overflow-hidden">
          {/* ========================================================
              TAB 1: STRUKTUR ORGANISASI
             ======================================================== */}
          <TabsContent value="org_histories" className="m-0 p-0 outline-hidden">
            {/* TOOLBAR */}
            <div className="p-4 sm:p-5 border-b border-border bg-surface/30 dark:bg-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Cari nama, NIM, jabatan, atau divisi..."
                  className="pl-9 min-h-[44px] rounded-lg border-border bg-background text-sm"
                  value={searchOrg}
                  onChange={(e) => setSearchOrg(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <HugeiconsIcon icon={FilterIcon} size={14} />
                  <span className="hidden sm:inline">Periode:</span>
                </div>
                <Select
                  value={selectedPeriodFilter}
                  onValueChange={setSelectedPeriodFilter}
                >
                  <SelectTrigger className="min-h-[44px] min-w-[150px] rounded-lg text-xs">
                    <SelectValue placeholder="Semua Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Periode</SelectItem>
                    {initialPeriods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.period_name} {p.is_active ? "(Aktif)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-muted/40 dark:bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 sm:px-5">Periode</th>
                    <th className="py-3 px-4">Nama / NIM</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Departemen / Divisi</th>
                    <th className="py-3 px-4 text-center w-16">Urutan</th>
                    <th className="py-3 px-4 sm:px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredOrgHistories.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {item.period?.period_name || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {item.member?.full_name || "Tidak Diketahui"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.nim_member}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className="font-medium text-xs rounded-full px-2.5 py-0.5 bg-primary-soft text-primary border border-primary/20"
                        >
                          {item.role_name}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">
                          {item.department?.name || "-"}
                        </div>
                        {item.division && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-strong shrink-0" />
                            <span>{item.division.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                        {item.sort_order ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleOpenDialog(
                                "update",
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit Data"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              handleOpenDelete(
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Hapus Data"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredOrgHistories.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 px-4 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={HierarchyIcon} size={24} />
                          </div>
                          <p className="font-medium text-foreground text-sm">
                            Tidak ada data struktur organisasi
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {searchOrg || selectedPeriodFilter !== "all"
                              ? "Coba ubah kata kunci pencarian atau filter periode Anda."
                              : "Mulai tambahkan pengurus organisasi untuk periode aktif."}
                          </p>
                          {!searchOrg && selectedPeriodFilter === "all" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog("create")}
                              className="mt-2 text-xs rounded-lg min-h-[36px]"
                            >
                              Tambah Pengurus Baru
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 2: DATA ANGGOTA (LEGACY MEMBERS)
             ======================================================== */}
          <TabsContent value="members" className="m-0 p-0 outline-hidden">
            {/* TOOLBAR */}
            <div className="p-4 sm:p-5 border-b border-border bg-surface/30 dark:bg-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Cari nama, NIM, atau program studi..."
                  className="pl-9 min-h-[44px] rounded-lg border-border bg-background text-sm"
                  value={searchMembers}
                  onChange={(e) => setSearchMembers(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {filteredMembers.length}
                </span>{" "}
                anggota
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-muted/40 dark:bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 sm:px-5">Anggota</th>
                    <th className="py-3 px-4">NIM</th>
                    <th className="py-3 px-4">Jenis Kelamin</th>
                    <th className="py-3 px-4">Program Studi</th>
                    <th className="py-3 px-4 sm:px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredMembers.map((item) => (
                    <tr
                      key={item.nim}
                      className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          {item.avatar_url ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border bg-muted shrink-0 shadow-2xs">
                              <NextImage
                                src={item.avatar_url}
                                alt={item.full_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary border border-primary/20 flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs">
                              {item.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">
                              {item.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {item.nim}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {item.gender === "L" ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-normal rounded-md"
                          >
                            Laki-Laki
                          </Badge>
                        ) : item.gender === "P" ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-normal rounded-md"
                          >
                            Perempuan
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {item.study_program?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleOpenDialog(
                                "update",
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit Anggota"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              handleOpenDelete(
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Hapus Anggota"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 px-4 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={UserGroupIcon} size={24} />
                          </div>
                          <p className="font-medium text-foreground text-sm">
                            Tidak ada data anggota ditemukan
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {searchMembers
                              ? "Coba gunakan kata kunci pencarian yang lain."
                              : "Mulai tambahkan anggota pertama ke sistem."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 3: PERIODE KEPENGURUSAN
             ======================================================== */}
          <TabsContent value="periods" className="m-0 p-0 outline-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-muted/40 dark:bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 sm:px-5">Nama Periode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-xs text-muted-foreground">
                      Dibuat Pada
                    </th>
                    <th className="py-3 px-4 sm:px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {initialPeriods.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-semibold text-foreground">
                        {item.period_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.is_active ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-full font-medium text-xs px-2.5 py-0.5">
                            <HugeiconsIcon
                              icon={CheckmarkCircle01Icon}
                              size={12}
                              className="mr-1 inline"
                            />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full text-muted-foreground font-normal text-xs px-2.5 py-0.5"
                          >
                            Tidak Aktif
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleOpenDialog(
                                "update",
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit Periode"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              handleOpenDelete(
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Hapus Periode"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {initialPeriods.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 px-4 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={Calendar03Icon} size={24} />
                          </div>
                          <p className="font-medium text-foreground text-sm">
                            Belum ada periode kepengurusan
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog("create")}
                            className="mt-2 text-xs rounded-lg min-h-[36px]"
                          >
                            Tambah Periode Baru
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 4: DEPARTEMEN
             ======================================================== */}
          <TabsContent value="departments" className="m-0 p-0 outline-hidden">
            {/* TOOLBAR */}
            <div className="p-4 sm:p-5 border-b border-border bg-surface/30 dark:bg-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Cari departemen atau kategori..."
                  className="pl-9 min-h-[44px] rounded-lg border-border bg-background text-sm"
                  value={searchDepartments}
                  onChange={(e) => setSearchDepartments(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-muted/40 dark:bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 sm:px-5 w-16 text-center">
                      Urutan
                    </th>
                    <th className="py-3 px-4">Nama Departemen</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 sm:px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredDepartments.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-mono text-xs text-muted-foreground text-center">
                        {item.sort_order ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal rounded-md"
                        >
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleOpenDialog(
                                "update",
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit Departemen"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              handleOpenDelete(
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Hapus Departemen"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 px-4 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={Building01Icon} size={24} />
                          </div>
                          <p className="font-medium text-foreground text-sm">
                            Tidak ada data departemen
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog("create")}
                            className="mt-2 text-xs rounded-lg min-h-[36px]"
                          >
                            Tambah Departemen Baru
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 5: DIVISI
             ======================================================== */}
          <TabsContent value="divisions" className="m-0 p-0 outline-hidden">
            {/* TOOLBAR */}
            <div className="p-4 sm:p-5 border-b border-border bg-surface/30 dark:bg-card flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Cari nama divisi atau deskripsi..."
                  className="pl-9 min-h-[44px] rounded-lg border-border bg-background text-sm"
                  value={searchDivisions}
                  onChange={(e) => setSearchDivisions(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-muted/40 dark:bg-muted/20 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 sm:px-5 w-16 text-center">
                      Urutan
                    </th>
                    <th className="py-3 px-4">Nama Divisi</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredDivisions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-mono text-xs text-muted-foreground text-center">
                        {item.sort_order ?? "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {item.name}
                        </div>
                        {item.short_description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.short_description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {item.slug}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.is_active ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-full font-medium text-xs px-2.5 py-0.5">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full text-muted-foreground font-normal text-xs px-2.5 py-0.5"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleOpenDialog(
                                "update",
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit Divisi"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              handleOpenDelete(
                                item as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Hapus Divisi"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDivisions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 px-4 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={Layers01Icon} size={24} />
                          </div>
                          <p className="font-medium text-foreground text-sm">
                            Tidak ada data divisi ditemukan
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog("create")}
                            className="mt-2 text-xs rounded-lg min-h-[36px]"
                          >
                            Tambah Divisi Baru
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* ========================================================
          DIALOG: CREATE / UPDATE MODAL
         ======================================================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border shadow-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card">
              <DialogTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
                {dialogType === "create" ? "Tambah Data Baru" : "Perbarui Data"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {dialogType === "create"
                  ? `Lengkapi formulir berikut untuk menambahkan data ke tab ${meta.title}.`
                  : "Perbarui informasi dan klik simpan untuk memperbarui database."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-background">
              {renderFormFields()}
            </div>

            <DialogFooter className="p-4 sm:p-5 border-t border-border bg-surface/40 dark:bg-card flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="min-h-[44px] rounded-lg text-sm"
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="min-h-[44px] rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan Data..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG: DELETE CONFIRMATION MODAL
         ======================================================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border shadow-lg">
          <div className="p-5 sm:p-6 space-y-3 bg-card">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <HugeiconsIcon icon={AlertCircleIcon} size={22} />
            </div>
            <DialogTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
              Konfirmasi Penghapusan
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini bersifat
              permanen dan data terkait dalam sistem akan terhapus.
            </DialogDescription>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-border bg-surface/40 dark:bg-card flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="min-h-[44px] rounded-lg text-sm"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="min-h-[44px] rounded-lg text-sm font-medium shadow-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menghapus..." : "Ya, Hapus Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModalOpen}
        imageSrc={selectedImageForCrop}
        onClose={() => {
          setCropperModalOpen(false);
          setSelectedImageForCrop(null);
        }}
        onCropComplete={async (croppedFile) => {
          setCropperModalOpen(false);
          setSelectedImageForCrop(null);
          toast.loading("Memproses dan mengompresi foto profil...", {
            id: "avatar-process",
          });
          try {
            const processedFile = await processAvatarImage(croppedFile);
            setAvatarFile(processedFile);
            setAvatarPreview(URL.createObjectURL(processedFile));
            toast.success("Foto profil siap diunggah!", {
              id: "avatar-process",
            });
          } catch {
            toast.error("Gagal memproses foto profil", {
              id: "avatar-process",
            });
          }
        }}
      />
    </div>
  );
}
