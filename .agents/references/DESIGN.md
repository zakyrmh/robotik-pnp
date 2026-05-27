## Overview

Sistem desain **Cyber-Industrial Fusion** adalah perpaduan antara presisi mekanis berkinerja tinggi (_high-performance_) dan keseriusan infrastruktur digital. Desain ini menggunakan struktur kanvas gelap berbasis **Deep Navy**, yang secara agresif bergantian (_polarity-switch_) dengan lembar data teknis berwarna **Putih Bersih** untuk memisahkan narasi branding dengan detail dokumentasi.

Brand energi dibangun melalui **fotografi robotika makro full-bleed** yang dikombinasikan dengan dua elemen visual ikonik: **Tricolor Tech Stripe** (Biru Elektrik → Navy → Merah) sebagai pembatas linier yang tegas, dan elemen **Monospace Caps** untuk menegaskan karakter rekayasa, kode, dan mesin.

### Karakteristik Utama:

- **Dual Canvas Polarity:** Halaman dibuka dengan komitmen penuh pada warna gelap (`{colors.canvas-dark}`), namun bertransisi secara dinamis ke kanvas terang (`{colors.canvas-light}`) pada area data-dense, tabel inventaris, dan dokumentasi.
- **The Typographic Joke:** Judul utama menggunakan font display geometris besar dalam format **UPPERCASE 700** yang masif dan kaku (suara mekanis), sementara label taktis, status, tombol, dan sub-header menggunakan **Monospace 500** (suara kode/terminal).
- **Structural Geometry:** Menolak sudut membulat (_rounded corners_) yang kekanak-kanakan. Kerangka luar, tombol utama, dan band foto menggunakan `{rounded.none}` (0px) untuk kesan kokoh, sedangkan kartu metrik data internal menggunakan `{rounded.sm}` (4px) untuk akurasi digital.

---

## 🎨 Colors

### Brand & Accent (The Tech Tricolor)

Komposisi warna menggunakan aturan **60-30-10** untuk menjaga keseimbangan visual instansi teknologi.

- **Primary Text/CTA** (`{colors.primary}` — `#ffffff` / `#000000`): Inversi penuh tergantung pada polaritas kanvas.
- **Cyber Blue** (`{colors.cyber-blue}` — `#0066b1`): Komponen utama tricolor, warna neon digital pelacak sensor dan pencahayaan sirkuit.
- **Tech Navy** (`{colors.tech-navy}` — `#1c69d4`): Warna transisi tengah; jangkar korporat yang menghubungkan elemen gelap dan terang.
- **Crimson Red** (`{colors.crimson-red}` — `#e22718`): Komponen tricolor ketiga. Digunakan _eksklusif_ sebagai indikator status kritis, aksen peringatan, tombol darurat, atau penegas batas komponen—**tidak pernah** digunakan sebagai latar belakang penuh (_fill_).

### Surface & Canvas

- **Canvas Dark** (`{colors.canvas-dark}` — `#0a0f24`): True Deep Navy. Digunakan sebagai lantai dasar halaman utama, hero section, dan modul riset.
- **Canvas Light** (`{colors.canvas-light}` — `#ffffff`): Putih murni. Digunakan untuk tabel harga, dokumentasi kode, dan manajemen inventaris.
- **Surface Card Dark** (`{colors.surface-card-dark}` — `#131a3a`): Satu tingkat lebih terang dari Canvas Dark, digunakan untuk memisahkan kartu komponen di dalam grid gelap.
- **Surface Soft Light** (`{colors.surface-soft-light}` — `#f5f7fa`): Latar belakang redup untuk baris tabel data atau track navigasi pasif pada mode terang.

### Hairlines & Borders

- **Hairline Dark** (`{colors.hairline-dark}` — `#222b54`): Garis pembatas 1px untuk elemen di atas permukaan gelap.
- **Hairline Light** (`{colors.hairline-light}` — `#e2e8f0`): Garis pembatas 1px untuk memisahkan baris data di atas permukaan terang.

---

## 📝 Typography

### Font Family

1. **Display Sans (Inter / BMW Type Next)**: Digunakan untuk narasi branding, judul halaman, dan paragraf deskriptif. Dicetak tebal (700) untuk judul masif dan sangat tipis (300) untuk teks berjalan (_body text_).
2. **Technical Monospace (JetBrains Mono / Neue Montreal Mono)**: Digunakan untuk seluruh label taktis, _eyebrow titles_, baris tabel, nomor antrean/metrik, dan label tombol. Selalu diset ke **UPPERCASE** dengan tracking renggang (+1.5px) untuk memberikan kesan "machined".

### Hierarchy Table

| Token                       | Size | Weight | Letter Spacing | Case / Style | Use Case                               |
| --------------------------- | ---- | ------ | -------------- | ------------ | -------------------------------------- |
| `{typography.display-xl}`   | 64px | 700    | 0              | UPPERCASE    | Hero Headline Utama                    |
| `{typography.display-lg}`   | 40px | 700    | -0.5px         | Sentence     | Judul Seksi Konten Utama               |
| `{typography.display-md}`   | 28px | 700    | 0              | UPPERCASE    | Nama Sub-Modul / Angka Telemetri       |
| `{typography.mono-eyebrow}` | 12px | 500    | 1.5px          | UPPERCASE    | _Label Kategori, Status, Header Tabel_ |
| `{typography.body-md}`      | 16px | 300    | 0              | Sentence     | Paragraf Deskripsi & Narasi            |
| `{typography.mono-button}`  | 14px | 500    | 1.5px          | UPPERCASE    | Teks di Dalam Tombol Aksi              |
| `{typography.caption}`      | 12px | 400    | 0.5px          | Sentence     | Keterangan Foto / Metadata Proyek      |

