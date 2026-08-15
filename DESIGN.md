# UKM Robotik PNP — Design System Reference

> Sederhana, lembut, mudah dibaca di semua ukuran layar.

**Theme:** Minimalist Soft (Light)

Sistem Informasi Manajemen UKM Robotik PNP mengutamakan keterbacaan dan kenyamanan pengguna. Desain dibuat sesederhana mungkin: warna lembut, tipografi yang jelas, dan komponen yang tidak berlebihan. Prioritas utama adalah data dan konten — bukan dekorasi.

Prinsip warna: **70% netral — 20% warna utama — 10% aksen**

- **70% (Netral):** Putih dan abu-abu sangat muda untuk latar dan struktur.
- **20% (Warna Utama):** Biru Dongker versi lembut, dipakai untuk teks penting, tombol utama, dan elemen identitas.
- **10% (Aksen):** Oranye PNP versi lembut, dipakai secukupnya untuk status, highlight, dan elemen yang butuh perhatian.

## Tokens — Warna

| Name           | Value     | Token                    | Role                                                 |
| -------------- | --------- | ------------------------ | ---------------------------------------------------- |
| Canvas White   | `#ffffff` | `--color-canvas`         | Latar utama halaman dan kartu.                       |
| Surface Muted  | `#f8fafc` | `--color-surface`        | Latar sekunder, panel bersarang, zebra-stripe tabel. |
| Border         | `#e5e7eb` | `--color-border`         | Border tipis (1px) untuk semua container.            |
| Text Muted     | `#6b7280` | `--color-text-muted`     | Teks sekunder, placeholder, teks nonaktif.           |
| Text Secondary | `#374151` | `--color-text-secondary` | Subheading dan teks interaktif sekunder.             |
| Text Primary   | `#1f2937` | `--color-text-primary`   | Warna teks utama dan heading.                        |
| Navy (Soft)    | `#3b5b84` | `--color-primary`        | Tombol utama, link, elemen identitas UKM.            |
| Navy Hover     | `#2f4a6d` | `--color-primary-hover`  | State hover/active untuk elemen Navy.                |
| Navy Tint      | `#eaf1f8` | `--color-primary-soft`   | Latar lembut untuk badge/section bernuansa navy.     |
| Orange (Soft)  | `#f0975a` | `--color-accent`         | Aksen: indikator aktif, tag, highlight data penting. |
| Orange Tint    | `#fdeee1` | `--color-accent-soft`    | Latar lembut untuk badge status/pending.             |

> Catatan: warna Navy dan Orange di atas sengaja dibuat lebih lembut (less saturated) dibanding versi sebelumnya agar tidak terlalu tajam di mata, terutama untuk pemakaian jangka panjang di dashboard.

## Tokens — Tipografi

Cukup **2 font** agar konsisten dan ringan:

### Heading Font — Plus Jakarta Sans (fallback: Inter)

Dipakai untuk semua heading (H1–H4). Weight 600 (Semibold) — cukup tegas tanpa terasa berat.

### Body Font — Inter

Dipakai untuk body text, UI, navigasi, form, dan tabel. Weight 400 untuk teks biasa, 500 untuk label/tombol, 600 untuk header tabel.

> Untuk data teknis (ID, kode, angka presisi seperti skor pertandingan), cukup gunakan `font-mono` bawaan sistem (`ui-monospace`) — tidak perlu font pihak ketiga tambahan.

### Skala Ukuran Font (Mobile-first)

Skala dibuat **lebih kecil dan responsif** dibanding versi sebelumnya, supaya heading tidak raksasa di layar HP.

| Token          | Mobile | Desktop | Penggunaan                       |
| -------------- | ------ | ------- | -------------------------------- |
| `--text-micro` | 11px   | 11px    | Label super kecil, uppercase tag |
| `--text-sm`    | 13px   | 13px    | Caption, teks bantu              |
| `--text-base`  | 14px   | 15px    | Body text, form, tabel           |
| `--text-md`    | 16px   | 18px    | Subheading kecil (H4)            |
| `--text-lg`    | 18px   | 22px    | H3                               |
| `--text-xl`    | 22px   | 28px    | H2                               |
| `--text-2xl`   | 26px   | 34px    | H1                               |

Gunakan `clamp()` di CSS supaya transisi ukuran antar breakpoint halus, bukan lompatan tiba-tiba (lihat contoh konfigurasi di bawah).

## Tokens — Spacing, Radius & Struktur

**Base unit:** 4px. Padding umum di dalam card: 16px–24px.

### Border Radius

- **Card & Panel:** 10px
- **Button & Input:** 8px
- **Pill / Badge:** 9999px (full round)

### Elevasi

