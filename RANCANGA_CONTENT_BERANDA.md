# Rancangan Konten Halaman Beranda (Public Page)

Dokumen ini memuat spesifikasi teks, hierarki komponen, dan struktur data untuk file `page.tsx` serta komponen-komponen turunannya.

---

## 1. Metadata & SEO

```typescript
export const metadata = {
  title: "UKM Robotik PNP — We Play with Technology",
  description:
    "Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang. Pusat riset, perancangan, dan fabrikasi robot kompetisi Kontes Robot Indonesia (KRI).",
  openGraph: {
    title: "UKM Robotik Politeknik Negeri Padang",
    description:
      "No Victory Without Sacrifice. Wadah pengembangan mekatronika, elektronika, dan sistem cerdas otonom.",
    url: "https://robotik-pnp.vercel.app/",
    siteName: "UKM Robotik PNP",
    locale: "id_ID",
    type: "website",
  },
};
```

---

## 2. Hero Section (`hero-section.tsx`)

- **Badge Identitas:** `Unit Kegiatan Mahasiswa • Politeknik Negeri Padang`

- **Judul Utama (H1):** `We Play with Technology.`

- **Sub-headline & Moto:**

  > _No Victory Without Sacrifice._

- **Deskripsi:**

  > Unit Kegiatan Mahasiswa di Politeknik Negeri Padang yang berfokus pada rekayasa mekatronika, sistem kendali, visi komputer, dan kecerdasan buatan melalui perancangan robot kompetisi tingkat regional dan nasional.

- **Aksi Utama (CTAs):**
- Tombol Primer: `Lihat Divisi Robot` $\rightarrow$ `/divisi`

- Tombol Sekunder: `Pendaftaran Anggota` $\rightarrow$ `/register`

- **Visual Anchor:** Foto asli unit robot tim (resolusi tinggi, rasio 16:9) atau diagram skematik CAD dengan garis batas tipis `border-border`.

---

## 3. Metrik & Rekam Jejak (`stats-section.tsx`)

Tampilkan dalam bentuk grid 4 kolom horizontal menggunakan `font-mono` dan `tabular-nums` untuk pembacaan presisi:

| Metrik             | Nilai Dinamis | Keterangan Label                     | Sumber Data Action |
| ------------------ | ------------- | ------------------------------------ | ------------------ |
| **Prestasi Resmi** | `40+`<br>     | Juara Tingkat Wilayah & Nasional KRI |

| `getAchievementCountAction()` |
| **Anggota Aktif** | `60+`<br> | Mahasiswa Lintas Jurusan Rekayasa

| `getActiveMemberCountAction()` |
| **Divisi Robot** | `5`<br> | Divisi Kompetisi Resmi Puspresnas

| `getDivisionCountAction()` |
| **Pengalaman Riset** | `21+ Tahun`<br> | Berdiri dan Berkompetisi Sejak 2005 | Kalkulasi `yearsStanding` |

---

## 4. Portofolio Divisi Robot (`divisions-section.tsx`)

**Header Section:**

- **Badge:** `DIVISI KOMPETISI`

- **Judul (H2):** `5 Divisi Robot Kontes Robot Indonesia (KRI)`

- **Deskripsi Singkat:** Setiap divisi berfokus pada spesialisasi rekayasa tertentu sesuai regulasi kompetisi tahunan Puspresnas Kemendikbudristek.

**Daftar Kartu Spesifikasi Divisi (Grid 2+3 atau Grid 3 dengan Closing Card):**

- **Divisi 01: KRAI (Kontes Robot ABU Indonesia)**

- **Kategori:** _Flagship / Mekatronika Daya_

- **Deskripsi:** Perancangan robot beroda dan berkaki untuk menyelesaikan misi bertempo tinggi pada arena ABU Robocon.

- **Fokus Rekayasa:** `Mekanisme Pelempar`, `Pneumatik`, `Kontrol Otomatis`, `Navigasi Lapangan`.

- **Tautan:** `/divisi/krai`

- **Divisi 02: KRSBI-B (Sepak Bola Robot Beroda)**

- **Kategori:** _Autonomous / Multi-Agent_
- **Deskripsi:** Robot beroda otonom yang bermain sepak bola secara terkoordinasi memanfaatkan visi komputer dan komunikasi nirkabel tim.

- **Fokus Rekayasa:** `Computer Vision`, `Omni-directional Drive`, `Algoritma Lokomosi`, `Koordinasi Tim`.

