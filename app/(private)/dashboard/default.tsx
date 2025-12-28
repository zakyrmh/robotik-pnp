/**
 * DEFAULT PAGE
 * PENTING: File ini diperlukan untuk Parallel Routes dalam Next.js.
 * Jika pengguna menavigasi ke rute di mana slot tidak dapat dirender
 * (atau saat hard refresh), Next.js akan mencari `default.tsx`.
 *
 * Untuk dashboard ini, kita ingin diam saja (return null) jika tidak ada match,
 * atau bisa juga merender fallback UI.
 */

export default function Default() {
  return null;
}
