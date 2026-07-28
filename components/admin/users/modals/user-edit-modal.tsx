"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { UserManagementItem, UserRole } from "@/lib/types/user-management";
import { updateUserIdentityAction } from "@/lib/actions/admin-users";
import { toast } from "sonner";
import { ShieldAlert, Loader2, Save } from "lucide-react";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserManagementItem | null;
  studyPrograms: Array<{ id: string; name: string; degree: string }>;
  currentUserId: string;
}

export function UserEditModal({
  isOpen,
  onClose,
  user,
  studyPrograms,
  currentUserId,
}: UserEditModalProps) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [nim, setNim] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studyProgramId, setStudyProgramId] = useState<string>("none");
  const [role, setRole] = useState<UserRole>("anggota");
  const [isOnboarded, setIsOnboarded] = useState(true);

  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setFullName(user.fullName || "");
    setNim(user.nim || "");
    setPhoneNumber(user.phoneNumber || "");
    setStudyProgramId(user.studyProgramId || "none");
    setRole(user.role);
    setIsOnboarded(user.isOnboarded);
  }

  if (!user) return null;

  const isSelf = currentUserId === user.id;
  const isSelfDemotion = isSelf && role !== "super-admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter.");
      return;
    }

    if (isSelfDemotion) {
      toast.error(
        "Anda tidak dapat mencopot role Super Admin dari akun Anda sendiri.",
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateUserIdentityAction({
          userId: user.id,
          role,
          fullName: fullName.trim(),
          nim: nim.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          studyProgramId: studyProgramId === "none" ? null : studyProgramId,
          isOnboarded,
        });

        if (res.success) {
          toast.success(res.message);
          onClose();
        } else {
          toast.error("Gagal memperbarui data pengguna.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <span>Edit Identitas & Peran Pengguna</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Perbarui peranan sistem dan identitas dasar pengguna ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Email (Readonly) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-neutral-500">
              Email Akun (Read-only)
            </Label>
            <Input
              value={user.email}
              disabled
              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 h-9 rounded-xl text-xs"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap..."
              className="h-9 rounded-xl text-xs"
              required
            />
          </div>

          {/* NIM & Phone Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                NIM
              </Label>
              <Input
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="210109..."
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                No. WhatsApp
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0812..."
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Study Program */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Program Studi
            </Label>
            <Select
              value={studyProgramId}
              onValueChange={(val) => setStudyProgramId(val)}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder="Pilih Program Studi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tanpa Program Studi --</SelectItem>
                {studyPrograms.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.degree} - {sp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Role */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Peran Sistem (Role) <span className="text-red-500">*</span>
            </Label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as UserRole)}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super-admin">Super Admin</SelectItem>
                <SelectItem value="admin-or">Admin OR</SelectItem>
                <SelectItem value="admin-komdis">Admin Komdis</SelectItem>
                <SelectItem value="admin-kestari">Admin Kestari</SelectItem>
                <SelectItem value="admin-divisi">Admin Divisi</SelectItem>
                <SelectItem value="anggota">Anggota Aktif</SelectItem>
                <SelectItem value="caang">Calon Anggota (Caang)</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Self-Demotion Alert */}
          {isSelfDemotion && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Peringatan Keamanan:</strong> Anda sedang meninjau akun
                Anda sendiri. Anda tidak dapat mencopot role Super Admin dari
                akun yang sedang login.
              </span>
            </div>
          )}

          {/* Is Onboarded Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Status Onboarding
              </Label>
              <p className="text-[11px] text-neutral-500">
                Tandai jika pengguna telah menyelesaikan alur pendaftaran awal.
              </p>
            </div>
            <Switch checked={isOnboarded} onCheckedChange={setIsOnboarded} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-9 rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || isSelfDemotion}
              className="h-9 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
