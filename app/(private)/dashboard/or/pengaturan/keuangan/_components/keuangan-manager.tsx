"use client";

import { useState, useTransition } from "react";
import {
  Wallet,
  Landmark,
  Plus,
  Save,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  savePaymentAccounts,
  saveRegistrationFee,
  type OrBankAccount,
} from "@/app/actions/or-settings.action";

interface Props {
  initialAccounts: OrBankAccount[];
  initialFee: number;
}

export function KeuanganManager({ initialAccounts, initialFee }: Props) {
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<OrBankAccount[]>(initialAccounts);
  const [fee, setFee] = useState(initialFee);

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (acc: OrBankAccount) => {
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setAccountName(acc.account_name);
    setIsActive(acc.is_active);
    setEditingId(acc.id);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleSaveAccount = () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Harap isi semua kolom rekening.");
      return;
    }

    startTransition(async () => {
      const updated = editingId
        ? accounts.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  bank_name: bankName,
                  account_number: accountNumber,
                  account_name: accountName,
                  is_active: isActive,
                }
              : a,
          )
        : [
            ...accounts,
            {
              id: crypto.randomUUID(),
              bank_name: bankName,
              account_number: accountNumber,
              account_name: accountName,
              is_active: isActive,
            },
          ];

      const result = await savePaymentAccounts(updated);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setAccounts(updated);
      setIsFormOpen(false);
      resetForm();
      toast.success(
        editingId
          ? "Rekening berhasil diperbarui."
          : "Rekening berhasil ditambahkan.",
      );
    });
  };

  const handleDeleteAccount = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const updated = accounts.filter((a) => a.id !== deletingId);
      const result = await savePaymentAccounts(updated);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setAccounts(updated);
      setIsDeleteOpen(false);
      setDeletingId(null);
      toast.success("Rekening berhasil dihapus.");
    });
  };

  const handleToggleStatus = (id: string, newStatus: boolean) => {
    startTransition(async () => {
      const updated = accounts.map((a) =>
        a.id === id ? { ...a, is_active: newStatus } : a,
      );
      const result = await savePaymentAccounts(updated);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAccounts(updated);
    });
  };

  const handleSaveFee = () => {
    startTransition(async () => {
      const result = await saveRegistrationFee({ amount: fee });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Biaya pendaftaran berhasil diperbarui.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Biaya Pendaftaran */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Biaya Pendaftaran OR</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nominal biaya yang harus dibayar setiap calon anggota.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="grid gap-2 flex-1 w-full max-w-sm">
              <Label htmlFor="fee">Nominal (Rp)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button
              onClick={handleSaveFee}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Perbarui Biaya
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header daftar rekening */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Daftar Rekening
        </h2>
        <Button onClick={handleOpenAdd} className="cursor-pointer">
          <Plus className="mr-2 size-4" /> Tambah Rekening
        </Button>
      </div>

      {/* Daftar rekening */}
      {accounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Belum Ada Rekening</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Tambahkan rekening bank atau E-Wallet agar calon anggota dapat
            mentransfer biaya pendaftaran.
          </p>
          <Button
            onClick={handleOpenAdd}
            variant="outline"
            className="cursor-pointer"
          >
            <Plus className="mr-2 size-4" /> Tambah Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              className={`overflow-hidden transition-all ${!acc.is_active ? "opacity-75 grayscale-[0.3]" : ""}`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="size-4 text-primary" />
                  {acc.bank_name}
                </CardTitle>
                <div className="flex gap-1 items-center bg-muted/50 rounded-full px-2 py-1">
                  <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline-block mr-1">
                    Aktif
                  </span>
                  <Switch
                    checked={acc.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleStatus(acc.id, checked)
                    }
                    disabled={isPending}
                    className="data-[state=checked]:bg-emerald-500 h-4 w-7 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xl font-mono tracking-widest font-semibold">
                    {acc.account_number}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium uppercase truncate">
                    A/N: {acc.account_name}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDelete(acc.id)}
                    disabled={isPending}
                    className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(acc)}
                    disabled={isPending}
                    className="h-8 cursor-pointer"
                  >
                    <Pencil className="size-3 mr-2" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form Rekening */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Rekening" : "Tambah Rekening Baru"}
            </DialogTitle>
            <DialogDescription>
              Pastikan nomor rekening valid dan nama pemilik rekening tepat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nama Bank / E-Wallet</Label>
              <Input
                placeholder="Bank Nagari / BNI / DANA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nomor Rekening</Label>
              <Input
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Pemilik (A/N)</Label>
              <Input
                placeholder="UKM Robotik PNP"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-[10px] text-muted-foreground mr-4">
                  Hanya rekening aktif yang muncul di halaman pembayaran caang.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveAccount}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {editingId ? "Simpan Perubahan" : "Simpan Rekening"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Rekening?</AlertDialogTitle>
            <AlertDialogDescription>
              Rekening ini akan dihapus secara permanen. Calon anggota tidak
              akan bisa melihat nomor rekening ini lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isPending ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
