"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Wallet,
  Landmark,
  Plus,
  Save,
  Loader2,
  Trash2,
  Pencil,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getPaymentAccounts,
  savePaymentAccounts,
  getRegistrationFee,
  saveRegistrationFee,
  OrBankAccount,
} from "@/app/actions/or-settings.action";

export default function PengaturanKeuanganPage() {
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<OrBankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Form Fee
  const [registrationFee, setRegistrationFee] = useState(50000);
  const [isSavingFee, setIsSavingFee] = useState(false);

  useEffect(() => {
    Promise.all([getPaymentAccounts(), getRegistrationFee()]).then(
      ([accountsRes, feeRes]) => {
        setAccounts(accountsRes.data);
        setRegistrationFee(feeRes.data.amount);
        setIsLoading(false);
      },
    );
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const resetForm = () => {
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (acc: OrBankAccount) => {
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setAccountName(acc.account_name);
    setIsActive(acc.is_active);
    setEditingId(acc.id);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveAccount = () => {
    setFeedback(null);

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      showFeedback("error", "Harap isi semua kolom rekening.");
      return;
    }

    startTransition(async () => {
      let newAccounts = [...accounts];

      if (editingId) {
        newAccounts = newAccounts.map((a) =>
          a.id === editingId
            ? {
                ...a,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
                is_active: isActive,
              }
            : a,
        );
      } else {
        newAccounts.push({
          id: crypto.randomUUID(),
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          is_active: isActive,
        });
      }

      const { success, error } = await savePaymentAccounts(newAccounts);

      if (success) {
        setAccounts(newAccounts);
        setIsDialogOpen(false);
        resetForm();
        showFeedback(
          "success",
          editingId
            ? "Rekening berhasil diperbarui."
            : "Rekening berhasil ditambahkan.",
        );
      } else {
        showFeedback("error", error || "Gagal menyimpan rekening.");
      }
    });
  };

  const handleDeleteAccount = () => {
    if (!deletingId) return;

    startTransition(async () => {
      const newAccounts = accounts.filter((a) => a.id !== deletingId);
      const { success, error } = await savePaymentAccounts(newAccounts);

      if (success) {
        setAccounts(newAccounts);
        setIsDeleteDialogOpen(false);
        setDeletingId(null);
        showFeedback("success", "Rekening berhasil dihapus.");
      } else {
        showFeedback("error", error || "Gagal menghapus rekening.");
      }
    });
  };

  const handleToggleStatus = (id: string, newStatus: boolean) => {
    startTransition(async () => {
      const newAccounts = accounts.map((a) =>
        a.id === id ? { ...a, is_active: newStatus } : a,
      );
      const { success, error } = await savePaymentAccounts(newAccounts);

      if (success) {
        setAccounts(newAccounts);
      } else {
        showFeedback("error", error || "Gagal mengubah status rekening.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <Landmark className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Rekening</h1>
            <p className="text-sm text-muted-foreground">
              Kelola nomor rekening bank dan E-Wallet untuk pembayaran
              pendaftaran OR.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0 cursor-pointer">
          <Plus className="mr-2 size-4" /> Tambah Rekening
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          {feedback.type === "error" && (
            <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          )}
          {feedback.type === "success" && (
            <Save className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-semibold ${
                feedback.type === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {feedback.type === "success" ? "Berhasil" : "Gagal"}
            </p>
            <p
              className={`text-sm mt-0.5 ${
                feedback.type === "success"
                  ? "text-emerald-600/80"
                  : "text-red-600/80"
              }`}
            >
              {feedback.msg}
            </p>
          </div>
        </div>
      )}

      {/* Card Edit Biaya */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Biaya Pendaftaran OR</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tentukan nominal biaya yang harus dibayar oleh setiap calon anggota.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="grid gap-2 flex-1 w-full max-w-sm">
              <Label htmlFor="fee">Nominal (Rp)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button
              onClick={() => {
                setIsSavingFee(true);
                startTransition(async () => {
                  const { success, error } = await saveRegistrationFee({ amount: registrationFee });
                  setIsSavingFee(false);
                  if (success) showFeedback("success", "Biaya pendaftaran berhasil diperbarui.");
                  else showFeedback("error", error || "Gagal menyimpan biaya.");
                });
              }}
              disabled={isSavingFee}
              className="cursor-pointer"
            >
              {isSavingFee ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Perbarui Biaya
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Belum Ada Rekening</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Tambahkan informasi rekening bank atau E-Wallet agar calon anggota
            dapat mentransfer biaya pendaftaran.
          </p>
          <Button
            onClick={handleOpenAdd}
            variant="outline"
            className="cursor-pointer"
          >
            <Plus className="mr-2 size-4" /> Tambah Data Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              className={`overflow-hidden transition-all duration-200 ${!acc.is_active ? "opacity-75 grayscale-[0.3]" : ""}`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Landmark className="size-4 text-primary" /> {acc.bank_name}
                  </CardTitle>
                </div>
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
                  <p className="text-xl font-mono tracking-widest font-semibold text-foreground">
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
                    className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
                    <Pencil className="size-3 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form Rekening */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Rekening" : "Tambah Rekening Baru"}
            </DialogTitle>
            <DialogDescription>
              Pastikan nomor rekening valid dan penulisan nama pemilik rekening
              tepat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bank">Nama Bank / E-Wallet</Label>
              <Input
                id="bank"
                placeholder="Contoh: Bank Nagari / BNI / DANA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="number">Nomor Rekening</Label>
              <Input
                id="number"
                placeholder="Contoh: 0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Pemilik (A/N)</Label>
              <Input
                id="name"
                placeholder="Contoh: UKM Robotik PNP"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 mt-2 shadow-sm">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <div className="text-[10px] text-muted-foreground mr-4">
                  Hanya rekening aktif yang akan muncul di halaman pembayaran
                  Caang.
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="mt-2 sm:mt-0 cursor-pointer"
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Rekening?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus rekening ini secara permanen?
              Calon anggota tidak akan bisa lagi melihat nomor rekening ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              className="cursor-pointer"
            >
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