---

## 📐 Layout & Spacing

### Spacing Scale

- **Base Unit:** 4px
- **Tokens:** `{spacing.xs}`: 4px · `{spacing.sm}`: 8px · `{spacing.md}`: 16px · `{spacing.lg}`: 24px · `{spacing.xl}`: 40px · `{spacing.xxl}`: 64px · `{spacing.section}`: 80px.
- **Rhythm:** Jarak antar seksi (_marketing bands_) dikunci pada `{spacing.section}` (80px). Jarak internal komponen dalam kartu dikunci pada `{spacing.lg}` (24px).

### Grid System

- **Max Width Container:** 1320px berpusat di tengah layar.
- **Responsive Collapsing:** Grid 3-kolom (Desktop) → 2-kolom (Tablet) → 1-kolom penuh (Mobile). Khusus untuk tabel data manajemen, sistem mengaktifkan horizontal scroll pada breakpoint tablet ke bawah untuk mencegah pemotongan teks monospace.

---

## 💎 Shapes & Elevation

### Border Radius Scale

- **`{rounded.none}` (0px):** Digunakan untuk seluruh struktur luar, tombol aksi (`button-primary`), kontainer foto full-bleed, dan input teks utama. Merepresentasikan ketegasan industrial.
- **`{rounded.sm}` (4px):** Digunakan secara internal terbatas untuk kartu metrik performa, badge status kecil, dan terminal kode mock-up.

### Elevation Table

| Level              | Treatment                                                  | Use Case                                                           |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| **Level 0 (Flat)** | Tanpa bayangan, tanpa border                               | Komponen full-bleed band, footer robotik, seksi artikel            |
| **Level 1 (Line)** | 1px `{colors.hairline-dark}` / `{colors.hairline-light}`   | Kartu grid, baris tabel manajemen, segment kontrol                 |
| **Level 2 (Glow)** | `0 0 12px rgba(0, 102, 177, 0.2)` (Pendaran Biru Elektrik) | Efek interaksi aktif (_hover_) pada tombol atau kartu status robot |

---

## 🧩 Components

### Tombol & Navigasi

- **`button-primary-industrial`**
- **Struktur:** Kotak sempurna `{rounded.none}`, padding 14px × 28px.
- **Visual:** Latar belakang `{colors.primary}` (Hitam pada kanvas terang, Putih pada kanvas gelap), teks menggunakan `{typography.mono-button}` berlawanan warna.
- **Hover State:** Transisi instan (0s) menjadi latar belakang transparan dengan outline 1px tegas.

- **`nav-bar-polarity`**
- **Struktur:** Tinggi 64px, menempel di atas (_sticky_).
- **Visual:** Otomatis mengubah warna latar belakang mengikuti seksi kanvas di bawahnya (bertransisi dari Deep Navy ke Putih Murni). Menu menggunakan teks monospace kecil yang responsif berubah menjadi tombol burger minimalis di layar ponsel.

### Komponen Khas (Signature Components)

- **`tech-tricolor-divider`**
- **Deskripsi:** Garis pembatas linier setinggi 4px yang memuat transisi warna horizontal dari `{colors.cyber-blue}` → `{colors.tech-navy}` → `{colors.crimson-red}`. Digunakan secara hemat untuk memisahkan bagian header utama atau menandai area navigasi aktif.

- **`telemetry-data-card`**
- **Struktur:** Sudut sedikit melengkung `{rounded.sm}` (4px) untuk membedakannya dengan seksi layout makro.
- **Visual:** Latar belakang `{colors.surface-card-dark}`, memiliki baris header tipis berwarna monospace, menampilkan angka performa/logistik besar (`{typography.display-md}`), dan diakhiri dengan garis indikator status operasional di sudut kanan bawah.

---

## 🛑 Do's and Don'ts

### DO:

- Gunakan foto makro perangkat keras, komponen sirkuit, atau aksi robotik nyata dengan kontras tinggi untuk mengisi ruang kosong.
- Pertahankan kontras ekstrem antara judul utama (UPPERCASE tebal 700) dengan label pendukung (Monospace 500).
- Gunakan warna `{colors.crimson-red}` hanya sebagai aksen penarik perhatian (maksimal 10% dari total area visual halaman).

### DON'T:

- Jangan pernah menggunakan efek sudut membulat (_border-radius_) besar pada tombol utama atau container luar. Hal tersebut merusak citra presisi teknik instansi robotik.
- Jangan menggunakan bayangan (_drop-shadow_) lembut berwarna abu-abu ala aplikasi SaaS standar; gunakan batas garis (_hairline border_) atau pendaran neon tipis (_glow effect_).
- Jangan menulis teks paragraf panjang menggunakan font monospace; monospace hanya diizinkan untuk label, angka, data, dan teks tombol singkat.
