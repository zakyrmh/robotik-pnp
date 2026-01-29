"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  CreditCard,
  Wallet,
  Banknote,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useRegistrationForm } from "./registration-form-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { cn } from "@/lib/utils";

// =========================================================
// SCHEMA
// =========================================================

const paymentSchema = z
  .object({
    method: z.enum(["transfer", "e_wallet", "cash"]),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    ewalletProvider: z.string().optional(),
    ewalletNumber: z.string().optional(),
    proofUrl: z.string().min(1, "Bukti pembayaran wajib diupload"),
  })
  .superRefine((data, ctx) => {
    if (data.method === "transfer") {
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama bank wajib diisi",
          path: ["bankName"],
        });
      }
    }
    if (data.method === "e_wallet") {
      if (!data.ewalletProvider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama e-wallet wajib diisi",
          path: ["ewalletProvider"],
        });
      }
    }
  });

type PaymentFormValues = z.infer<typeof paymentSchema>;

// =========================================================
// PAYMENT INFO (TODO: Get from settings)
// =========================================================

const PAYMENT_INFO = {
  amount: 50000,
  bank: {
    name: "Bank BRI",
    accountNumber: "0123456789012345",
    accountName: "UKM ROBOTIK PNP",
  },
  ewallet: {
    provider: "OVO/DANA/GoPay",
    number: "081234567890",
    name: "UKM ROBOTIK PNP",
  },
};

// =========================================================
// HELPER COMPONENTS
// =========================================================

