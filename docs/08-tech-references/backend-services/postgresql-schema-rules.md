# PostgreSQL Schema Design & Row Level Security (RLS) Guide

Panduan teknis mendalam mengenai perancangan skema database **PostgreSQL** dan konfigurasi **Row Level Security (RLS)** pada platform **Supabase** untuk menjamin performa, skalabilitas, dan keamanan tingkat tinggi.

---

## 1. Aturan & Konvensi Perancangan Skema PostgreSQL

### 1.1. Konvensi Penamaan (Naming Conventions)

- **Nama Tabel**: Gunakan `snake_case` dalam bentuk jamak (_plural_). Contoh: `users`, `products`, `orders`, `order_items`.
- **Nama Kolom**: Gunakan `snake_case` dalam bentuk tunggal (_singular_). Contoh: `first_name`, `is_active`, `created_at`.
- **Primary Key**: Gunakan nama `id` secara standar untuk setiap tabel.
- **Foreign Key**: Gunakan nama `singular_table_name_id`. Contoh: `user_id` yang mereferensikan `users(id)`.
- **Index**: Gunakan awalan `idx_` diikuti nama tabel dan kolom. Contoh: `idx_orders_user_id`.
- **Unique Constraint**: Gunakan awalan `uq_` diikuti nama tabel dan kolom. Contoh: `uq_users_email`.

---

### 1.2. Pemilihan Tipe Data Utama

| Komponen / Use Case       | Tipe Data Direkomendasikan                            | Alasan & Best Practice                                                                                                                                                   |
| :------------------------ | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary Key (ID)**      | `uuid`                                                | Gunakan `gen_random_uuid()` (built-in Postgres 13+). Menghindari enumerasi tertebak (_predictable sequential ID_) dan aman untuk sistem terdistribusi.                   |
| **Waktu / Date-Time**     | `timestamptz`                                         | Selalu gunakan `TIMESTAMP WITH TIME ZONE`. Menyimpan waktu dalam UTC dan secara otomatis mengonversi sesuai timezone client.                                             |
| **Teks Pendek & Panjang** | `text`                                                | Hindari `varchar(n)` kecuali ada batas karakter ketat pada level domain bisnis. Di Postgres, `text` memiliki performa yang identik dengan `varchar`.                     |
| **Uang / Financial**      | `numeric(precision, scale)` atau `bigint` (dalam sen) | Jangan pernah menggunakan `float` atau `double precision` untuk data finansial karena potensi pemotongan presisi (_floating-point rounding errors_).                     |
| **Status / Options**      | Enum atau Text + Check Constraint                     | Gunakan `text` + `CHECK (status IN ('draft', 'published', 'archived'))` untuk fleksibilitas migrasi di masa mendatang, atau Postgres `ENUM` jika nilainya sangat statis. |
| **Data Terstruktur**      | `jsonb`                                               | Gunakan `jsonb` (Binary JSON) daripada `json` murni untuk pemrosesan dan pengindeksan yang lebih cepat.                                                                  |

---

### 1.3. Otomasi Timestamp (`created_at` & `updated_at`)

Setiap tabel wajib memiliki kolom jejak audit waktu (`created_at` dan `updated_at`).

```sql
-- 1. Buat fungsi trigger universal untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Terapkan trigger pada tabel target
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Row Level Security (RLS) di Supabase & PostgreSQL

### 2.1. Mengapa RLS Sangat Krusial?

Di platform Supabase, API layer (PostgREST) mengekspos database langsung ke client melalui REST dan GraphQL. Tanpa **Row Level Security (RLS)**, siapapun yang memiliki Anon Key publik dapat membaca, mengubah, atau menghapus seluruh isi tabel.

> **Aturan Emas**: Selalu aktifkan RLS pada **SEMUA** tabel publik segera setelah tabel dibuat!

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

### 2.2. Helper Functions Resmi Supabase Auth

Supabase menyediakan fungsi penolong dalam skema `auth` untuk mengidentifikasi request pengguna yang terautentikasi:

- `auth.uid()`: Mengembalikan UUID dari pengguna yang sedang login (`auth.users.id`).
- `auth.jwt()`: Mengembalikan payload JSON Web Token (JWT) pengguna (termasuk metadata, role, email, app_metadata).
- `auth.role()`: Mengembalikan role JWT (misal: `'authenticated'`, `'anon'`, `'service_role'`).

---

### 2.3. Pola-Pola Kebijakan (RLS Policy Patterns)

#### A. Pola Owner-Only Access (Pengguna Hanya Akses Data Miliknya)

```sql
-- Read Access
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Update Access
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);
```

#### B. Pola Public Read, Authenticated Write

```sql
-- Publik dapat membaca postingan yang dipublikasikan
CREATE POLICY "Public articles are viewable by everyone"
ON public.articles
FOR SELECT
TO public
USING (is_published = true);

-- Hanya pemilik yang dapat menambahkan postingan baru
CREATE POLICY "Users can create own articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);
```

#### C. Pola Role-Based Access Control (RBAC via JWT Metadata)

```sql
-- Hanya pengguna dengan role 'admin' di JWT yang dapat menghapus data
CREATE POLICY "Admins can delete any record"
ON public.orders
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
```

---

## 3. Optimasi Performa RLS & Indexing

### 3.1. Gunakan `(SELECT auth.uid())` daripada `auth.uid()`

Praktek ini sangat penting untuk mencegah PostgreSQL mengevaluasi ulang fungsi `auth.uid()` pada setiap baris (_per-row evaluation_). Dengan memungkusnya dalam subquery `(SELECT auth.uid())`, Postgres akan menganggap nilainya konstan untuk seluruh query execution plan.

```sql
-- BURUK (Lambat pada tabel jutaan baris):
USING (auth.uid() = user_id)

-- SANGAT BAIK (Dioptimasi oleh Query Optimizer):
USING ((SELECT auth.uid()) = user_id)
```

### 3.2. Wajib Mengindeks Kolom yang Digunakan dalam RLS

Setiap kolom yang masuk dalam klausa `USING` atau `WITH CHECK` pada RLS Policy wajib dibuatkan Index B-Tree agar eksekusi policy berkecepatan $O(\log N)$.

```sql
-- Membuat index pada Foreign Key & RLS Lookup Column
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_articles_author_id ON public.articles(author_id);
```

---

## 4. Security Definer vs Invoker Functions

Saat membuat Custom PostgreSQL Functions di Supabase:

- **`SECURITY INVOKER` (Default)**: Fungsi berjalan dengan hak akses pengguna yang memanggilnya. RLS tabel akan tetap berlaku.
- **`SECURITY DEFINER`**: Fungsi berjalan dengan hak akses pemilik fungsi (biasanya `postgres` / `service_role`). Fungsi ini **bypass RLS**. Digunakan secara hati-hati untuk operasi administratif, pendaftaran user baru, atau sinkronisasi skema.

```sql
-- Contoh Sinkronisasi Otomatis auth.users ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger pada tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. Script Migrasi SQL Lengkap (Contoh Siap Pakai)

Berikut adalah contoh skripsi DDL PostgreSQL lengkap yang menggabungkan seluruh _best practices_ di atas:

```sql
-- Enable Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Buat Tabel Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_username_min_len CHECK (char_length(username) >= 3)
);

-- 2. Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Buat Index
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- 4. Buat RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO public USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated USING ((SELECT auth.uid()) = id);

-- 5. Set Up Updated_at Trigger
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
