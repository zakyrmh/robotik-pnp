import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { UserWithCaang } from "@/types/caang";

type PaymentStatus = "not_paid" | "pending" | "verified";

interface StatusBadgeProps {
  value?: string | number | boolean;
}

interface PaymentStatusProps {
  user: UserWithCaang;
  onReviewClick: (user: UserWithCaang) => void;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== false;

  return hasValue ? (
    <Badge variant="outline" className="text-green-600 border-green-600">
      <CheckCircle className="w-3 h-3 mr-1" />
      Lengkap
    </Badge>
  ) : (
    <Badge variant="outline" className="text-red-600 border-red-600">
      <XCircle className="w-3 h-3 mr-1" />
      Kosong
    </Badge>
  );
}

export function PaymentStatus({ user, onReviewClick }: PaymentStatusProps) {
  const getPaymentStatus = (user: UserWithCaang): PaymentStatus => {
    const pembayaran = user.registration?.pembayaran;
    const verified = user.registration?.payment_verification;

    if (!pembayaran) return "not_paid";
    if (pembayaran && verified === undefined) return "pending";
    if (pembayaran && verified === false) return "pending";
    if (pembayaran && verified === true) return "verified";
    return "not_paid";
  };

  const status = getPaymentStatus(user);

  switch (status) {
    case "not_paid":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Belum Bayar
        </Badge>
      );
    case "pending":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReviewClick(user)}
          className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
        >
          <Clock className="w-3 h-3 mr-1" />
          Review
        </Button>
      );
    case "verified":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Terverifikasi
        </Badge>
      );
    default:
      return <span>-</span>;
  }
}
