# Strategi Penskalaan Infrastruktur & Arsitektur Edge Caching (Infrastructure Scaling Strategy & Edge Caching Architecture)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                        |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-SCL-01`                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                      |
| **Induk Kebijakan (_Master Policy_)** | _Deployment Architecture & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                         |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                 |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis             | Ringkasan Perubahan                                                                                               |
| :------: | :--------: | :------------------ | :---------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Solutions Architect | Draf awal matriks pemicu upgrade Supabase, Vercel Edge caching strategy, dan implementasi ISR/SWR.                |
| `v2.0.0` | 09/08/2026 | System Analyst      | Revisi: Penambahan Document Control, perbaikan JSX props dan stray code fence, standardisasi, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi panduan teknis dan strategi pemetaan skala (_scaling strategy_) untuk infrastruktur **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

Dokumen ini menetapkan **indikator kuantitatif kapan harus melakukan upgrade layanan** (khususnya Supabase Free ke Pro Tier) serta **strategi Vercel Edge Caching** untuk halaman publik (seperti pengumuman, jadwal, dan live score MRC) agar sistem tidak bergantung secara penuh pada compute backend dan database.

---

## 2. Pemicu Upgrade Infrastruktur (Supabase Free → Pro Tier Trigger Matrix)

Keputusan upgrade layanan dari Free Tier ke Pro Tier berbasis **data riil dan ambang batas (threshold)**, bukan perkiraan. Berikut adalah matriks pemicu upgrade (_upgrade triggers_):

### 2.1. Matriks Indikator Pemicu Upgrade Supabase

| Resource Metric          | Free Tier Limit | Threshold Warning (80%) | Upgrade Trigger Level (90%) | Tindakan & Dampak Upgrade ke Pro Tier                                                                                                      |
| :----------------------- | :-------------: | :---------------------: | :-------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Realtime Connections** | 200 Client Peak |     160 Concurrent      |    **> 180 Concurrent**     | Upgrade ke **Supabase Pro ($25/bln)** $\rightarrow$ Batas naik menjadi **500 Concurrent Connections** (dan dapat di-scale hingga 10.000+). |
| **Database Size**        |     500 MB      |         400 MB          |        **> 450 MB**         | Upgrade ke **Supabase Pro** $\rightarrow$ Kuota bawaan naik menjadi **8 GB** (+ $0.125/GB tambahan).                                       |
| **Egress Bandwidth**     |  5 GB / bulan   |      4 GB / bulan       |    **> 4.5 GB / bulan**     | Upgrade ke **Supabase Pro** $\rightarrow$ Kuota bawaan naik menjadi **250 GB / bulan** egress.                                             |
| **Direct Connections**   | 60 Connections  |     48 Connections      |    **> 55 Connections**     | Optimasi Supavisor Transaction Pooler (Port `6543`) atau upgrade Compute Instance ke Small/Medium.                                         |
| **Storage (Buckets)**    |      1 GB       |         800 MB          |        **> 900 MB**         | Upgrade ke **Supabase Pro** $\rightarrow$ Kuota storage naik menjadi **100 GB**.                                                           |

> **Prosedur Keputusan Upgrade**:
> Jika salah satu metrik utama di atas menyentuh **Upgrade Trigger Level (90%)** selama 3 hari berturut-turut atau saat H-3 menjelang acara besar (Minangkabau Robot Contest / MRC), **Incident Commander (Ketua UKM)** dan **Technical Lead** berhak mengajukan pengaktifan Supabase Pro Tier.

---

## 3. Strategi Vercel Edge Caching & Offloading Compute

Untuk menekan penggunaan compute serverless Vercel dan database Supabase pada halaman publik ber-trafik tinggi (Pengumuman Oprec, Jadwal Kegiatan, dan Live Score MRC), diterapkan **Vercel Edge Caching Strategy**.

### 3.1. Arsitektur Offloading Compute