- **Tautan:** `/divisi/krsbi-b`

- **Divisi 03: KRSBI-H (Sepak Bola Robot Humanoid)**

- **Kategori:** _Humanoid / Bipedal_

- **Deskripsi:** Pengembangan robot berkaki dua dengan kendali kestabilan dinamis saat berjalan, menendang bola, dan mendeteksi objek.

- **Fokus Rekayasa:** `Bipedal Walking`, `Inverse Kinematics`, `Balance Control`, `Pengolahan Citra`.

- **Tautan:** `/divisi/krsbi-h`

- **Divisi 04: KRSTI (Kontes Robot Seni Tari Indonesia)**

- **Kategori:** _Humanoid / Art & Culture_
- **Deskripsi:** Robot humanoid yang menarikan tarian tradisional Indonesia dengan sinkronisasi musik dan akurasi gerakan multi-axis.

- **Fokus Rekayasa:** `Motion Planning`, `Sinkronisasi Audio`, `Kendali Servo Presisi`, `Kinematika Gerak`.

- **Tautan:** `/divisi/krsti`

- **Divisi 05: KRSRI (Kontes Robot SAR Indonesia)**

- **Kategori:** _Autonomous / Rescue_

- **Deskripsi:** Robot otonom penelusur medan labirin simulasi bencana untuk mencari korban dan memadamkan titik api.

- **Fokus Rekayasa:** `Sensor Fusion`, `Pemetaan Labirin (SLAM)`, `Deteksi Api & Korban`, `Navigasi Otonom`.

- **Tautan:** `/divisi/krsri`

---

## 5. Alur Kegiatan Tahunan (`timeline-section.tsx`)

**Header Section:**

- **Badge:** `SIKLUS KERJA`

- **Judul (H2):** `Alur Kerja Rekayasa & Kompetisi Tahunan`

- **Deskripsi:** Tahapan operasional anggota dari masa rekrutmen hingga kejuaraan nasional.

**Tahapan Alur (Vertical Stepper / Horizontal Milestone):**

1. **Tahap 01: Rekrutmen & Seleksi (September)**

- Pendaftaran terbuka untuk mahasiswa baru dan tingkat awal.

- Seleksi berkas, tes dasar logika pemrograman/elektronika, dan wawancara peminatan divisi.

2. **Tahap 02: Pelatihan Terpadu (Oktober – Desember)**

- Pelatihan intensif 3 bulan oleh anggota senior.

- Praktik perancangan skematik & PCB, coding mikrokontroler, dan fabrikasi mekanik.

3. **Tahap 03: Riset & Fabrikasi Prototipe (Januari – Maret)**

- Bedah regulasi resmi KRI tahun berjalan.

- Perakitan rangka mekanik, integrasi sensor daya, dan pemrograman strategi robot.

4. **Tahap 04: Kontes Robot Indonesia (April – Oktober)**

- Uji coba lapangan simulasi tanding.

- Pengiriman tim delegasi ke ajang KRI tingkat Wilayah 1 dan Nasional Kemendikbudristek.

5. **Tahap 05: Evaluasi & Alih Teknologi (November – Desember)**

- Penyusunan laporan performa teknis robot.

- Dokumentasi sistem, perbaikan modul prototipe, dan transfer ilmu ke calon generasi baru.

---

## 6. Call to Action Penutup (`cta-section.tsx`)

- **Latar Kontainer:** Card dengan latar `bg-card` dan border `border-border` (efek `backdrop-blur` halus).

- **Judul (H2):** `Bergabung Bersama UKM Robotik PNP`
- **Deskripsi:**

  > Wadah terbuka bagi mahasiswa Politeknik Negeri Padang yang bertekad mendalami perancangan mekanik, sistem elektronika, dan kecerdasan buatan. Siapkan diri untuk berkolaborasi dan berkompetisi di arena nasional.

- **Tombol Aksi:**
- Tombol Primer: `Daftar Anggota Baru` $\rightarrow$ `/register`
- Tombol Sekunder: `Hubungi Sekretariat` $\rightarrow$ `/hubungi-kami`

- **Informasi Kontak Cepat:**
- **Sekretariat:** Gedung P Lantai 2, Politeknik Negeri Padang, Limau Manis, Padang

- **Surel Resmi:** `infokomrobotikpnp2024@gmail.com`
