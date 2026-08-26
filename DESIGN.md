# UKM Robotik PNP — Design System & Style Guide

> **Sistem Desain Tunggal (Single Source of Truth)** untuk Halaman Publik dan Sistem Informasi Manajemen (SIM) UKM Robotika Politeknik Negeri Padang.
> Mengusung konsep **Clean Institutional Engineering** yang lapang, terstruktur, berbasis token semantik shadcn/ui, dan mendukung transisi Light/Dark Mode yang ergonomis.

## Daftar Isi

- [1. Prinsip Desain](#1-prinsip-desain)
- [2. Brand Identity](#2-brand-identity)
- [3. Warna (Color Palette)](#3-warna-color-palette)
- [4. Tipografi](#4-tipografi)
- [5. Layout & Grid](#5-layout--grid)
- [6. Spacing System](#6-spacing-system)
- [7. Border Radius & Shadow](#7-border-radius--shadow)
- [8. Komponen UI](#8-komponen-ui)
- [9. Ikon & Ilustrasi](#9-ikon--ilustrasi)
- [10. Gambar & Media](#10-gambar--media)
- [11. Motion & Animasi](#11-motion--animasi)
- [12. Responsive & Breakpoints](#12-responsive--breakpoints)
- [13. Aksesibilitas (a11y)](#13-aksesibilitas-a11y)
- [14. Voice & Tone (Microcopy)](#14-voice--tone-microcopy)
- [15. Penamaan File & Struktur Aset](#15-penamaan-file--struktur-aset)
- [16. Do's & Don'ts](#16-dos--donts)
- [17. Referensi & Tools](#17-referensi--tools)

---

## 1. Prinsip Desain

1. **Clean Institutional Engineering** — Tampilan memancarkan wibawa institusi riset teknologi: antarmuka lapang (_generous whitespace_), tata letak simetris, terstruktur rapi, dan bebas dari ornamen dekoratif yang tidak fungsional.
2. **Content & Data-First** — Hirarki visual dirancang untuk menonjolkan informasi divisi, dokumentasi riset, rekam jejak prestasi, dan data operasional anggota secara cepat dan jelas.
3. **Harmoni Warna 70-20-10** — 70% latar netral/kanvas, 20% elemen struktural identitas (Navy Soft), dan 10% aksen penarik perhatian (Orange PNP).
4. **Ergonomic Dual-Mode** — Light Mode dirancang bersih untuk dokumen publik, sedangkan Dark Mode mengadopsi _Deep Navy Slate_ (`#0f1b2d`) yang nyaman untuk penggunaan jangka panjang oleh pengembang/operator.
5. **Accessible & Semantic by Default** — Mematuhi standar WCAG 2.2 AA melalui kontras teruji, navigasi keyboard penuh, dan konsistensi token komponen antarmuka.

---

## 2. Brand Identity

| Atribut                      | Deskripsi                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Nama Produk / Organisasi** | UKM Robotik Politeknik Negeri Padang (Portal Publik & SIM)                                                                 |
| **Slogan & Motto**           | _"Mesin. Logika. Juara."_ • Slogan: _"We Play with Technology"_ • Motto: _"No Victory Without Sacrifice"_                  |
| **Kepribadian Brand**        | Akademis, Presisi, Berorientasi Prestasi, Inovatif, Terstruktur                                                            |
| **Target Audiens**           | Mahasiswa PNP, Calon Anggota, Juri/Penyelenggara Kompetisi (KRI/KRAI/KRSBI/KRSTI/KRSRI), Mitra Industri, Sivitas Akademika |
| **Logo & Lambang**           | Logo resmi UKM Robotik PNP (format SVG / High-res WebP dengan background transparan)                                       |

---

## 3. Warna (Color Palette)

Sistem warna menggunakan token semantik yang kompatibel dengan **Tailwind CSS v4** dan **shadcn/ui**, sehingga secara otomatis beradaptasi saat berganti tema.

### 3.1 Warna Utama (Brand Colors)

| Token                   | CSS Variable (Light)  | CSS Variable (Dark)        | Peran & Penggunaan                               |
| ----------------------- | --------------------- | -------------------------- | ------------------------------------------------ |
| `--color-primary`       | `#3b5b84` (Navy Soft) | `#f0975a` (Orange Soft)    | Warna brand utama, CTA primer, tombol aksi utama |
| `--color-primary-hover` | `#2f4a6d`             | `#e2853f`                  | State hover/active untuk tombol utama            |
| `--color-primary-soft`  | `#eaf1f8`             | `rgba(240, 151, 90, 0.15)` | Latar badge identitas, hover list item           |
| `--color-accent-strong` | `#f0975a`             | `#f0975a`                  | Aksen sekunder penanda highlight & kompetisi     |

### 3.2 Warna Netral (Neutrals)

| Token                                       | CSS Variable (Light) | CSS Variable (Dark)        | Peran & Penggunaan                             |
| ------------------------------------------- | -------------------- | -------------------------- | ---------------------------------------------- |
| `--color-background` (`--color-canvas`)     | `#ffffff`            | `#0f1b2d`                  | Latar belakang utama halaman                   |
| `--color-card`                              | `#ffffff`            | `#16233b`                  | Latar kontainer kartu, modul, dan dialog       |
| `--color-secondary` (`--color-surface`)     | `#f8fafc`            | `#1e293b`                  | Latar panel sekunder, zebra-stripe tabel       |
| `--color-border`                            | `#e5e7eb`            | `rgba(255, 255, 255, 0.1)` | Garis batas 1px untuk card dan divider         |
| `--color-text-primary` (`--foreground`)     | `#1f2937`            | `#f1f5f9`                  | Teks heading, judul card, angka metrik utama   |
| `--color-text-secondary`                    | `#374151`            | `#cbd5e1`                  | Paragraf deskripsi, body copy, sub-label       |
| `--color-text-muted` (`--muted-foreground`) | `#6b7280`            | `#94a3b8`                  | Metadata, caption tanggal, placeholder, footer |

### 3.3 Warna Semantik (Status & Feedback)

| Status                  | Token / Hex (Light)         | Token / Hex (Dark)                            | Penggunaan                                     |
| ----------------------- | --------------------------- | --------------------------------------------- | ---------------------------------------------- |
| **Success**             | `#16a34a` (Soft: `#dcfce7`) | `#4ade80` (Soft: `rgba(74, 222, 128, 0.15)`)  | Lolos seleksi, robot operasional, berkas valid |
| **Warning / Pending**   | `#d97706` (Soft: `#fef3c7`) | `#fbbf24` (Soft: `rgba(251, 191, 36, 0.15)`)  | Tahap review, jadwal uji coba, verifikasi      |
| **Destructive / Error** | `#ef4444` (Soft: `#fee2e2`) | `#f87171` (Soft: `rgba(248, 113, 113, 0.15)`) | Gagal, robot offline, aksi hapus permanen      |
| **Info**                | `#0284c7` (Soft: `#e0f2fe`) | `#38bdf8` (Soft: `rgba(56, 189, 248, 0.15)`)  | Pengumuman teknis, regulasi kompetisi          |

### 3.4 Mode Gelap (Dark Mode Mapping Strategy)

Pada mode gelap, warna latar belakang menggunakan **Deep Navy Slate** (`#0f1b2d`) dan Card menggunakan `#16233b`. Aksen Oranye (`#f0975a`) dialihkan sebagai warna interaksi primer agar mempertahankan rasio kontras tinggi di atas latar gelap tanpa menyilaukan mata pengguna.

---

## 4. Tipografi

Sistem tipografi membatasi hanya **2 font utama** ditambah font monospace sistem untuk efisiensi beban aset dan kejelasan visual.

### 4.1 Font Family

| Peran                  | Font Family         | Fallback Stack                                 | Penggunaan                                         |
| ---------------------- | ------------------- | ---------------------------------------------- | -------------------------------------------------- |
| **Display / Heading**  | `Plus Jakarta Sans` | `Inter, ui-sans-serif, system-ui, sans-serif`  | Heading halaman (H1–H4), angka metrik              |
| **Body / Interface**   | `Inter`             | `ui-sans-serif, system-ui, sans-serif`         | Paragraf, form input, tombol, navigasi             |
| **Monospace (Teknis)** | `ui-monospace`      | `"SFMono-Regular", Menlo, Consolas, monospace` | ID Divisi (`DIV-01`), skor pertandingan, telemetry |

### 4.2 Type Scale (Mobile-First dengan `clamp()`)

| Token          | Nilai (clamp / rem)                          | Resolusi Relatif | Weight    | Line Height | Penggunaan                              |
| -------------- | -------------------------------------------- | ---------------- | --------- | ----------- | --------------------------------------- |
| `--text-micro` | `0.6875rem`                                  | 11px             | 600       | 1.3         | Badge status uppercase, tag spec        |
| `--text-sm`    | `0.8125rem`                                  | 13px             | 400 / 500 | 1.4         | Caption, teks bantu form, tabel subtext |
| `--text-base`  | `clamp(0.875rem, 0.8rem + 0.2vw, 0.9375rem)` | 14px – 15px      | 400       | 1.65        | Body copy utama, isi card deskripsi     |
| `--text-md`    | `clamp(1rem, 0.9rem + 0.4vw, 1.125rem)`      | 16px – 18px      | 500 / 600 | 1.4         | Subheading kecil, H4, judul kartu       |
| `--text-lg`    | `clamp(1.125rem, 1rem + 0.6vw, 1.375rem)`    | 18px – 22px      | 600       | 1.35        | Judul section sub-kategori, H3          |
| `--text-xl`    | `clamp(1.375rem, 1.1rem + 1vw, 1.75rem)`     | 22px – 28px      | 600       | 1.25        | Judul section utama, H2                 |
| `--text-2xl`   | `clamp(1.625rem, 1.2rem + 1.6vw, 2.125rem)`  | 26px – 34px      | 700       | 1.15        | Hero main title, H1                     |

### 4.3 Aturan Penulisan

- **Heading (H1, H2, H3):** Gunakan Title Case / Sentence case yang tegas. Wajib mengaktifkan `text-wrap: balance` dan `letter-spacing: -0.02em` untuk mencegah _orphan word_.
- **Tombol & Aksi:** Gunakan Sentence case (contoh: _"Jelajahi Divisi"_, _"Kirim Berkas"_).
- **Maksimal Karakter Paragraf:** Batasi panjang baris body text antara **60–75 karakter** (`max-w-prose` atau `max-w-2xl`) agar nyaman dibaca.

---

## 5. Layout & Grid

| Parameter                         | Nilai Desktop (`lg:` / `xl:`)                  | Nilai Mobile / Tablet (`sm:` / `md:`)    |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| **Max Container Width**           | `max-w-6xl` (1152px) atau `max-w-7xl` (1280px) | `100%` dengan padding horizontal         |
| **Container Padding Horizontal**  | `px-8` (32px)                                  | `px-4` (16px) hingga `px-6` (24px)       |
| **Hero Section Padding Vertical** | `pt-32 pb-24` (128px / 96px)                   | `pt-20 pb-16` (80px / 64px)              |
| **Standard Section Padding**      | `py-24` (96px)                                 | `py-16` (64px)                           |
| **Compact Section Padding**       | `py-16` (64px)                                 | `py-12` (48px)                           |
| **Grid Kolom Divisi & Prestasi**  | 3 Kolom (`grid-cols-3`, `gap-8`)               | 1 Kolom mobile, 2 Kolom tablet (`gap-6`) |

---

## 6. Spacing System

Sistem spasi berbasis kelipatan **4px** untuk menjamin konsistensi ritme vertikal dan horizontal.

| Token Tailwind                 | Ukuran Pixel | Contoh Penggunaan                                   |
| ------------------------------ | ------------ | --------------------------------------------------- |
| `space-1` (`gap-1`, `p-1`)     | 4px          | Jarak mikro antara ikon dan teks kecil              |
| `space-2` (`gap-2`, `p-2`)     | 8px          | Padding badge, gap horizontal elemen form rapat     |
| `space-3` (`gap-3`, `p-3`)     | 12px         | Jarak antara badge kategori ke judul card           |
| `space-4` (`gap-4`, `p-4`)     | 16px         | Padding card compact, jarak vertikal antar paragraf |
| `space-6` (`gap-6`, `p-6`)     | 24px         | Padding internal card standar, gutter grid rapat    |
| `space-8` (`gap-8`, `p-8`)     | 32px         | Padding card besar, gutter grid standar             |
| `space-12` (`gap-12`, `mb-12`) | 48px         | Jarak antara heading section ke grid konten         |
| `space-16` (`py-16`, `mb-16`)  | 64px         | Padding section compact                             |
| `space-24` (`py-24`)           | 96px         | Padding section standar halaman publik              |

---

## 7. Border Radius & Shadow

### 7.1 Border Radius

| Token           | Rumus CSS                   | Nilai Efektif     | Penggunaan                                   |
| --------------- | --------------------------- | ----------------- | -------------------------------------------- |
| `--radius-sm`   | `calc(var(--radius) - 4px)` | 6px               | Input field kecil, tag teknis, dropdown item |
| `--radius-md`   | `calc(var(--radius) - 2px)` | 8px               | Tombol standar, form input, badge kotak      |
| `--radius-lg`   | `var(--radius)`             | 10px (`0.625rem`) | Card kontainer, dialog modal, panel konten   |
| `--radius-pill` | `9999px`                    | Full Rounded      | Status indicator tag, avatar, pill buttons   |

### 7.2 Elevation & Shadow

| Token                | Nilai                                 | Penggunaan                                        |
| -------------------- | ------------------------------------- | ------------------------------------------------- |
| `--shadow-soft`      | `rgba(15, 23, 42, 0.06) 0px 4px 16px` | Card hover state, dropdown menu, navbar sticky    |
| `--shadow-ring`      | `0 0 0 3px rgba(59, 91, 132, 0.15)`   | Focus ring pada Light Mode saat navigasi keyboard |
| `--shadow-ring-dark` | `0 0 0 3px rgba(240, 151, 90, 0.25)`  | Focus ring pada Dark Mode                         |

---

## 8. Komponen UI

### 8.1 Button

- **Primary:** Background `var(--primary)`, teks `var(--primary-foreground)`, radius `var(--radius-md)` (8px), padding `8px 16px`, font-medium (500). Digunakan untuk CTA utama per halaman.
- **Secondary / Ghost:** Border 1px `var(--border)`, background `transparent` atau `var(--secondary)`, teks `var(--foreground)`. Digunakan untuk aksi pendukung.
- **Destructive:** Background `var(--destructive)`, teks `#ffffff`. Digunakan khusus untuk konfirmasi pembatalan fatal / penghapusan data.

### 8.2 Form & Input

- Background `var(--background)`, border 1px `var(--border)`, radius `var(--radius-md)`.
- State Focus: Border berubah mengikuti warna `var(--ring)` disertai ring glow 3px (`--shadow-ring`).

### 8.3 Card (Technical Spec Sheet Style)

- Background `var(--card)`, border 1px `var(--border)`, radius `var(--radius-lg)` (10px), padding `p-6` hingga `p-7`.
- Hover: Transisi halus pada border `hover:border-primary` dan elevasi `hover:shadow-[var(--shadow-soft)]`.

### 8.4 Navigasi (Navbar & Footer)

- **Navbar:** Sticky header dengan background `backdrop-blur-md` berbasis `var(--background)/80`, border-b 1px `var(--border)`.
- **Active Navigation Link:** Font-weight 600 dengan indikator warna `var(--primary)`.

### 8.5 Modal & Dialog

- Backdrop: `bg-background/80` dengan efek `backdrop-blur-sm`.
- Kontainer: Posisi tengah layar, border 1px `var(--border)`, shadow elevasi tinggi, tombol close di sudut kanan atas.

### 8.6 Divider

- Menggunakan utility `.divider` (solid 1px `var(--border)`) atau `.dashed-divider` (dashed 1px `var(--border)`).

### 8.7 Tabel Data & Jadwal

- Header tabel: font-semibold (600), background `var(--muted)`, border-b 1px `var(--border)`.
- Baris tabel: Zebra-striping menggunakan `var(--secondary)`, baris skor angka menggunakan `font-mono`.

---

## 9. Ikon & Ilustrasi

| Parameter          | Konfigurasi Standar                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Icon Library**   | `lucide-react` (kompatibel penuh dengan ekosistem shadcn/ui)                              |
| **Ukuran Standar** | `16px` (kompak / tombol), `20px` (navigasi / list item), `24px` (feature icon)            |
| **Stroke Width**   | `1.75px` s.d. `2.0px` (konsisten, presisi garis tegas)                                    |
| **Gaya Ilustrasi** | Clean Line Art teknis atau SVG Blueprint schematics (hindari ilustrasi kartun playful 3D) |

---

## 10. Gambar & Media

- **Format File:** Wajib menggunakan format modern **WebP** atau **AVIF** untuk efisiensi transfer data.
- **Rasio Aspek Standar:**
  - Foto Robot & Tim: `16:9` atau `4:3` dengan properti `object-cover`.
  - Profil Pengurus / Avatar: `1:1` bulat penuh (`rounded-full`).
- **Aksesibilitas:** Seluruh tag `<img>` atau komponen `<Image />` Next.js wajib menyertakan atribut `alt` yang deskriptif.

---

## 11. Motion & Animasi

Animasi ditujukan untuk memberikan umpan balik status interaksi, bukan sekadar hiasan visual.

| Token               | Durasi            | Easing                          | Penerapan                                          |
| ------------------- | ----------------- | ------------------------------- | -------------------------------------------------- |
| `--duration-fast`   | `150ms`           | `ease-out`                      | Hover state tombol, border transition, toggle chip |
| `--duration-normal` | `200ms` – `250ms` | `ease-in-out`                   | Dropdown menu, accordion expand, tab switching     |
| `--duration-modal`  | `300ms`           | `cubic-bezier(0.16, 1, 0.3, 1)` | Fade-in & scale dialog modal / mobile sheet        |

_Catatan: Wajib mendukung media query `@media (prefers-reduced-motion: reduce)`._

---

## 12. Responsive & Breakpoints

| Breakpoint | Lebar Layar Minimal | Target Perangkat & Perubahan Layout                                      |
| ---------- | ------------------- | ------------------------------------------------------------------------ |
| `sm`       | `640px`             | Smartphone horizontal: Form split 2 kolom, hero button sejajar           |
| `md`       | `768px`             | Tablet: Grid divisi 2 kolom, sidebar SIM muncul sebagian                 |
| `lg`       | `1024px`            | Laptop: Grid divisi 3 kolom, navigasi desktop penuh                      |
| `xl`       | `1280px`            | Desktop Standar: Container terpusat dengan padding maksimal              |
| `2xl`      | `1536px`            | Monitor Lebar: Menjaga `max-w-7xl` agar konten tidak merenggang berlebih |

---

## 13. Aksesibilitas (a11y)

- [x] Rasio kontras teks normal minimal 4.5:1 terhadap background (Light & Dark).
- [x] Seluruh komponen interaktif (tombol, link, form) dapat dioperasikan via keyboard (Tab, Enter, Space, Escape).
- [x] Indikator focus ring terlihat jelas (`ring-2 ring-ring`).
- [x] Elemen interaktif memiliki ukuran target sentuh minimal 44x44px pada layar sentuh.
- [x] Menggunakan elemen HTML semantik (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- [x] Semua input form terhubung dengan label eksplisit atau `aria-label`.

---

## 14. Voice & Tone (Microcopy)

Gaya komunikasi bersifat **Ringkas, Percaya Diri, Akademis, dan Solutif**.

| Skenario             | Tone                   | Contoh Teks Rekomendasi                                                                           |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Hero Heading**     | Percaya diri, Visioner | _"Pusat Riset, Rekayasa, dan Prestasi Robotika Nasional"_                                         |
| **Deskripsi Divisi** | Presisi, Teknis        | _"Pengembangan robot beroda otonom berbasis Computer Vision dan strategi multi-agent real-time."_ |
| **Status Sukses**    | Lugas, Positif         | _"Pendaftaran berhasil diverifikasi. Jadwal seleksi telah dikirimkan ke email Anda."_             |
| **Status Error**     | Jelas, Informatif      | _"Format berkas tidak didukung. Harap unggah dokumen dalam format PDF (maks. 5MB)."_              |
| **Empty State**      | Solutif                | _"Belum ada riwayat kompetisi pada musim ini. Data akan diperbarui setelah rilis jadwal resmi."_  |

---

## 15. Penamaan File & Struktur Aset

```text
src/
├── app/
│   ├── (public)/          # Halaman publik (Beranda, Profil, Divisi, Prestasi)
│   ├── (auth)/            # Halaman login & pendaftaran anggota
│   └── (dashboard)/       # Sistem Informasi Manajemen (SIM)
├── components/
│   ├── ui/                # Komponen atomik shadcn/ui (button, card, input, dialog)
│   ├── public/            # Komponen khusus halaman publik (hero, division-card, timeline)
│   └── dashboard/         # Komponen modul SIM internal
├── assets/
│   ├── images/divisions/  # Foto dokumentasi robot (krai.webp, krsbi-b.webp)
│   └── logos/             # Asset logo (logo-robotik-pnp.svg)
└── styles/
    └── globals.css        # Sumber konfigurasi token Tailwind v4 & shadcn

```

---

## 16. Do's & Don'ts

### Do's (Lakukan)

- Selalu gunakan class utility berbasis token semantik (contoh: `bg-background`, `text-foreground`, `border-border`).
- Pertahankan jarak vertikal yang lapang (`py-16` / `py-24`) pada halaman publik untuk menjaga estetika institusional.
- Manfaatkan font monospace (`font-mono`) untuk kode registrasi, ID divisi, rasio teknis, dan skor robot.
- Pastikan setiap card memiliki visual anchor yang jelas (badge kategori di bagian atas dan tags di bagian bawah).

### Don'ts (Hindari)

- Jangan menggunakan nilai warna hex mentah (_hardcoded hex_) di dalam kode komponen.
- Jangan menambahkan bayangan (_drop shadow_) tebal dan pekat di semua kartu secara bersamaan.
- Jangan menggunakan font dekoratif atau playful yang merusak kesan teknik dan profesionalisme.
- Jangan membuat teks heading terlalu besar di layar mobile tanpa memanfaatkan skala `clamp()`.

---

## 17. Referensi & Tools

- **Framework:** [Next.js App Router](https://nextjs.org/)
- **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Component Primitives:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **Fonts:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [Inter](https://fonts.google.com/specimen/Inter)

---

| Versi     | Tanggal         | Perubahan                                                                                                                                                               |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 25 Agustus 2026 | Sinkronisasi penuh token `globals.css` (Tailwind v4 / shadcn) ke dalam struktur template `DESIGN.md` standar dengan dukungan Clean Institutional Engineering Dual-Mode. |

```

```
