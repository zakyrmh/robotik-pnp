# Sistem Informasi Terpadu UKM Robotik PNP

Sistem informasi berbasis web untuk manajemen anggota, kegiatan, dan administrasi UKM Robotik Politeknik Negeri Padang.

## Tech Stack

- **Framework** — Next.js App Router
- **Database** — Supabase (PostgreSQL)
- **Auth** — Supabase Authentication
- **UI** — shadcn/ui + Tailwind CSS
- **Validasi** — Zod
- **Package Manager** — pnpm

## Prasyarat

- Node.js 18+
- pnpm 8+
- Akun Supabase
- Supabase CLI (install via `winget install Supabase.CLI`)

## Instalasi

1. Clone repository

```bash
   git clone https://github.com/zakyrmh/robotik-pnp.git
   cd robotik-pnp
```

2. Install dependencies

```bash
   pnpm install
```

3. Salin file environment

```bash
   cp .env.example .env.local
```

4. Isi `.env.local` dengan nilai dari Supabase Dashboard

```env
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

5. Link ke Supabase project

```bash
   supabase link --project-ref YOUR_PROJECT_ID
```

6. Push migrasi database

```bash
   supabase db push
```

7. Generate TypeScript types

```bash
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/db/types/database.types.ts
```

8. Jalankan development server

```bash
   pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Folder

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── callback/
├── (dashboard)/
│   └── dashboard/
└── layout.tsx
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
└── db/
    ├── schema/
    ├── validations/
    └── types/
supabase/
└── migrations/
```

## Database

Skema database terdiri dari:

- `users` — mirror dari auth.users Supabase
- `profiles` — data profil personal anggota
- `education_details` — data akademik anggota
- `user_blacklist` — manajemen blacklist anggota
- `majors` — master data jurusan
- `study_programs` — master data program studi

## Scripts

```bash
pnpm dev              # jalankan development server
pnpm build            # build untuk production
pnpm start            # jalankan production server
supabase db push      # push migrasi ke Supabase
supabase db reset     # reset database lokal
```

## Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feat/nama-fitur`)
3. Commit perubahan (`git commit -m "feat: tambah fitur X"`)
4. Push ke branch (`git push origin feat/nama-fitur`)
5. Buat Pull Request

## Lisensi

Proyek ini menggunakan lisensi [MIT](LICENSE).
