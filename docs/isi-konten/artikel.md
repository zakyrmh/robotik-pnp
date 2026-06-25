# Dokumentasi Komponen Halaman Artikel / Blog

Dokumen ini berisi arsitektur komponen, jenis konten, dan spesifikasi interaksi untuk halaman **Artikel**. Fokus utama halaman ini adalah keterbacaan yang tinggi (readability), navigasi yang intuitif, serta performa visual yang selaras dengan tema teknologi robotik.

---

## 1. Komponen Layout Utama (Hierarchy)

Halaman utama Artikel dibagi menjadi beberapa zona visual untuk membedakan tulisan terbaru/utama dengan tulisan arsip:

```

[PageWrapper (Animasi Transisi Masuk)]
├── [HeroFeatured]      -> Artikel Utama Terkini (Ukuran Besar/Sorotan)
├── [FilterCategory]    -> Pembagian Kategori & Kolom Pencarian
├── [ArticleGrid]       -> Grid untuk Daftar Artikel Umum
│      └── [ArticleCard] -> Kartu Artikel Reusable
└── [Pagination/Load]   -> Navigasi Halaman Selanjutnya

```

---

## 2. Detail Komponen & Spesifikasi Isi

### A. Komponen: `HeroFeatured` (Artikel Sorotan)

Ditempatkan di paling atas. Komponen ini menampilkan satu artikel paling penting atau terbaru (misalnya: rilis teknologi robot terbaru tim atau dokumentasi kemenangan kompetisi besar).

- **Detail Konten:**
  - **Foto Sampul Besar:** Gambar berkualitas tinggi dari dokumentasi kegiatan atau ilustrasi teknis.
  - **Meta Data:** Tanggal rilis, estimasi waktu membaca (contoh: `5 min read`), dan nama penulis.
  - **Judul Utama (H2):** Judul artikel yang bombastis dan menarik.
  - **Ringkasan (Excerpt):** Cuplikan paragraf pertama artikel (maksimal 2 baris) untuk memicu rasa penasaran pembaca.
  - **Tombol Aksi:** Tombol `Baca Selengkapnya` dengan ikon panah interaktif.

### B. Komponen: `FilterCategory`

Navigasi horizontal untuk mempermudah pembaca menyaring topik yang mereka minati.

- **Pilihan Kategori (Pills/Tabs):**
  - `Semua` (Default)
  - `Riset & Teknologi` (Konten seputar ROS 2, Arduino, ESP32, Computer Vision/YOLO, desain PCB, dll.)
  - `Kabar Robotik` (Berita internal organisasi, liputan open recruitment, kegiatan magang caang, dll.)
  - `Kompetisi` (Cerita perjalanan tim di KRI, Gemastik, atau turnamen lokal)
  - `Tutorial` (Panduan teknis langkah-demi-langkah untuk adik tingkat/caang)
- **Search Bar:** Kolom pencarian di sisi kanan untuk mencari artikel berdasarkan kata kunci atau judul.

### C. Komponen: `ArticleCard` (Kartu Artikel)

Komponen kartu yang berulang dalam format grid (3 kolom pada desktop, 1 kolom pada mobile).

- **Visual (Thumbnail):** Foto mini pendukung artikel dengan aspek rasio 16:9.
- **Kategori Badge:** Label kecil penanda kategori artikel (contoh: warna hijau untuk _Tutorial_, merah untuk _Kompetisi_).
- **Konten Teks:**
  - **Judul (H3):** Judul artikel (maksimal 2 baris, selebihnya terpotong otomatis/ellipse `...`).
  - **Snippet:** Teks pendek gambaran isi artikel.
- **Footer Kartu:** Nama penulis (disertai avatar kecil) dan tanggal terbit.

---

## 3. Rekomendasi Jenis & Contoh Isi Artikel

Agar halaman ini aktif dan kaya informasi, berikut adalah beberapa rekomendasi topik artikel yang sangat cocok untuk dimasukkan:

1.  **Kategori Riset & Teknologi:**
    - _Judul:_ "Mengenal Komunikasi Antar-Node pada ROS 2 untuk Robot Sepak Bola Beroda"
    - _Judul:_ "Optimasi Deteksi Bola Menggunakan YOLOv8 pada Edge Device"
2.  **Kategori Tutorial:**
    - _Judul:_ "Panduan Dasar Desain PCB Menggunakan KiCad untuk Pemula"
    - _Judul:_ "Cara Mengatur Konfigurasi Pin Header Driver BTS7960 2x4 pada Arduino"
3.  **Kategori Kabar Robotik / Kompetisi:**
    - _Judul:_ "Kilas Balik Perjuangan Tim GipzySpark di Ajang Nasional Gemastik"
    - _Judul:_ "Keseruan di Balik Layar Sistem Live Stream Open Tournament Robotik PNP 2026"

---

## 4. Aturan Animasi & Interaksi

- **Hover Glow Effect:** Saat kartu artikel dilewati kursor (`hover`), kartu akan naik sedikit (`y: -8`) dan bayangan gambar latar akan memberikan efek berpendar halus (_subtle glow_).
- **Smooth Image Loading:** Menggunakan efek _skeleton loading_ atau pemudar masuk (_fade-in animation_) saat gambar berukuran besar sedang dimuat agar tata letak halaman tidak melompat-lompat kaku.
- **Infinite Scroll atau Staggered Pagination:** Saat berpindah halaman artikel atau mengklik tombol "Muat Lebih Banyak", artikel baru akan muncul dari bawah dengan efek _staggered animation_ (muncul satu per satu secara berurutan) agar selaras dengan estetika halaman beranda dan profil.
