# Dokumentasi Komponen Halaman Keanggotaan / Struktur Organisasi

Dokumen ini berisi arsitektur komponen, bagan hierarki, dan spesifikasi visual untuk menampilkan seluruh pengurus dan anggota UKM Robotik Politeknik Negeri Padang. Desain ini mengedepankan kemudahan navigasi bertingkat (tree-structure) dan efek visual yang konsisten dengan halaman lainnya.

---

## 1. Komponen Layout Utama (Hierarchy)

Untuk menampilkan 35+ peran organisasi secara rapi tanpa membuat halaman terlalu panjang, halaman ini dibagi menjadi beberapa section utama yang dibungkus oleh `PageWrapper`:

```

[PageWrapper (Animasi Transisi Masuk)]
├── [HeroSection]          -> Judul & Filter Pencarian Anggota
├── [IntiPresidium]        -> Grid Pengurus Inti (Ketua, Wakil, Sekretaris, Bendahara)
├── [AdHocSection]         -> Kepanitiaan Khusus (Open Recruitment & Komisi Disiplin)
└── [DepartemenContainer]  -> Struktur 4 Departemen Utama beserta Bidang di bawahnya

```

---

## 2. Detail Komponen & Tata Letak Isi

### A. Komponen: `HeroSection`

- **Judul Utama (H1):** `Sinergi di Balik Inovasi: Pengurus & Anggota`
- **Sub-judul:** `Talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan roda organisasi, riset, dan pengembangan teknologi robotika.`
- **Fitur Pencarian Cepat:** Input bar untuk mencari nama anggota atau jabatan spesifik secara instan.

### B. Komponen: `IntiPresidium` (Pengurus Harian Inti)

Menampilkan jajaran pimpinan tertinggi organisasi menggunakan kartu visual berukuran besar (Prioritas Utama).

- **Struktur Baris 1 (Pimpinan):**
  - `Ketua Umum` (1 Orang)
  - `Wakil Ketua Umum 1` (1 Orang)
  - `Wakil Ketua Umum 2` (1 Orang)
- **Struktur Baris 2 (Administrasi & Keuangan):**
  - `Sekretaris 1` & `Sekretaris 2` (Masing-masing 1 orang)
  - `Bendahara 1` & `Bendahara 2` (Masing-masing 1 orang)

### C. Komponen: `AdHocSection` (Kepanitiaan & Pengawasan internal)

Ditempatkan dalam section khusus/accordion terpisah agar fokus utama struktur tetap terjaga.

- **Klaster Komisi Disiplin:** `Ketua Komisi Disiplin` (1 orang) dan `Anggota Komisi Disiplin` (Bisa banyak orang).
- **Klaster Open Recruitment:** `Ketua`, `Sekretaris`, `Bendahara`, dan Divisi `Acara` Open Recruitment (Masing-masing posisi 1 orang, kecuali Acara/Anggota jika multi-personel).

### D. Komponen: `DepartemenContainer` (Struktur Departemen & Bidang)

Menampilkan departemen menggunakan layout kartu bertingkat (Nested Card) atau sistem Tab untuk menunjukkan hubungan payung organisasi secara jelas.

#### 1. Departemen Kesekretariatan

- `Ketua Departemen Kesekretariatan` (1 Orang)
- `Wakil Departemen Kesekretariatan` (1 Orang)
- `Anggota Departemen Kesekretariatan` (Multi-orang / Grid list)

#### 2. Departemen Informasi dan Komunikasi (Infokom)

- `Koordinator Departemen Informasi dan Komunikasi` (1 Orang)
- `Wakil Koordinator Departemen Informasi dan Komunikasi` (1 Orang)
- **Sub-Bidang di Bawah Naungan Infokom:**
  - _Bidang Hubungan Masyarakat:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)
  - _Bidang Publikasi dan Dokumentasi:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)

#### 3. Departemen Penelitian dan Pengembangan (Litbang)

- `Koordinator Departemen Penelitian dan Pengembangan` (1 Orang)
- `Wakil Koordinator Departemen Penelitian dan Pengembangan` (1 Orang)
- **Sub-Bidang di Bawah Naungan Litbang:**
  - _Bidang Komisi Pemberdayaan SDM:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)
  - _Bidang Riset dan Teknologi:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)

#### 4. Departemen Mekanik Elektronika Lapangan

- `Koordinator Departemen Mekanik Elektronika Lapangan` (1 Orang)
- `Wakil Koordinator Departemen Mekanik Elektronika Lapangan` (1 Orang)
- **Sub-Bidang di Bawah Naungan Mekanik Elektronika Lapangan:**
  - _Bidang Maintenance:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)
  - _Bidang Produksi:_ `Ketua Bidang` (1 orang) + `Anggota Bidang` (Multi-orang)

---

## 3. Aturan Desain Komponen Kartu Anggota (`MemberCard`)

Setiap individu (baik ketua maupun anggota) akan direpresentasikan oleh satu komponen `MemberCard` yang seragam namun dibedakan berdasarkan tingkatannya:

1.  **Pembeda Visual Jabatan (Badge):**
    - Ketua/Koordinator: Memiliki outline kartu berwarna tegas (misal: emas atau biru siber) dengan badge `Ketua` / `Koordinator`.
    - Wakil: Memiliki badge `Wakil`.
    - Anggota: Desain minimalis bersih dengan badge `Anggota`.
2.  **Konten di Dalam Kartu:**
    - Foto Formal/Semi-formal Anggota (dengan fallback avatar inisial jika foto belum diunggah).
    - Nama Lengkap Anggota.
    - Nama Jabatan Spesifik (Contoh: _Anggota Bidang Publikasi dan Dokumentasi_).
    - _Optional:_ Tautan media sosial/LinkedIn kecil di bagian bawah kartu.

---

## 4. Aturan Animasi & Interaksi

- **Accordion / Dropdown Slide:** Mengingat banyaknya sub-bidang di bawah naungan departemen (seperti Infokom, Litbang, dan Mekanik), bagian bidang dapat dibuka-tutup (_collapsible_) dengan animasi slide ke bawah yang mulus agar menghemat ruang halaman.
- **Staggered Layout:** Saat sebuah departemen dipilih atau dibuka, kartu para anggotanya akan muncul secara berurutan (_staggered delay_ 0.05s per kartu) dari kiri ke kanan.
- **Hover Scale & Glow:** Ketika kursor diarahkan ke kartu pengurus, kartu akan terangkat sedikit ke atas dengan bayangan halus untuk memperkuat kesan interaktif.
