/**
 * Domain rules & validation constants untuk Minangkabau Robot Contest (MRC).
 */

export const MRC_EVENT_DATE = "2026-10-31";
export const MRC_EVENT_DATE_LABEL = "31 Oktober 2026";
export const MRC_JUNIOR_MAX_AGE = 19;

/**
 * Menghitung usia (dalam tahun penuh) pada tanggal pelaksanaan event atau referensi tertentu.
 * Membandingkan komponen tanggal YYYY-MM-DD secara deterministik (kebal terhadap UTC/timezone offset).
 *
 * @param birthDateStr Tanggal lahir dalam format YYYY-MM-DD
 * @param referenceDateStr Tanggal patokan/event dalam format YYYY-MM-DD (default: MRC_EVENT_DATE)
 * @returns Usia dalam angka bulat atau null jika input tanggal tidak valid
 */
export function calculateAgeOnDate(
  birthDateStr: string | null | undefined,
  referenceDateStr: string = MRC_EVENT_DATE,
): number | null {
  if (!birthDateStr || typeof birthDateStr !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDateStr.trim());
  if (!match) return null;

  const bYear = parseInt(match[1], 10);
  const bMonth = parseInt(match[2], 10);
  const bDay = parseInt(match[3], 10);

  if (bYear < 1900 || bMonth < 1 || bMonth > 12 || bDay < 1 || bDay > 31) {
    return null;
  }

  const refMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(referenceDateStr.trim());
  if (!refMatch) return null;

  const rYear = parseInt(refMatch[1], 10);
  const rMonth = parseInt(refMatch[2], 10);
  const rDay = parseInt(refMatch[3], 10);

  let age = rYear - bYear;
  if (rMonth < bMonth || (rMonth === bMonth && rDay < bDay)) {
    age--;
  }

  return age;
}

export interface JuniorBirthDateValidationResult {
  valid: boolean;
  age?: number;
  error?: string;
}

/**
 * Validasi otoritatif syarat usia peserta kategori Line Follower Junior:
 * Wajib berumur maksimal 19 tahun pada saat event berlangsung (31 Oktober 2026).
 */
export function validateJuniorBirthDate(
  birthDateStr: string | null | undefined,
  options?: {
    eventDate?: string;
    eventDateLabel?: string;
    maxAge?: number;
  },
): JuniorBirthDateValidationResult {
  const eventDate = options?.eventDate ?? MRC_EVENT_DATE;
  const eventDateLabel = options?.eventDateLabel ?? MRC_EVENT_DATE_LABEL;
  const maxAge = options?.maxAge ?? MRC_JUNIOR_MAX_AGE;

  if (!birthDateStr || !birthDateStr.trim()) {
    return {
      valid: false,
      error: "Tanggal lahir wajib diisi untuk verifikasi syarat umur.",
    };
  }

  const age = calculateAgeOnDate(birthDateStr, eventDate);
  if (age === null) {
    return {
      valid: false,
      error: "Format tanggal lahir tidak valid (gunakan format YYYY-MM-DD).",
    };
  }

  if (age < 0) {
    return {
      valid: false,
      error: `Tanggal lahir tidak valid (melewati tanggal pelaksanaan event ${eventDateLabel}).`,
    };
  }

  if (age > maxAge) {
    return {
      valid: false,
      age,
      error: `Usia peserta (${age} tahun pada ${eventDateLabel}) melebihi batas maksimal ${maxAge} tahun untuk kategori Line Follower Junior.`,
    };
  }

  return {
    valid: true,
    age,
  };
}