```
[ Public Visitor (1.000+ Requests) ]
│
▼
[ Vercel Edge Network Ingress ]
│
(1) Edge Cache Hit?
┌──────────┴──────────┐
│ YES                 │ NO
▼                     ▼
[ Return Static ]    [ Execute Incremental Static ]
[ Page (~5-15ms) ]   [ Regeneration (ISR) / SWR  ]
                              │
                              ▼
                     [ Upstash Redis / DB Query ]
```

---

### 3.2. Implementasi Caching Per Halaman Publik

#### A. Halaman Pengumuman Oprec & Berita (`/pengumuman`, `/berita/*`)

- **Karakteristik**: Data jarang berubah (Low Mutation Rate).
- **Strategi Caching**: **Incremental Static Regeneration (ISR)** dengan `revalidate`.
- **Implementasi Next.js 16**:

```typescript
// app/pengumuman/page.tsx
export const revalidate = 3600; // Cache di Edge Vercel selama 1 jam

export default async function AnnouncementPage() {
  // Data di-fetch dan di-cache di Vercel Edge Server
  const announcements = await getPublicAnnouncements();
  return <AnnouncementList data={announcements} />;
}
```

- **Hasil Performance**: _Compute Offloading_ $99\%$. Kueri database hanya berjalan 1 kali per jam untuk seluruh pengunjung.

#### B. Halaman Jadwal & Live Score MRC (`/mrc/live-score`, `/mrc/jadwal`)

- **Karakteristik**: Data dinamis tinggi saat hari-H (High Mutation Rate), tetapi dibaca oleh ribuan penonton bersamaan.
- **Strategi Caching**: **Stale-While-Revalidate (SWR) + Short Edge Revalidation**.
- **Implementasi Next.js 16**:

```typescript
// app/mrc/live-score/page.tsx
export const revalidate = 3; // Revalidasi di Edge Vercel setiap 3 detik

export default async function LiveScorePage() {
  const scoreData = await getCachedLiveScoreAction();
  return <LiveScoreBoard initialData={scoreData} />;
}
```

- **Hasil Performance**: Ribuan _request_ penonton per detik yang masuk dalam jeda 3 detik akan dilayani langsung dari **Vercel Edge Ingress Cache** tanpa menyentuh serverless function execution time maupun Supabase DB.

---

## 4. Matriks Alokasi Compute & Optimization

| Nama Rute Halaman  | Tipe Strategy Caching  | Target Revalidation | Latensi Respon Edge    | Beban Compute Database   |
| ------------------ | ---------------------- | ------------------- | ---------------------- | ------------------------ |
| `/` (Landing Page) | **Static / ISR**       | 86.400s (24 Jam)    | $\approx 10\text{ms}$  | $0\%$ (100% Edge Served) |
| `/pengumuman`      | **ISR**                | 3.600s (1 Jam)      | $\approx 15\text{ms}$  | $< 1\%$                  |
| `/mrc/live-score`  | **Short ISR / SWR**    | 3s (Hari-H Lomba)   | $\approx 20\text{ms}$  | $< 5\%$                  |
| `/dashboard/*`     | **Dynamic (No Cache)** | `revalidate = 0`    | $\approx 150\text{ms}$ | Dynamic per Session      |

---

## 5. Operational Checklist Scaling Readiness

- [ ] Variabel `revalidate` terpasang secara tepat di seluruh Server Components publik (`/pengumuman`, `/mrc/live-score`).
- [ ] Vercel Analytics / Speed Insights memantau _Cache Hit Ratio_ (Target Edge Cache Hit Ratio $\ge 85\%$ untuk rute publik).
- [ ] Alerting otomatis Supabase Dashboard terpasang pada batas $80\%$ kuota Free Tier.
- [ ] SOP pengaktifan Supabase Pro Tier siap dieksekusi jika terjadi lonjakan beban di luar skenario perkiraan.

---

_Dokumen ini diterbitkan sebagai standar strategi penskalaan infrastruktur & arsitektur edge caching resmi untuk UKM Robotik Politeknik Negeri Padang._
