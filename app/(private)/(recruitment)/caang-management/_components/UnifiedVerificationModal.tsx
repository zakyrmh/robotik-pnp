"use client";

import { useState, useEffect } from "react";
import { getFileUrl } from "@/lib/firebase/services/storage-service";
import { Timestamp } from "firebase/firestore";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { Gender } from "@/types/enum";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";

const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface UnifiedVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  registration: Registration | null | undefined;
  onVerify: (regId: string) => Promise<void>;
  onReject: (
    regId: string,
    type: "data" | "documents" | "payment",
    reason: string
  ) => Promise<void>;
  loading?: boolean;
}

export default function UnifiedVerificationModal({
  isOpen,
  onClose,
  user,
  registration,
  onVerify,
  onReject,
  loading = false,
}: UnifiedVerificationModalProps) {
  const [rejectType, setRejectType] = useState<
    "data" | "documents" | "payment" | null
  >(null);
  const [reason, setReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!user || !registration) return null;

  const handleOpenReject = () => {
    setIsRejectDialogOpen(true);
    setRejectType(null); // Reset selection
    setReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectType || !reason.trim()) return;
    await onReject(registration.id, rejectType, reason);
    setIsRejectDialogOpen(false);
    onClose();
  };

  const handleConfirmVerify = () => {
    setIsVerifyDialogOpen(true);
  };

  const executeVerify = async () => {
    await onVerify(registration.id);
    setIsVerifyDialogOpen(false);
    onClose();
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {user.profile.fullName}
              <Badge variant="outline" className="text-sm font-normal">
                {user.profile.nim}
              </Badge>
              {registration.status === "verified" ? (
                <Badge className="bg-green-600">Terverifikasi</Badge>
              ) : registration.status === "rejected" ? (
                <Badge variant="destructive">Ditolak</Badge>
              ) : (
                <Badge variant="secondary">Menunggu Verifikasi</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Verifikasi data pendaftaran Caang. Periksa Data Diri, Dokumen, dan
              Pembayaran.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="biodata" className="mt-4">
            <TabsList className="grid w-full h-auto grid-cols-3 gap-1">
              <TabsTrigger value="biodata" className="py-2">
                Data Diri
                {registration.verification?.rejectionReason && (
                  <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="berkas" className="py-2">
                Dokumen
                {registration.documents?.rejectionReason && (
                  <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="pembayaran" className="py-2">
                Pembayaran
                {registration.payment?.rejectionReason && (
                  <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BIODATA */}
            <TabsContent value="biodata" className="space-y-4 py-4">
              {registration.verification?.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4 text-sm">
                  <strong>Alasan Penolakan:</strong>{" "}
                  {registration.verification.rejectionReason}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Nama Lengkap" value={user.profile.fullName} />
                <InfoRow label="NIM" value={user.profile.nim} />
                <InfoRow label="Jurusan" value={user.profile.major} />
                <InfoRow label="Prodi" value={user.profile.department} />
                <InfoRow
                  label="Jenis Kelamin"
                  value={
                    user.profile.gender === Gender.MALE
                      ? "Laki-laki"
                      : "Perempuan"
                  }
                />
                <InfoRow
                  label="Tempat, Tgl Lahir"
                  value={`${user.profile.birthPlace}, ${formatDate(
                    user.profile.birthDate
                  )}`}
                />
                <InfoRow label="No. HP / WA" value={user.profile.phone} />
                <InfoRow
                  label="Alamat Domisili"
                  value={user.profile.address}
                  className="col-span-2"
                />

                <div className="col-span-2 mt-4">
                  <h4 className="font-semibold text-sm mb-2">
                    Motivasi & Pengalaman
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded text-sm">
                      <span className="font-bold block text-xs uppercase text-muted-foreground">
                        Motivasi
                      </span>
                      {registration.motivation || "-"}
                    </div>
                    <div className="bg-muted p-3 rounded text-sm">
                      <span className="font-bold block text-xs uppercase text-muted-foreground">
                        Pengalaman
                      </span>
                      {registration.experience || "-"}
                    </div>
                    <div className="bg-muted p-3 rounded text-sm">
                      <span className="font-bold block text-xs uppercase text-muted-foreground">
                        Prestasi
                      </span>
                      {registration.achievement || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: BERKAS */}
            <TabsContent value="berkas" className="space-y-6 py-4">
              {registration.documents?.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4 text-sm">
                  <strong>Alasan Penolakan Dokumen:</strong>{" "}
                  {registration.documents.rejectionReason}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pas Foto</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center h-64">
                    {registration.documents.photoUrl ? (
                      <FirebaseImage
                        path={registration.documents.photoUrl}
                        width={200}
                        height={200}
                        alt="Pas Foto"
                        className="h-full w-auto object-contain rounded"
                      />
                    ) : (
                      <p className="text-muted-foreground italic flex items-center">
                        Belum upload
                      </p>
                    )}
                  </CardContent>
                </Card>
                {
                  // Add other docs if needed (KTM, Follow proofs etc, currently usually lumped or separate)
                  // Based on registration type, looks like there are urls for IG, YT follow.
                }
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Bukti Follow/Subscribe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DocLink
                      label="KTM"
                      url={registration.documents.ktmUrl}
                      onPreview={handlePreview}
                    />
                    <DocLink
                      label="IG Robotik"
                      url={registration.documents.igRobotikFollowUrl}
                      onPreview={handlePreview}
                    />
                    <DocLink
                      label="IG MRC"
                      url={registration.documents.igMrcFollowUrl}
                      onPreview={handlePreview}
                    />
                    <DocLink
                      label="Youtube"
                      url={registration.documents.youtubeSubscribeUrl}
                      onPreview={handlePreview}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: PEMBAYARAN */}
            <TabsContent value="pembayaran" className="space-y-4 py-4">
              {registration.payment?.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4 text-sm">
                  <strong>Alasan Penolakan Pembayaran:</strong>{" "}
                  {registration.payment.rejectionReason}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <InfoRow
                    label="Metode Pembayaran"
                    value={registration.payment.method}
                  />
                  {registration.payment.bankName && (
                    <InfoRow
                      label="Bank"
                      value={registration.payment.bankName}
                    />
                  )}
                  {registration.payment.accountNumber && (
                    <InfoRow
                      label="No. Rekening"
                      value={registration.payment.accountNumber}
                    />
                  )}
                  {registration.payment.ewalletProvider && (
                    <InfoRow
                      label="E-Wallet"
                      value={registration.payment.ewalletProvider}
                    />
                  )}
                  <InfoRow
                    label="Atas Nama"
                    value={
                      registration.payment.accountName ||
                      registration.payment.ewalletNumber
                    }
                  />
                </div>
                <div className="bg-gray-100 dark:bg-muted/30 rounded h-64 flex items-center justify-center overflow-hidden border dark:border-border">
                  {registration.payment.proofUrl ? (
                    <FirebaseImage
                      path={registration.payment.proofUrl}
                      alt="Bukti Bayar"
                      className="h-full w-full object-contain"
                      width={400}
                      height={400}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Belum upload bukti bayar
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 border-t pt-4 flex justify-between sm:justify-between items-center bg-gray-50/50 dark:bg-muted/20 p-4 rounded-b-lg">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Tutup
            </Button>

            {/* Action Buttons available only if not already verified (or if you want to allow re-verify/change decision) */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleOpenReject}
                disabled={loading}
              >
                Tolak...
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmVerify}
                disabled={loading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Setujui & Verifikasi Semua
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran</DialogTitle>
            <DialogDescription>
              Pilih bagian yang tidak sesuai dan berikan alasan penolakan. Data
              akan dikembalikan ke peserta untuk diperbaiki.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bagian yang ditolak</Label>
              <Select
                value={rejectType || ""}
                onValueChange={(val) =>
                  setRejectType(val as "data" | "documents" | "payment")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bagian..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Data Diri & Profil</SelectItem>
                  <SelectItem value="documents">Dokumen Kelengkapan</SelectItem>
                  <SelectItem value="payment">Pembayaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alasan Penolakan</Label>
              <Textarea
                placeholder="Contoh: Foto tidak jelas, Nama tidak sesuai KTP, dll."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectType || !reason.trim()}
            >
              Konfirmasi Penolakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VERIFY CONFIRMATION DIALOG */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Verifikasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui seluruh data pendaftaran ini?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerifyDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={executeVerify}
              disabled={loading}
            >
              Ya, Setujui Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DOCUMENT PREVIEW DIALOG */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview Dokumen</DialogTitle>
          </DialogHeader>
          <div className="relative w-full flex-1 flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden border">
            {previewImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImage}
                alt="Document Preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-sm">{value || "-"}</span>
    </div>
  );
}

function DocLink({
  label,
  url,
  onPreview,
}: {
  label: string;
  url?: string;
  onPreview: (url: string) => void;
}) {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setHref(null);
      return;
    }

    if (url.startsWith("http") || url.startsWith("/")) {
      setHref(url);
      return;
    }

    // Resolve Firebase Storage path
    const resolveUrl = async () => {
      setLoading(true);
      try {
        const downloadUrl = await getFileUrl(url);
        if (downloadUrl) {
          setHref(downloadUrl);
        } else {
          setHref(null); // Treat empty string as failure
        }
      } catch (error) {
        console.error(`Failed to resolve URL for ${label}:`, error);
        setHref(null);
      } finally {
        setLoading(false);
      }
    };

    resolveUrl();
  }, [url, label]);

  if (!url)
    return <div className="text-sm text-muted-foreground">{label}: -</div>;

  return (
    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-muted/40 rounded border dark:border-border">
      <span className="text-sm font-medium">{label}</span>
      {loading ? (
        <span className="text-xs text-muted-foreground">Loading...</span>
      ) : href ? (
        <Button
          variant="link"
          className="text-blue-600 dark:text-blue-400 hover:no-underline p-0 h-auto text-sm"
          onClick={() => onPreview(href)}
        >
          Lihat
        </Button>
      ) : (
        <span className="text-xs text-red-500">Gagal memuat link</span>
      )}
    </div>
  );
}
