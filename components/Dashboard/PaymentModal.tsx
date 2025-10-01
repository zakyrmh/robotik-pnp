"use client";

import { useState } from "react";
import { UserWithCaang } from "@/types/caang";
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
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface PaymentModalProps {
  user: UserWithCaang;
  onClose: () => void;
  onUserUpdate?: (updatedUser: UserWithCaang) => void;
}

export default function PaymentModal({
  user,
  onClose,
  onUserUpdate,
}: PaymentModalProps) {
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);

  const handleVerify = async () => {
    if (!user.user?._id || loading) return;

    try {
      setLoading("verify");

      // Optimistic update
      const updatedUser: UserWithCaang = {
        ...user,
        registration: user.registration
          ? {
              ...user.registration,
              payment_verification: true,
              payment_message: undefined,
            }
          : undefined,
      };

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      // Update Firestore
      await updateDoc(doc(db, "caang_registration", user.user._id), {
        payment_verification: true,
        payment_message: null,
      });

      onClose();
    } catch (error) {
      console.error("Error verifying payment:", error);
      if (onUserUpdate) {
        onUserUpdate(user); // revert
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!user.user?._id || loading) return;

    try {
      setLoading("reject");

      const updatedUser: UserWithCaang = {
        ...user,
        registration: user.registration
          ? {
              ...user.registration,
              payment_verification: false,
              pembayaran: undefined,
              payment_message:
                "⚠️ Bukti pembayaran tidak valid. Silakan upload ulang bukti pembayaran yang benar.",
            }
          : undefined,
      };

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      await updateDoc(doc(db, "caang_registration", user.user._id), {
        payment_verification: false,
        pembayaran: null,
        payment_message:
          "⚠️ Bukti pembayaran tidak valid. Silakan upload ulang bukti pembayaran yang benar.",
      });

      onClose();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      if (onUserUpdate) {
        onUserUpdate(user);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          <DialogDescription>
            Periksa bukti pembayaran calon anggota{" "}
            <span className="font-semibold">
              {user.registration?.namaLengkap ?? "Tanpa Nama"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {user.registration?.pembayaran ? (
          <div className="flex justify-center my-4">
            <Image
              src={user.registration.pembayaran}
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
          <Button
            variant="destructive"
            onClick={handleReject}
            className="w-1/2"
            disabled={loading !== null}
          >
            {loading === "reject" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Pembayaran Salah"
            )}
          </Button>
          <Button
            onClick={handleVerify}
            className="w-1/2"
            disabled={loading !== null}
          >
            {loading === "verify" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Verify Pembayaran"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
