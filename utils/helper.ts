// 🔥 Styling dinamis berdasarkan status
import { Timestamp } from "firebase/firestore";

// Helper: konversi berbagai tipe tanggal ke objek Date
export function toJSDate(
  d: Timestamp | string | Date | null | undefined
): Date | null {
  if (!d) return null;

  if (d instanceof Timestamp) {
    return d.toDate();
  }

  if (typeof d === "string") {
    // Hapus karakter spasi non-breaking yang kadang muncul dari Firestore
    const cleaned = d.replace(/\u00A0|\u202F/g, " ");
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (d instanceof Date) {
    return d;
  }

  return null;
}

// Helper: cek apakah dua tanggal jatuh di hari yang sama
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