interface PaymentMethodCardProps {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function PaymentMethodCard({
  selected,
  icon,
  label,
  description,
  onClick,
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-700 hover:border-primary/50",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            selected
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {selected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
      </div>
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );
}

// =========================================================
// COMPONENT
// =========================================================

export function StepPayment() {
  const { updatePayment, isSaving, setCurrentStep, registration } =
    useRegistrationForm();
  const { user } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<"compressing" | "uploading">(
    "compressing",
  );

  const userId = user?.uid || "";
  const period = registration?.orPeriod || "OR_xx";

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "transfer",
      bankName: "",
      accountNumber: "",
      accountName: "",
      ewalletProvider: "",
      ewalletNumber: "",
      proofUrl: "",
    },
  });

  const selectedMethod = form.watch("method");
  const proofUrl = form.watch("proofUrl");

  // Load existing payment data
  useEffect(() => {
    async function loadExistingPayment() {
      if (!user?.uid) return;

      setIsLoading(true);

      try {
        const regRef = doc(db, "registrations", user.uid);
        const regSnap = await getDoc(regRef);

        if (regSnap.exists()) {
          const regData = regSnap.data();
          const payment = regData.payment || {};

          form.setValue("method", payment.method || "transfer");
          form.setValue("bankName", payment.bankName || "");
          form.setValue("accountNumber", payment.accountNumber || "");
          form.setValue("accountName", payment.accountName || "");
          form.setValue("ewalletProvider", payment.ewalletProvider || "");
          form.setValue("ewalletNumber", payment.ewalletNumber || "");
          form.setValue("proofUrl", payment.proofUrl || "");
        }
      } catch (error) {
        console.error("Error loading payment:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingPayment();
  }, [user?.uid, form]);

  // Handle file upload with compression and storage service
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage("compressing");

    try {
      const { uploadRegistrationImage } =
        await import("@/lib/firebase/services/storage-service");

      // Upload using service (handles compression & delete old)
      const downloadUrl = await uploadRegistrationImage(
        file,
        "payment_proof",
        userId,
        period,
        proofUrl, // Pass old URL to delete
        (progress, stage) => {
          setUploadProgress(progress);
          setUploadStage(stage);
        },
      );

      form.setValue("proofUrl", downloadUrl);
    } catch (error) {
      console.error("Payment proof upload error:", error);
      // Optional: Show error toast
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      await updatePayment(data);
    } catch (error) {
      console.error("Error saving payment:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isUploading} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Mengupload Bukti Pembayaran</DialogTitle>
            <DialogDescription>
              {uploadStage === "compressing"
                ? "Sedang mengompresi gambar..."
                : `Sedang mengupload... ${Math.round(uploadProgress)}%`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{
                  width: `${uploadStage === "compressing" ? 10 : uploadProgress}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Mohon jangan tutup halaman ini.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Pembayaran Pendaftaran</CardTitle>
          <CardDescription>
            Lakukan pembayaran biaya pendaftaran dan upload bukti pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Payment Amount */}
              <Alert className="bg-primary/5 border-primary/20">
                <CreditCard className="h-4 w-4" />
                <AlertTitle>Biaya Pendaftaran</AlertTitle>
                <AlertDescription>
                  <span className="text-2xl font-bold text-primary">
                    Rp {PAYMENT_INFO.amount.toLocaleString("id-ID")}
                  </span>
                </AlertDescription>
              </Alert>

              {/* Payment Method Selection */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metode Pembayaran *</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      <PaymentMethodCard
                        selected={field.value === "transfer"}
                        icon={<Banknote className="w-5 h-5" />}
                        label="Transfer Bank"
                        description="BRI, BNI, Mandiri"
                        onClick={() => field.onChange("transfer")}
                      />
                      <PaymentMethodCard
                        selected={field.value === "e_wallet"}
                        icon={<Wallet className="w-5 h-5" />}
                        label="E-Wallet"
                        description="OVO, DANA, GoPay"
                        onClick={() => field.onChange("e_wallet")}
                      />
                      <PaymentMethodCard
                        selected={field.value === "cash"}
                        icon={<CreditCard className="w-5 h-5" />}
                        label="Tunai"
                        description="Bayar langsung"
                        onClick={() => field.onChange("cash")}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Details based on method */}
              {selectedMethod === "transfer" && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border space-y-4">
                  <h4 className="font-medium">Detail Transfer Bank</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Bank
                      </span>
                      <span className="font-medium">
                        {PAYMENT_INFO.bank.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        No. Rekening
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-medium">
                          {PAYMENT_INFO.bank.accountNumber}
                        </span>
                        <CopyButton text={PAYMENT_INFO.bank.accountNumber} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Atas Nama
                      </span>
                      <span className="font-medium">
                        {PAYMENT_INFO.bank.accountName}
                      </span>
                    </div>
                  </div>

                  {/* Bank Name Input */}
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Bank Pengirim *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: BRI, BNI, Mandiri"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {selectedMethod === "e_wallet" && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border space-y-4">
                  <h4 className="font-medium">Detail E-Wallet</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Provider
                      </span>
                      <span className="font-medium">
                        {PAYMENT_INFO.ewallet.provider}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Nomor
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-medium">
                          {PAYMENT_INFO.ewallet.number}
                        </span>
                        <CopyButton text={PAYMENT_INFO.ewallet.number} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Atas Nama
                      </span>
                      <span className="font-medium">
                        {PAYMENT_INFO.ewallet.name}
                      </span>
                    </div>
                  </div>

                  {/* E-Wallet Provider Input */}
                  <FormField
                    control={form.control}
                    name="ewalletProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama E-Wallet Pengirim *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: OVO, DANA, GoPay"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {selectedMethod === "cash" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pembayaran Tunai</AlertTitle>
                  <AlertDescription>
                    Untuk pembayaran tunai, silakan hubungi panitia OR terlebih
                    dahulu untuk mengatur jadwal dan lokasi pembayaran. Setelah
                    membayar, upload foto bukti penerimaan dari panitia.
                  </AlertDescription>
                </Alert>
              )}

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label>
                  Bukti Pembayaran <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload screenshot atau foto bukti pembayaran yang jelas
                </p>

                <div
                  className={cn(
                    "mt-2 p-4 rounded-xl border-2 border-dashed transition-all",
                    proofUrl
                      ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  {proofUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          Bukti pembayaran terupload
                        </span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofUrl}
                        alt="Bukti Pembayaran"
                        className="max-h-48 rounded-lg object-cover"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Ganti Bukti
                          </span>
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center py-6">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-medium">
                        {isUploading ? "Uploading..." : "Klik untuk upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG, atau WebP (maks. 5MB)
                      </p>
                    </label>
                  )}
                </div>
                {form.formState.errors.proofUrl && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.proofUrl.message}
                  </p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSaving}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>

                <Button type="submit" size="lg" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan & Lanjutkan
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
