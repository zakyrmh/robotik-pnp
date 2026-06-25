# Dokumentasi Komponen Halaman Prestasi

Dokumen ini berisi arsitektur komponen, detail konten, dan spesifikasi interaksi/animasi untuk halaman **Prestasi**. Desain ini berfokus pada pengalaman pengguna (UX) yang interaktif dan konsisten dengan sistem transisi halaman utama.

---

## 1. Komponen Layout Utama (Hierarchy)

Halaman ini dibagi menjadi 4 komponen utama yang dibungkus oleh `PageWrapper` untuk memastikan animasi transisi masuk berjalan mulus:

```

[PageWrapper (Animasi Transisi Masuk)]
├── [HeroSection] -> Judul & Statistik Ringkas (Counter)
├── [FilterBar]   -> Navigasi Filter & Pencarian
├── [GridGrid]    -> Grid Grid untuk Kartu Prestasi
└── [CardPrestasi] -> Kartu Detail per Penghargaan

```

---

## 2. Detail Komponen & Spesifikasi Isi

### A. Komponen: `HeroSection`

Komponen paling atas untuk menarik perhatian pengunjung dan memberikan kesan pertama yang kuat.

- **Detail Isi / Teks:**
  - **Badge Atas:** `PRESTASI & PENGHARGAAN`
  - **Judul Utama (H1):** `Dedikasi, Inovasi, dan Kemenangan untuk Almamater`
  - **Sub-judul:** `Rekam jejak perjuangan, kreativitas, dan pencapaian teknologi terbaik dari para talenta muda robotik.`
- **Elemen Statistik Ringkas (Metrik):**
  Menampilkan pencapaian akumulatif dalam bentuk angka yang bergerak naik (Count-Up Animation):
  - _Metrik 1:_ `15+` Penghargaan Nasional
  - _Metrik 2:_ `3` Tahun Berturut-turut Juara KRI
  - _Metrik 3:_ `50+` Anggota Tim Berprestasi

### B. Komponen: `FilterBar`

Komponen interaktif untuk menyaring konten agar halaman tetap rapi dan mudah dinavigasi.

- **Fungsi Pencarian:** Input text box dengan ikon pencarian untuk mencari nama kompetisi atau nama anggota tim.
- **Tombol Filter Kategori (Tabs/Pills):**
  - `Semua` (Default)
  - `KRSBI-Beroda`
  - `KRI (Umum)`
  - `Gemastik / Programming`
  - `Lainnya`
- **Dropdown Filter Tahun:** Pilihan dropdown untuk menyaring prestasi berdasarkan tahun (Contoh: `2026`, `2025`, `2024`).

### C. Komponen: `CardPrestasi`

Komponen berulang (reusable card) yang menampilkan detail dari setiap penghargaan.

- **Visual (Image Container):**
  - Foto dokumentasi tim di podium atau robot saat berkompetisi.
  - _Hover effect:_ Foto sedikit membesar (Zoom-in halus) di dalam bingkainya.
- **Badge Status Kategori:** Label kecil di pojok kartu penanda divisi (misal: berwarna biru untuk `KRSBI-B`, ungu untuk `Gemastik`).
- **Informasi Teks:**
  - **Gelar Juara (H3):** Contoh: _Juara 1 Kontes Robot Sepak Bola Indonesia (KRI Wilayah I)_
  - **Penyelenggara & Tahun:** Contoh: _Puspresnas / Kemendikbudristek • 2026_
  - **Deskripsi Singkat:** Penjelasan 2 kalimat mengenai inovasi robot atau tantangan yang berhasil dilewati selama kompetisi.
- **Daftar Anggota Tim (Apresiasi):**
  - Grup avatar kecil atau daftar nama pendek mahasiswa yang berkontribusi di dalam tim tersebut (Contoh: _Tim GipzySpark: Member A, Member B, Member C_).

---

## 3. Spesifikasi Animasi (Berdasarkan Aturan Main Proyek)

Untuk memastikan halaman ini tidak kaku seperti halaman divisi sebelumnya, aturan animasi berikut wajib diterapkan menggunakan wrapper animasi global Anda:

1.  **Entrance Transition (`PageWrapper`):**
    Seluruh halaman bergeser sedikit dari bawah ke atas (`y: [20, 0]`) dan memudar masuk (`opacity: [0, 1]`) saat pertama kali dibuka.
2.  **Staggered Grid Load:**
    Ketika `CardPrestasi` dimuat, kartu pertama, kedua, dan seterusnya muncul dengan jeda waktu (_delay_) berurutan sebesar `0.1s`. Hal ini memberikan efek mengalir yang estetis.
3.  **Active State Feedback:**
    Saat tombol pada `FilterBar` diklik, kartu yang tidak sesuai kategori akan memudar keluar dengan halus (`exit animation`), dan kartu yang sesuai akan menyusun ulang posisinya secara dinamis.