- Default: border 1px `--color-border`, tanpa shadow.
- Hover/elevated state (modal, dropdown): shadow lembut `rgba(15, 23, 42, 0.06) 0px 4px 16px`.
- Tidak perlu aturan ketat "no shadow ever" — pakai secukupnya, yang penting tidak berlebihan di semua card sekaligus.

## Komponen Inti

### 1. Button Primary

Background `--color-primary`, teks putih, radius 8px, padding 8px 16px, weight 500. Untuk aksi utama (mis. "Simpan", "Daftar").

### 2. Button Secondary / Ghost

Border 1px `--color-primary`, teks `--color-primary`, background transparan. Untuk aksi sekunder (mis. "Batal", "Lihat Detail").

### 3. Badge / Status Tag

Background `--color-accent-soft`, teks warna oranye lebih gelap (`#9a5b30`), radius full, uppercase, weight 600, ukuran 11px. Untuk status singkat ("AKTIF", "PROSES").

### 4. Input Field

Background putih, border 1px `--color-border`, radius 8px. Saat focus: border berubah ke `--color-primary` dengan shadow ring lembut.

### 5. Card

Background putih, radius 10px, border 1px. Tidak wajib pakai aksen garis tebal di sisi kiri — cukup opsional kalau memang perlu menandai kategori/status.

## Catatan Layout

### Halaman Login

Form login cukup sederhana, satu kolom, center pada layar kecil. Untuk layar besar boleh pakai split-panel (form di kiri, info singkat/greeting di kanan) — tapi ini opsional, bukan keharusan.

### Halaman Turnamen / Live Broadcast

Untuk tabel bracket, skor, dan data live:

- Gunakan zebra-stripe (`--color-surface`) agar tabel mudah dibaca.
- Angka/skor boleh pakai `font-mono` supaya rapi sejajar, tapi tidak wajib.

## Panduan Singkat

**Lakukan:**

- Utamakan keterbacaan — kontras cukup, ukuran font tidak terlalu kecil di mobile.
- Pakai warna Oranye secukupnya untuk aksen, bukan elemen besar.
- Beri jarak (padding/margin) yang cukup supaya tidak terasa sesak.

**Hindari:**

- Ukuran heading terlalu besar di layar mobile (gunakan skala responsif di atas).
- Terlalu banyak warna aksen dalam satu tampilan.
- Shadow tebal di semua card sekaligus.

---

## Konfigurasi Dasar Tailwind CSS v4

_(Salin ke global CSS / context tema agent)_

```css
@theme {
  /* Warna — Netral */
  --color-canvas: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e5e7eb;

  /* Warna — Teks */
  --color-text-muted: #6b7280;
  --color-text-secondary: #374151;
  --color-text-primary: #1f2937;

  /* Warna — Navy (Soft) */
  --color-primary: #3b5b84;
  --color-primary-hover: #2f4a6d;
  --color-primary-soft: #eaf1f8;

  /* Warna — Orange (Soft) */
  --color-accent: #f0975a;
  --color-accent-soft: #fdeee1;
  --color-accent-deep: #9a5b30;

  /* Tipografi */
  --font-display:
    "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;

  /* Skala Font — Mobile-first, disesuaikan via clamp() */
  --text-micro: 0.6875rem; /* 11px */
  --text-sm: 0.8125rem; /* 13px */
  --text-base: clamp(0.875rem, 0.8rem + 0.2vw, 0.9375rem); /* 14–15px */
  --text-md: clamp(1rem, 0.9rem + 0.4vw, 1.125rem); /* 16–18px */
  --text-lg: clamp(1.125rem, 1rem + 0.6vw, 1.375rem); /* 18–22px */
  --text-xl: clamp(1.375rem, 1.1rem + 1vw, 1.75rem); /* 22–28px */
  --text-2xl: clamp(1.625rem, 1.2rem + 1.6vw, 2.125rem); /* 26–34px */

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-pill: 9999px;

  /* Shadow */
  --shadow-soft: rgba(15, 23, 42, 0.06) 0px 4px 16px;
  --shadow-ring: 0 0 0 3px rgba(59, 91, 132, 0.15);
}

/* Base Layout */
@layer base {
  body {
    @apply bg-[var(--color-canvas)] text-[var(--color-text-primary)] font-body antialiased;
    font-size: var(--text-base);
  }
  h1 {
    @apply font-display font-semibold tracking-tight text-[var(--color-text-primary)];
    font-size: var(--text-2xl);
  }
  h2 {
    @apply font-display font-semibold tracking-tight text-[var(--color-text-primary)];
    font-size: var(--text-xl);
  }
  h3 {
    @apply font-display font-semibold text-[var(--color-text-primary)];
    font-size: var(--text-lg);
  }
  h4 {
    @apply font-display font-medium text-[var(--color-text-primary)];
    font-size: var(--text-md);
  }
  .divider {
    @apply border-t border-[var(--color-border)] w-full;
  }
}
```
