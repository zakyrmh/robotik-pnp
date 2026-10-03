/**
 * Helper pesan WhatsApp untuk undangan grup komunitas MRC.
 *
 * Menggantikan kebiasaan admin menyalin-menempel pesan manual: pesan undangan
 * sudah terisi lengkap (teks tetap) dan hanya link grup yang disubstitusi dari
 * `event_categories.whatsapp_group_url` per kategori.
 */

/** Teks undangan komunitas — PERSIS sesuai pesan resmi panitia MRC 2026. */
export const MRC_COMMUNITY_WA_TEMPLATE = `Halo Tim Peserta *Minangkabau Robot Contest 2026*! 👋

Terima kasih telah mendaftar di MRC X 2026. Untuk mempermudah koordinasi, penyampaian regulasi teknis, dan informasi lainnya, perwakilan/anggota tim diwajibkan bergabung ke grup komunitas WhatsApp sesuai divisi lomba yang didaftarkan.

Silakan klik tautan grup didalam komunitas sesuai kategori tim kamu:

{{groupUrl}}

📌 *Catatan:*

Pastikan hanya masuk ke grup kategori yang ditandingi agar koordinasi teknis berjalan efektif. Sampai jumpa di arena! 🔥

*Salam Inovasi,*

*Panitia MRC 2026*`;

export interface BuildCommunityWaUrlParams {
  /** Nomor WhatsApp kontak tim (boleh berawalan 0 atau 62). */
  teamWhatsapp: string;
  /** URL grup komunitas kategori dari `event_categories.whatsapp_group_url`. */
  groupUrl: string | null | undefined;
}

/**
 * Susun URL `wa.me` ke nomor tim dengan pesan undangan komunitas terisi.
 *
 * @returns URL siap pakai, atau `null` bila nomor tim atau link grup tidak
 *   tersedia (pemanggil sebaiknya menonaktifkan tombolnya).
 */
export function buildCommunityWaUrl({
  teamWhatsapp,
  groupUrl,
}: BuildCommunityWaUrlParams): string | null {
  const trimmedGroup = groupUrl?.trim();
  if (!trimmedGroup) return null;

  const digits = teamWhatsapp.replace(/[^0-9]/g, "");
  if (!digits) return null;

  const waNumber = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;

  const message = MRC_COMMUNITY_WA_TEMPLATE.replace(
    "{{groupUrl}}",
    trimmedGroup,
  );

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
