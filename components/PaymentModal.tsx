"use client";

import { FormDataCaang } from "@/types/caang";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type UserData = {
  uid: string;
  email: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
};

export default function PaymentModal({
  user,
  onClose,
  onUpdated
}: {
  user: UserData;
  onClose: () => void;
  onUpdated?: () => Promise<void>;
}) {
  const handleVerify = async () => {
    if (!user.uid) return;
    await updateDoc(doc(db, "caang_registration", user.uid), {
      payment_verification: true,
    });
    onClose();
  };

  const handleWrong = async () => {
    if (!user.uid) return;
    await updateDoc(doc(db, "caang_registration", user.uid), {
      payment_verification: false,
      pembayaran: null,
      payment_message:
        "⚠️ Bukti pembayaran tidak valid. Silakan upload ulang bukti pembayaran yang benar.",
    });
    onClose();
    if (onUpdated) {
      await onUpdated();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          <DialogDescription>
            Periksa bukti pembayaran calon anggota{" "}
            <span className="font-semibold">{user.namaLengkap}</span>.
          </DialogDescription>
        </DialogHeader>

        {user.caang?.pembayaran ? (
          <div className="flex justify-center my-4">
            <Image
              src={user.caang.pembayaran}
              alt="Bukti pembayaran"
              width={200}
              height={200}
              className="rounded-md border"
            />
          </div>
        ) : (
          <p className="text-red-600">Bukti pembayaran tidak ditemukan.</p>
        )}

        <DialogFooter className="flex justify-between gap-2">
          <Button variant="destructive" onClick={handleWrong} className="w-1/2">
            Pembayaran Salah
          </Button>
          <Button onClick={handleVerify} className="w-1/2">
            Verify Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
