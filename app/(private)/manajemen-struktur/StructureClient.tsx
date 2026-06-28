"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete01Icon,
  PlusSignIcon,
  Search01Icon
} from "@hugeicons/core-free-icons";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  deleteOrgHistory
} from "@/lib/actions/structure";

// --- Types ---

interface Period {
  id: string;
  period_name: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  category: string;
  sort_order: number | null;
  created_at: string;
}

interface LegacyMember {
  nim: string;
  full_name: string;
  gender: string | null;
}

interface Division {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  is_active: boolean;
  sort_order: number | null;
}

interface OrgHistory {
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

interface StructureClientProps {
  initialPeriods: Period[];
  initialDepartments: Department[];
  initialLegacyMembers: LegacyMember[];
  initialDivisions: Division[];
  initialOrgHistories: OrgHistory[];
}

export function StructureClient({
  initialPeriods,
  initialDepartments,
  initialLegacyMembers,
  initialDivisions,
  initialOrgHistories
}: StructureClientProps) {
  const router = useRouter();

  // Tabs state
  const [activeTab, setActiveTab] = useState("org_histories");

  // Local data states (for optimistic updates or fast filtering)






  // Search states
  const [searchOrg, setSearchOrg] = useState("");
  const [searchMembers, setSearchMembers] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "update">("create");

  const [activeItem, setActiveItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to open dialog
  const handleOpenDialog = (type: "create" | "update", item: Record<string, unknown> | null = null) => {
    setDialogType(type);
    setActiveItem(item);
    if (type === "create") {
      setFormData({});
    } else {
      setFormData(item || {});
    }
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: Record<string, unknown>) => {
    setActiveItem(item);
    setDeleteDialogOpen(true);
  };

  // ---------------------------------------------
  // FORM HANDLERS
  // ---------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let result: { success: boolean; error?: string } = { success: false, error: "Gagal memproses" };

    try {
      if (activeTab === "periods") {
        const payload = {
          period_name: (formData.period_name as string) || "",
          is_active: formData.is_active === true || formData.is_active === "true",
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result = dialogType === "create"
          ? await createMembershipPeriod(payload)
          : await updateMembershipPeriod(activeItem?.id as string, payload);
      } else if (activeTab === "departments") {
        const payload = {
          name: (formData.name as string) || "",
          category: (formData.category as string) || "General",
          sort_order: formData.sort_order ? parseInt(formData.sort_order as string) : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result = dialogType === "create"
          ? await createDepartment(payload)
          : await updateDepartment(activeItem?.id as string, payload);
      } else if (activeTab === "members") {
        const payload = {
          nim: (formData.nim as string) || "",
          full_name: (formData.full_name as string) || "",
          gender: (formData.gender as string) || null,
        };
        if (dialogType === "update" && !activeItem?.nim) return;
        result = dialogType === "create"
          ? await createLegacyMember(payload)
          : await updateLegacyMember(activeItem?.nim as string, payload);
      } else if (activeTab === "divisions") {
        const payload = {
          name: (formData.name as string) || "",
          slug: (formData.slug as string) || "",
          short_description: (formData.short_description as string) || "",
          is_active: formData.is_active === true || formData.is_active === "true",
          sort_order: formData.sort_order ? parseInt(formData.sort_order as string) : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result = dialogType === "create"
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
          sort_order: formData.sort_order ? parseInt(formData.sort_order as string) : null,
        };
        if (dialogType === "update" && !activeItem?.id) return;
        result = dialogType === "create"
          ? await createOrgHistory(payload)
          : await updateOrgHistory(activeItem?.id as string, payload);
      }

      if (result.success) {
        toast.success(`Berhasil ${dialogType === "create" ? "menambahkan" : "memperbarui"} data!`);
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
    let result: { success: boolean; error?: string } = { success: false, error: "Gagal menghapus" };

    try {
      if (activeItem) {
        if (activeTab === "periods" && activeItem.id) result = await deleteMembershipPeriod(activeItem.id as string);
        else if (activeTab === "departments" && activeItem.id) result = await deleteDepartment(activeItem.id as string);
        else if (activeTab === "members" && activeItem.nim) result = await deleteLegacyMember(activeItem.nim as string);
        else if (activeTab === "divisions" && activeItem.id) result = await deleteDivision(activeItem.id as string);
        else if (activeTab === "org_histories" && activeItem.id) result = await deleteOrgHistory(activeItem.id as string);
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

  // ---------------------------------------------
  // RENDERERS
  // ---------------------------------------------

  const renderFormFields = () => {
    if (activeTab === "periods") {
      return (
        <>
          <div className="grid gap-2">
            <Label htmlFor="period_name">Nama Periode</Label>
            <Input
              id="period_name"
              value={(formData.period_name as string) || ""}
              onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="is_active">Status Aktif</Label>
            <Select
              value={formData.is_active === true || formData.is_active === "true" ? "true" : "false"}
              onValueChange={(val) => setFormData({ ...formData, is_active: val === "true" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    if (activeTab === "departments") {
      return (
        <>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Departemen</Label>
            <Input
              id="name"
              value={(formData.name as string) || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={(formData.category as string) || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sort_order">Urutan (Sort Order)</Label>
            <Input
              id="sort_order"
              type="number"
              value={(formData.sort_order as string) || ""}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>
        </>
      );
    }

    if (activeTab === "members") {
      return (
        <>
          <div className="grid gap-2">
            <Label htmlFor="nim">NIM</Label>
            <Input
              id="nim"
              value={(formData.nim as string) || ""}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              required
              disabled={dialogType === "update"} // NIM is PK, cannot be updated directly
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              value={(formData.full_name as string) || ""}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Select
              value={(formData.gender as string) || ""}
              onValueChange={(val) => setFormData({ ...formData, gender: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih JK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-Laki (L)</SelectItem>
                <SelectItem value="P">Perempuan (P)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    if (activeTab === "divisions") {
      return (
        <>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Divisi</Label>
            <Input
              id="name"
              value={(formData.name as string) || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={(formData.slug as string) || ""}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="short_description">Deskripsi Singkat</Label>
            <Input
              id="short_description"
              value={(formData.short_description as string) || ""}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="is_active">Status Aktif</Label>
            <Select
              value={formData.is_active === false || formData.is_active === "false" ? "false" : "true"}
              onValueChange={(val) => setFormData({ ...formData, is_active: val === "true" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sort_order">Urutan</Label>
            <Input
              id="sort_order"
              type="number"
              value={(formData.sort_order as string) || ""}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>
        </>
      );
    }

    if (activeTab === "org_histories") {
      return (
        <>
          <div className="grid gap-2">
            <Label htmlFor="period_id">Periode</Label>
            <Select
              value={(formData.period_id as string) || ""}
              onValueChange={(val) => setFormData({ ...formData, period_id: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {initialPeriods.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.period_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nim_member">Anggota (NIM)</Label>
            <Select
              value={(formData.nim_member as string) || ""}
              onValueChange={(val) => setFormData({ ...formData, nim_member: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Anggota" />
              </SelectTrigger>
              <SelectContent>
                {initialLegacyMembers.map(m => (
                  <SelectItem key={m.nim} value={m.nim}>{m.full_name} ({m.nim})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department_id">Departemen</Label>
            <Select
              value={(formData.department_id as string) || ""}
              onValueChange={(val) => setFormData({ ...formData, department_id: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Departemen" />
              </SelectTrigger>
              <SelectContent>
                {initialDepartments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="division_id">Divisi (Opsional)</Label>
            <Select
              value={(formData.division_id as string) || "none"}
              onValueChange={(val) => setFormData({ ...formData, division_id: val === "none" ? null : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tanpa Divisi --</SelectItem>
                {initialDivisions.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role_name">Jabatan (Peran)</Label>
            <Input
              id="role_name"
              value={(formData.role_name as string) || ""}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              required
              placeholder="Contoh: Ketua, Anggota"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sort_order">Urutan Tampil</Label>
            <Input
              id="sort_order"
              type="number"
              value={(formData.sort_order as string) || ""}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>
        </>
      );
    }
  };

  // ---------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0f24] p-6 text-white rounded-none border-b-[4px] border-b-[#0066b1]">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">Manajemen Struktur</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-[#0066b1] mt-1">Data Pengurus & Anggota</p>
        </div>
        <Button
          onClick={() => handleOpenDialog("create")}
          className="rounded-none bg-[#1c69d4] hover:bg-[#0066b1] font-mono text-xs uppercase tracking-widest"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Tambah Data
        </Button>
      </div>

      {/* CONTENT TABS */}
      <Tabs defaultValue="org_histories" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none h-auto p-0 w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger
            value="org_histories"
            className="rounded-none border-b-2 border-transparent data-active:border-[#1c69d4] data-active:bg-zinc-50 dark:data-active:bg-zinc-900 px-6 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Struktur Organisasi
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="rounded-none border-b-2 border-transparent data-active:border-[#1c69d4] data-active:bg-zinc-50 dark:data-active:bg-zinc-900 px-6 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Data Anggota
          </TabsTrigger>
          <TabsTrigger
            value="periods"
            className="rounded-none border-b-2 border-transparent data-active:border-[#1c69d4] data-active:bg-zinc-50 dark:data-active:bg-zinc-900 px-6 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Periode
          </TabsTrigger>
          <TabsTrigger
            value="departments"
            className="rounded-none border-b-2 border-transparent data-active:border-[#1c69d4] data-active:bg-zinc-50 dark:data-active:bg-zinc-900 px-6 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Departemen
          </TabsTrigger>
          <TabsTrigger
            value="divisions"
            className="rounded-none border-b-2 border-transparent data-active:border-[#1c69d4] data-active:bg-zinc-50 dark:data-active:bg-zinc-900 px-6 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Divisi
          </TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 mt-4 overflow-hidden shadow-sm">
          {/* TAB: ORG HISTORIES */}
          <TabsContent value="org_histories" className="m-0 border-none p-0 outline-none">
            <div className="p-4 flex items-center border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative w-full max-w-sm">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="CARI NAMA / NIM / JABATAN..."
                  className="pl-9 font-mono text-xs uppercase rounded-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  value={searchOrg}
                  onChange={(e) => setSearchOrg(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium">Periode</th>
                    <th className="p-4 font-medium">Nama / NIM</th>
                    <th className="p-4 font-medium">Jabatan</th>
                    <th className="p-4 font-medium">Departemen / Divisi</th>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {initialOrgHistories
                    .filter(o =>
                      o.member?.full_name.toLowerCase().includes(searchOrg.toLowerCase()) ||
                      o.nim_member.includes(searchOrg) ||
                      o.role_name.toLowerCase().includes(searchOrg.toLowerCase())
                    )
                    .map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-mono">{item.period?.period_name}</td>
                      <td className="p-4">
                        <div className="font-semibold">{item.member?.full_name || "Unknown"}</div>
                        <div className="font-mono text-[10px] text-zinc-500">{item.nim_member}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="rounded-sm bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                          {item.role_name}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[#1c69d4] dark:text-[#0066b1]">{item.department?.name}</div>
                        {item.division && <div className="text-[10px] text-zinc-500">{item.division.name}</div>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog("update", item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#e22718] hover:bg-[#e22718]/10" onClick={() => handleOpenDelete(item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialOrgHistories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono text-xs uppercase">
                        Tidak ada data struktur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB: MEMBERS */}
          <TabsContent value="members" className="m-0 border-none p-0 outline-none">
            <div className="p-4 flex items-center border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative w-full max-w-sm">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="CARI NAMA ATAU NIM..."
                  className="pl-9 font-mono text-xs uppercase rounded-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  value={searchMembers}
                  onChange={(e) => setSearchMembers(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium">NIM</th>
                    <th className="p-4 font-medium">Nama Lengkap</th>
                    <th className="p-4 font-medium">Jenis Kelamin</th>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {initialLegacyMembers
                    .filter(m => m.full_name.toLowerCase().includes(searchMembers.toLowerCase()) || m.nim.includes(searchMembers))
                    .map((item) => (
                    <tr key={item.nim} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-mono font-medium">{item.nim}</td>
                      <td className="p-4 uppercase">{item.full_name}</td>
                      <td className="p-4">{item.gender === 'L' ? 'Laki-Laki' : item.gender === 'P' ? 'Perempuan' : '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog("update", item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#e22718] hover:bg-[#e22718]/10" onClick={() => handleOpenDelete(item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB: PERIODS */}
          <TabsContent value="periods" className="m-0 border-none p-0 outline-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium">Nama Periode</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {initialPeriods.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-bold">{item.period_name}</td>
                      <td className="p-4">
                        {item.is_active ? (
                          <Badge className="bg-[#1c69d4] hover:bg-[#1c69d4]/80 text-white rounded-sm font-mono uppercase text-[9px]">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-sm font-mono uppercase text-[9px]">Tidak Aktif</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog("update", item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#e22718] hover:bg-[#e22718]/10" onClick={() => handleOpenDelete(item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB: DEPARTMENTS */}
          <TabsContent value="departments" className="m-0 border-none p-0 outline-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium w-16">Urutan</th>
                    <th className="p-4 font-medium">Nama Departemen</th>
                    <th className="p-4 font-medium">Kategori</th>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {initialDepartments.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-mono text-zinc-500">{item.sort_order}</td>
                      <td className="p-4 font-bold text-[#1c69d4] dark:text-[#0066b1] uppercase">{item.name}</td>
                      <td className="p-4 uppercase">{item.category}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog("update", item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#e22718] hover:bg-[#e22718]/10" onClick={() => handleOpenDelete(item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB: DIVISIONS */}
          <TabsContent value="divisions" className="m-0 border-none p-0 outline-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium w-16">Urutan</th>
                    <th className="p-4 font-medium">Nama Divisi</th>
                    <th className="p-4 font-medium">Slug</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {initialDivisions.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-mono text-zinc-500">{item.sort_order}</td>
                      <td className="p-4 font-bold text-[#1c69d4] dark:text-[#0066b1] uppercase">{item.name}</td>
                      <td className="p-4 font-mono text-[10px]">{item.slug}</td>
                      <td className="p-4">
                        {item.is_active ? (
                          <Badge className="bg-[#1c69d4] hover:bg-[#1c69d4]/80 text-white rounded-sm font-mono uppercase text-[9px]">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-sm font-mono uppercase text-[9px]">Tidak Aktif</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog("update", item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#e22718] hover:bg-[#e22718]/10" onClick={() => handleOpenDelete(item as unknown as Record<string, unknown>)}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* DIALOG: CREATE / UPDATE */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="bg-[#0a0f24] p-4 border-b border-[#1c69d4]">
              <DialogTitle className="text-white font-heading uppercase">
                {dialogType === "create" ? "Tambah Data" : "Edit Data"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-mono text-[10px] uppercase mt-1">
                Isi form di bawah untuk {dialogType === "create" ? "menyimpan data baru" : "memperbarui data"}.
              </DialogDescription>
            </div>

            <div className="p-4 grid gap-4 bg-white dark:bg-zinc-950 max-h-[60vh] overflow-y-auto">
              {renderFormFields()}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none font-mono text-xs uppercase" disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="rounded-none font-mono text-xs uppercase bg-[#1c69d4] hover:bg-[#0066b1] text-white" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DELETE CONFIRMATION */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-none border border-[#e22718] p-0 overflow-hidden">
          <div className="bg-[#e22718] p-4">
            <DialogTitle className="text-white font-heading uppercase flex items-center gap-2">
              <HugeiconsIcon icon={Delete01Icon} size={20} />
              Konfirmasi Hapus
            </DialogTitle>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-950">
            <p className="text-sm">Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-none font-mono text-xs uppercase" disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-none font-mono text-xs uppercase bg-[#e22718] hover:bg-[#e22718]/80 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
