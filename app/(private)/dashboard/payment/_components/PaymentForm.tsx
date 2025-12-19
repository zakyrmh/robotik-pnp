"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  PaymentMethod,
  Registration,
  RegistrationStatus,
  PaymentData,
} from "@/types/registrations";
import { updateRegistration } from "@/lib/firebase/services/registration-service";
import { Timestamp } from "firebase/firestore";
import {
  uploadFileWithProgress,
  deleteFile,
  getFileUrl,
} from "@/lib/firebase/services/storage-service";
import UploadProgressModal from "../../upload-documents/_components/UploadProgressModal";
import PaymentInstructions from "./PaymentInstructions";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentDetailsForm from "./PaymentDetailsForm";
import PaymentProofUpload from "./PaymentProofUpload";

interface PaymentFormProps {
  user: FirebaseUser | null;
  registration: Registration | null;
}

export default function PaymentForm({ user, registration }: PaymentFormProps) {
  const router = useRouter();

  // State for Local File & Preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    registration?.payment?.proofUrl || null
  );

  // State for Progress Modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<
    {
      label: string;
      progress: number;
      status: "pending" | "uploading" | "completed";
    }[]
  >([
    {
      label: "Mengunggah Bukti Pembayaran",
      progress: 0,
      status: "pending",
    },
    {
      label: "Verifikasi & Simpan Data",
      progress: 0,
      status: "pending",
    },
  ]);

  const [paymentData, setPaymentData] = useState({
    method: registration?.payment?.method || PaymentMethod.TRANSFER,
    bankName: registration?.payment?.bankName || "",
    accountNumber: registration?.payment?.accountNumber || "",
    accountName: registration?.payment?.accountName || "",
    ewalletProvider: registration?.payment?.ewalletProvider || "",
    ewalletNumber: registration?.payment?.ewalletNumber || "",
    proofUrl: registration?.payment?.proofUrl || "",
  });

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        // Only revoke blob URLs created locally, not firebase storage paths that haven't been resolved yet?
        // Actually blob urls start with blob:
        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    };
  }, [previewUrl]);

  // Resolve preview URL if it's a storage path
  useEffect(() => {
    const resolveUrl = async () => {
      if (
        registration?.payment?.proofUrl &&
        !registration.payment.proofUrl.startsWith("http") &&
        !registration.payment.proofUrl.startsWith("blob:")
      ) {
        const url = await getFileUrl(registration.payment.proofUrl);
        if (url) setPreviewUrl(url);
      }
    };
    resolveUrl();
  }, [registration?.payment?.proofUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleClearPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPaymentData((prev) => ({ ...prev, proofUrl: "" }));
  };

  const updateStep = (
    index: number,
    updates: Partial<(typeof uploadSteps)[0]>
  ) => {
    setUploadSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const uploadProof = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not found");

    const storagePath = `registrations/${user.uid}/payment/${Date.now()}_${
      file.name
    }`;

    updateStep(0, { status: "uploading", progress: 0 });

    try {
      const result = await uploadFileWithProgress(
        storagePath,
        file,
        (progress) => {
          updateStep(0, { progress });
        }
      );
      updateStep(0, { status: "completed", progress: 100 });
      return result.path;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!selectedFile && !paymentData.proofUrl) {
      toast.error("Mohon unggah bukti pembayaran");
      return;
    }

    if (paymentData.method === PaymentMethod.TRANSFER) {
      if (
        !paymentData.bankName ||
        !paymentData.accountNumber ||
        !paymentData.accountName
      ) {
        toast.error("Mohon lengkapi detail bank");
        return;
      }
    } else if (paymentData.method === PaymentMethod.E_WALLET) {
      if (!paymentData.ewalletProvider || !paymentData.ewalletNumber) {
        toast.error("Mohon lengkapi detail e-wallet");
        return;
      }
    }

    // Tracking for transaction simulation
    let newUploadedUrl: string | null = null;
    const oldProofUrl = registration?.payment?.proofUrl;

    try {
      setShowProgressModal(true);

      let finalProofUrl = paymentData.proofUrl;

      // Step 1: Upload Logic
      if (selectedFile) {
        updateStep(0, { status: "uploading", progress: 0 });
        updateStep(1, { status: "pending", progress: 0 });

        // Note: uploadProof returns the Download URL
        finalProofUrl = await uploadProof(selectedFile);
        newUploadedUrl = finalProofUrl;

        // Update local state
        setPaymentData((prev) => ({ ...prev, proofUrl: finalProofUrl }));
      } else {
        // Skip upload step if reusing existing file
        updateStep(0, { status: "completed", progress: 100 });
      }

      // Step 2: Save Data (Firestore Transaction Point)
      updateStep(1, { status: "uploading", progress: 0 });

      const paymentUpdate: PaymentData = {
        method: paymentData.method,
        proofUrl: finalProofUrl,
        proofUploadedAt: Timestamp.now(),
        verified: false,
      };

      if (paymentData.method === PaymentMethod.TRANSFER) {
        paymentUpdate.bankName = paymentData.bankName;
        paymentUpdate.accountNumber = paymentData.accountNumber;
        paymentUpdate.accountName = paymentData.accountName;
      } else if (paymentData.method === PaymentMethod.E_WALLET) {
        paymentUpdate.ewalletProvider = paymentData.ewalletProvider;
        paymentUpdate.ewalletNumber = paymentData.ewalletNumber;
      }

      await updateRegistration(user.uid, {
        payment: paymentUpdate,
        status: RegistrationStatus.PAYMENT_PENDING,
      });

      updateStep(1, { status: "completed", progress: 100 });

      // Step 3: Success Compensation (Delete OLD file)
      // Only delete if we uploaded a NEW file and there was an OLD one
      if (newUploadedUrl && oldProofUrl && newUploadedUrl !== oldProofUrl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteFile(oldProofUrl).catch((err: any) =>
          console.warn("Failed to delete old payment proof:", err)
        );
      }

      toast.success("Pembayaran berhasil diunggah", {
        description: "Menunggu verifikasi dari admin",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error submitting payment (Rolling back):", error);

      // Step 4: Failure Compensation (Rollback - Delete NEW file)
      if (newUploadedUrl) {
        toast.info("Membatalkan upload...", { duration: 2000 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await deleteFile(newUploadedUrl).catch((cleanupErr: any) =>
          console.error(
            "Critical: Failed to rollback payment proof:",
            cleanupErr
          )
        );
      }

      toast.error("Gagal memproses pembayaran");
      setShowProgressModal(false);
    }
  };

  return (
    <>
      <UploadProgressModal
        isOpen={showProgressModal}
        uploadSteps={uploadSteps}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Instructions */}
        <PaymentInstructions />

        {/* Payment Method Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg text-gray-900 mb-4 dark:text-white">
            Metode Pembayaran
          </h3>

          <PaymentMethodSelector
            currentMethod={paymentData.method}
            onMethodChange={(method) =>
              setPaymentData((prev) => ({ ...prev, method }))
            }
          />

          <PaymentDetailsForm
            method={paymentData.method}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
          />
        </div>

        {/* Payment Proof Upload */}
        <PaymentProofUpload
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onClearPreview={handleClearPreview}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard">
            <Button variant="outline" type="button">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={showProgressModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Bukti Pembayaran
          </Button>
        </div>
      </form>
    </>
  );
}
