"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import Image from "next/image";

type UserData = {
  uid: string;
  email: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
  role: string; 
};

export default function PaymentModal({
  user,
  onClose,
  onUserUpdate
}: {
  user: UserData;
  onClose: () => void;
  onUserUpdate?: (updatedUser: UserData) => void;
}) {
  const [loading, setLoading] = useState<'verify' | 'reject' | null>(null);

  const handleVerify = async () => {
    if (!user.uid || loading) return;
    
    try {
      setLoading('verify');
      
      // Optimistic update - update UI immediately
      const updatedUser: UserData = {
        ...user,
        caang: {
          ...user.caang!,
          payment_verification: true
        }
      };
      
      // Update UI first
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // Then update database
      await updateDoc(doc(db, "caang_registration", user.uid), {
        payment_verification: true,
        payment_message: null
      });
      
      onClose();
    } catch (error) {
      console.error("Error verifying payment:", error);
      // Revert optimistic update on error
      if (onUserUpdate) {
        onUserUpdate(user);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleWrong = async () => {
    if (!user.uid || loading) return;
    
    try {
      setLoading('reject');
      
      // Optimistic update - update UI immediately
      const updatedUser: UserData = {
        ...user,
        caang: {
          ...user.caang!,
          payment_verification: false,
          pembayaran: undefined, // Remove payment proof
          payment_message: "⚠️ Bukti pembayaran tidak valid. Silakan upload ulang bukti pembayaran yang benar."
        }
      };
      
      // Update UI first
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // Then update database
      await updateDoc(doc(db, "caang_registration", user.uid), {
        payment_verification: false,
        pembayaran: null,
        payment_message: "⚠️ Bukti pembayaran tidak valid. Silakan upload ulang bukti pembayaran yang benar.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      // Revert optimistic update on error
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
          <Button 
            variant="destructive" 
            onClick={handleWrong} 
            className="w-1/2"
            disabled={loading !== null}
          >
            {loading === 'reject' ? (
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
            {loading === 'verify' ? (
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