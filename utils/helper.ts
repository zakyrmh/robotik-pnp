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

/**
 * Extract OR Period dari registrationId
 * Format registrationId: "CAANG-OR 21-0012"
 * Output: "OR 21"
 * 
 * @param registrationId - Registration ID dengan format "CAANG-OR XX-XXXX"
 * @returns OR Period atau null jika format tidak valid
 */
export function extractOrPeriod(registrationId: string | undefined | null): string | null {
  if (!registrationId) return null;
  
  // Format: CAANG-OR 21-0012
  // Split by "-" dan ambil bagian ke-2 dan ke-3
  const parts = registrationId.split('-');
  
  if (parts.length >= 3) {
    // Gabungkan "OR" dan "21" menjadi "OR 21"
    return `${parts[1]} ${parts[2]}`;
  }
  
  return null;
}

/**
 * Hitung persentase kehadiran user
 * 
 * @param totalAttendances - Jumlah kehadiran user (PRESENT + LATE)
 * @param totalActivities - Total aktivitas yang tersedia
 * @returns Persentase kehadiran (0-100), atau 0 jika tidak ada aktivitas
 */
export function calculateAttendancePercentage(
  totalAttendances: number,
  totalActivities: number
): number {
  if (totalActivities === 0) return 0;
  
  const percentage = (totalAttendances / totalActivities) * 100;
  
  // Round to 1 decimal place
  return Math.round(percentage * 10) / 10;
}
