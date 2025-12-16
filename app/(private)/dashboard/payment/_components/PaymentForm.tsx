"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Registration } from "@/types/registrations";
import { submitStep3Payment } from "@/lib/firebase/services/registration-service";
import { storage } from "@/lib/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { PaymentMethod } from "@/types/enum";
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
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

    return new Promise((resolve, reject) => {
      const storageRef = ref(
        storage,
        `registrations/${user.uid}/payment/${Date.now()}_${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      updateStep(0, { status: "uploading", progress: 0 });

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          updateStep(0, { progress: Math.round(progress) });
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            updateStep(0, { status: "completed", progress: 100 });
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
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

    try {
      setShowProgressModal(true);

      let finalProofUrl = paymentData.proofUrl;

      // Step 1: Upload Logic
      if (selectedFile) {
        updateStep(0, { status: "uploading", progress: 0 });
        updateStep(1, { status: "pending", progress: 0 });

        finalProofUrl = await uploadProof(selectedFile);

        // Update local state purely for consistency (mostly redirect handles next)
        setPaymentData((prev) => ({ ...prev, proofUrl: finalProofUrl }));
      } else {
        // Skip upload step if reusing existing file
        updateStep(0, { status: "completed", progress: 100 });
      }

      // Step 2: Save Data
      updateStep(1, { status: "uploading", progress: 0 });

      await submitStep3Payment(user.uid, {
        method: paymentData.method,
        bankName: paymentData.bankName,
        accountNumber: paymentData.accountNumber,
        accountName: paymentData.accountName,
        ewalletProvider: paymentData.ewalletProvider,
        ewalletNumber: paymentData.ewalletNumber,
        proofUrl: finalProofUrl,
      });

      updateStep(1, { status: "completed", progress: 100 });

      toast.success("Pembayaran berhasil diunggah", {
        description: "Menunggu verifikasi dari admin",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error submitting payment:", error);
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
