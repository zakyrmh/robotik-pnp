"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Loading03Icon,
  FloppyDiskIcon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";

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
  const router = useRouter();
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
          router.refresh();
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
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <HugeiconsIcon icon={Edit02Icon} size={18} />
              </div>
              <div>
                <DialogTitle className="font-display text-base font-semibold tracking-tight text-foreground">
                  Edit Identitas &amp; Peran Pengguna
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Perbarui peranan sistem (RBAC) dan identitas dasar pengguna
                  ini.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-5 sm:p-6 overflow-y-auto flex-1 bg-background text-xs">
            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Alamat Email (Read-only)
              </Label>
              <Input
                value={user.email}
                disabled
                className="bg-muted/50 text-muted-foreground min-h-[44px] rounded-lg text-xs font-mono"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                className="min-h-[44px] rounded-lg text-sm"
                required
              />
            </div>

            {/* NIM & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  NIM
                </Label>
                <Input
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="210109..."
                  className="min-h-[44px] rounded-lg text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  No. WhatsApp
                </Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0812..."
                  className="min-h-[44px] rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            {/* Study Program */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Program Studi
              </Label>
              <Select
                value={studyProgramId}
                onValueChange={(val) => setStudyProgramId(val)}
              >
                <SelectTrigger className="min-h-[44px] rounded-lg text-xs">
                  <SelectValue placeholder="Pilih Program Studi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">
                    -- Tanpa Program Studi --
                  </SelectItem>
                  {studyPrograms.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.degree} - {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Peran Sistem (Role) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as UserRole)}
              >
                <SelectTrigger className="min-h-[44px] rounded-lg text-xs">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2.5">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={16}
                  className="shrink-0 mt-0.5"
                />
                <span>
                  <strong>Peringatan Keamanan:</strong> Anda sedang meninjau
                  akun Anda sendiri. Anda tidak dapat mencopot role Super Admin
                  dari akun yang sedang login.
                </span>
              </div>
            )}

            {/* Is Onboarded Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface/50 dark:bg-card">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-foreground">
                  Status Onboarding
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Tandai jika pengguna telah menyelesaikan alur pendaftaran
                  awal.
                </p>
              </div>
              <Switch checked={isOnboarded} onCheckedChange={setIsOnboarded} />
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-border bg-surface/40 dark:bg-card flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="min-h-[44px] rounded-lg text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || isSelfDemotion}
              className="min-h-[44px] rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5 shadow-xs"
            >
              {isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={15}
                    className="animate-spin"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={FloppyDiskIcon} size={15} />
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
