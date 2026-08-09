# Deskripsi Diagram Topologi Deployment (Deployment Topology Diagram Description)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                     |
| :------------------------------------ | :---------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-DTD-01`                                                                          |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                           |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                            |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                   |
| **Induk Kebijakan (_Master Policy_)** | _Infrastructure Configuration & Cloud Services Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                            |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis             | Ringkasan Perubahan                                                   |
| :------: | :--------: | :------------------ | :-------------------------------------------------------------------- |
| `v1.0.0` | 09/08/2026 | Solutions Architect | Draf diagram topologi menggunakan Enterprise Architect (XMI/UML 2.1). |
| `v2.0.0` | 09/08/2026 | System Analyst      | Deskripsi naratif pendamping diagram untuk dokumentasi ISMS.          |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini merupakan pendamping naratif untuk file diagram UML **[deployment-topology.dd.xml](file:///d:/Project/robotik-pnp/docs/05-physical-view/deployment-diagrams/deployment-topology.dd.xml)** yang dihasilkan oleh **Enterprise Architect** dalam format XMI/UML 2.1. File XML tersebut berisi definisi visual topologi deployment infrastruktur cloud yang digunakan oleh **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 2. Ringkasan Node Deployment (UML Deployment Diagram)

Diagram topologi memetakan **7 node infrastruktur utama** beserta jalur komunikasi antar-node:

```
                              ┌──────────────────┐
                              │   Client Browser  │
                              └────────┬─────────┘
                           HTTPS │          │ HTTPS
                    ┌────────────┘          └────────────┐
                    ▼                                    ▼
          ┌─────────────────┐                  ┌──────────────────┐
          │  Vercel Platform │                  │ Cloudflare       │
          │  (Next.js 16)   │                  │ Turnstile (CAPTCHA)│
          └────────┬────────┘                  └──────────┬───────┘
                   │                                      │
     ┌─────────────┼──────────────────┐    HTTPS (siteverify)
     │             │                  │                   │
     ▼             ▼                  ▼                   ▼
┌─────────┐ ┌───────────┐ ┌──────────────┐      ┌──────────────┐
│Supabase │ │ Upstash   │ │  Supabase    │      │  Sentry      │
│PostgreSQL│ │ Redis     │ │  Auth/Storage│      │  Monitoring  │
└─────────┘ └───────────┘ └──────────────┘      └──────────────┘
```

---

## 3. Daftar Node & Spesifikasi

| No  | Nama Node (UML)          | Tipe Layanan                       | Protokol Komunikasi               | Fungsi Utama                                                    |
| :-: | :----------------------- | :--------------------------------- | :-------------------------------- | :-------------------------------------------------------------- |
|  1  | **Client**               | Web Browser (Desktop/Mobile)       | HTTPS                             | Antarmuka pengguna akhir (anggota, caang, admin)                |
|  2  | **Vercel Platform**      | Serverless Hosting (Node/Edge)     | HTTPS (PostgREST/Supabase Client) | Menjalankan Next.js 16 App Router (Server Components & Actions) |
|  3  | **Cloudflare Turnstile** | Bot Detection / CAPTCHA Service    | HTTPS (siteverify API)            | Validasi tantangan CAPTCHA pada form login & registrasi         |
|  4  | **Supabase Cloud**       | BaaS (PostgreSQL + Auth + Storage) | HTTPS (PostgREST/Supabase Client) | Database utama, autentikasi, dan penyimpanan file media         |
|  5  | **Upstash Redis**        | Serverless Redis (REST API)        | HTTPS (REST API)                  | Rate limiting, caching, dan session token QR presensi           |
|  6  | **Sentry**               | Application Performance Monitoring | HTTPS                             | Error tracking, performance spans, dan alerting                 |
|  7  | **Supabase Realtime**    | WebSocket Pub/Sub Engine           | WSS (WebSocket Secure)            | Live update skor MRC (khusus Admin/Juri)                        |

---

## 4. Jalur Komunikasi Antar-Node (Communication Paths)

| Sumber Node     | Tujuan Node          | Protokol & Label                          | Deskripsi Fungsi                                                       |
| :-------------- | :------------------- | :---------------------------------------- | :--------------------------------------------------------------------- |
| Client          | Vercel Platform      | `HTTPS`                                   | Request halaman web, Server Actions, dan API routes                    |
| Client          | Cloudflare Turnstile | `HTTPS`                                   | Render widget CAPTCHA dan kirim token challenge                        |
| Vercel Platform | Cloudflare Turnstile | `HTTPS (siteverify API)`                  | Verifikasi server-side token CAPTCHA via Turnstile API                 |
| Vercel Platform | Supabase Cloud       | `HTTPS (PostgREST/Supabase Client)`       | Query database (RLS-enforced), autentikasi, dan operasi Storage bucket |
| Vercel Platform | Upstash Redis        | `HTTPS (REST API)`                        | Cache read/write, rate limiting check, dan QR token session management |
| Vercel Platform | Sentry               | `HTTPS`                                   | Kirim error telemetry, performance traces, dan breadcrumb data         |
| Supabase Cloud  | Supabase Realtime    | Internal (PostgreSQL Logical Replication) | Broadcast perubahan data tabel via `supabase.channel()` (WebSocket)    |

---

## 5. File Sumber Diagram

- **Format**: XMI/UML 2.1 (Enterprise Architect Export)
- **Lokasi File**: `docs/05-physical-view/deployment-diagrams/deployment-topology.dd.xml`
- **Software Pembuat**: Enterprise Architect v6.5
- **Tanggal Pembuatan Diagram**: 9 Agustus 2026

> _Catatan_: Untuk membuka dan mengedit diagram secara visual, gunakan **Enterprise Architect** atau tool kompatibel XMI seperti **StarUML**, **Visual Paradigm**, atau **draw.io** (import XMI).

---

_Dokumen ini diterbitkan sebagai standar deskripsi topologi deployment resmi untuk UKM Robotik Politeknik Negeri Padang._
