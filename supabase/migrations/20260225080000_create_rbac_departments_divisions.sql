-- ================================================
-- Migration: RBAC, Departemen, dan Divisi
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Struktur organisasi UKM Robotik PNP:
--   • Departemen  : hierarki 2 level (departemen → sub-departemen)
--   • Divisi      : 5 tim kontes, masing-masing punya role teknis
--   • RBAC        : roles & permissions di level sistem (admin, pengurus, dll.)
--
-- Setiap anggota tetap memiliki:
--   1 jabatan di departemen  (via user_departments)
--   2 jabatan di divisi      (via user_divisions)
-- ================================================


-- =====================================================
-- ENUM: Role teknis di dalam divisi kontes
-- =====================================================

CREATE TYPE public.division_role AS ENUM (
  'mekanik',
  'elektrikal',
  'programmer'
);

COMMENT ON TYPE public.division_role IS 'Role teknis anggota di dalam divisi kontes';


-- =====================================================
-- TABEL 1: DEPARTMENTS (Departemen dengan hierarki)
-- =====================================================
-- Self-referencing parent_id untuk sub-departemen.
-- Contoh: "Hubungan Masyarakat" → parent_id = id "Informasi dan Komunikasi"

CREATE TABLE public.departments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.departments           IS 'Departemen organisasi UKM Robotik PNP (mendukung hierarki)';
COMMENT ON COLUMN public.departments.parent_id IS 'NULL = departemen utama, terisi = sub-departemen';
COMMENT ON COLUMN public.departments.slug      IS 'Slug unik untuk URL dan identifikasi (contoh: infokom)';

CREATE INDEX idx_departments_parent_id ON public.departments(parent_id);

CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 2: DIVISIONS (Divisi kontes robot)
-- =====================================================

CREATE TABLE public.divisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.divisions      IS 'Divisi kontes robot — setiap divisi memiliki role mekanik, elektrikal, programmer';
COMMENT ON COLUMN public.divisions.slug IS 'Slug unik untuk URL dan identifikasi (contoh: krai)';

CREATE TRIGGER divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 3: ROLES (Role RBAC level sistem)
-- =====================================================
-- Role ini untuk kontrol akses di level aplikasi,
-- BUKAN untuk jabatan organisasi (departemen/divisi).
-- Contoh role: super_admin, admin, pengurus, anggota, caang

CREATE TABLE public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.roles      IS 'Role RBAC level sistem — mengontrol akses fitur aplikasi';
COMMENT ON COLUMN public.roles.name IS 'Nama unik role (contoh: super_admin, pengurus, anggota)';


-- =====================================================
-- TABEL 4: PERMISSIONS (Aksi spesifik fitur)
-- =====================================================
-- Format penamaan: <modul>:<aksi>
-- Contoh: 'member:read', 'or:verify_payment', 'division:manage'

CREATE TABLE public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.permissions      IS 'Permission granular per fitur — format: <modul>:<aksi>';
COMMENT ON COLUMN public.permissions.name IS 'Contoh: member:read, or:verify_payment, division:manage';


-- =====================================================
-- TABEL 5: ROLE_PERMISSIONS (Junction Role ↔ Permission)
-- =====================================================

CREATE TABLE public.role_permissions (
  role_id       UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,

  PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Mapping N:M antara roles dan permissions';

-- Index tambahan untuk query dari sisi permission
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);


-- =====================================================
-- TABEL 6: USER_ROLES (Junction User ↔ Role sistem)
-- =====================================================
-- Satu user bisa punya beberapa role sistem.
-- assigned_by mencatat siapa yang memberikan role (audit trail).

CREATE TABLE public.user_roles (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE  public.user_roles         IS 'Assignment role RBAC ke user';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'User (admin) yang memberikan role ini';

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);


-- =====================================================
-- TABEL 7: USER_DEPARTMENTS (Assignment user → departemen)
-- =====================================================
-- Setiap anggota memiliki 1 jabatan di departemen.
-- position = nama jabatan spesifik di departemen tersebut.
-- Constraint UNIQUE(user_id) memastikan 1 user = 1 jabatan departemen.

CREATE TABLE public.user_departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  position      VARCHAR(100) NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 user hanya bisa di 1 departemen
  CONSTRAINT uq_user_department UNIQUE (user_id)
);

COMMENT ON TABLE  public.user_departments          IS 'Jabatan user di departemen — 1 user = 1 departemen';
COMMENT ON COLUMN public.user_departments.position IS 'Jabatan spesifik (contoh: Kepala Departemen, Anggota)';

CREATE INDEX idx_user_departments_department_id ON public.user_departments(department_id);

CREATE TRIGGER user_departments_updated_at
  BEFORE UPDATE ON public.user_departments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 8: USER_DIVISIONS (Assignment user → divisi + role teknis)
-- =====================================================
-- Setiap anggota bisa di MAKSIMAL 2 divisi.
-- role = mekanik / elektrikal / programmer
-- Constraint UNIQUE(user_id, division_id) mencegah duplikasi di divisi yang sama.

CREATE TABLE public.user_divisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  role        public.division_role NOT NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 user tidak bisa masuk divisi yang sama dua kali
  CONSTRAINT uq_user_division UNIQUE (user_id, division_id)
);

COMMENT ON TABLE  public.user_divisions      IS 'Jabatan user di divisi kontes — maks 2 divisi per user';
COMMENT ON COLUMN public.user_divisions.role IS 'Role teknis: mekanik, elektrikal, atau programmer';

CREATE INDEX idx_user_divisions_division_id ON public.user_divisions(division_id);
CREATE INDEX idx_user_divisions_user_id     ON public.user_divisions(user_id);

CREATE TRIGGER user_divisions_updated_at
  BEFORE UPDATE ON public.user_divisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- FUNCTION: Validasi maksimal 2 divisi per user
-- =====================================================
-- Trigger ini dijalankan SEBELUM INSERT untuk memastikan
-- seorang user tidak terdaftar di lebih dari 2 divisi.

CREATE OR REPLACE FUNCTION public.check_max_user_divisions()
RETURNS TRIGGER AS $$
DECLARE
  division_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO division_count
  FROM public.user_divisions
  WHERE user_id = NEW.user_id;

  IF division_count >= 2 THEN
    RAISE EXCEPTION 'User hanya boleh terdaftar di maksimal 2 divisi'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_user_divisions
  BEFORE INSERT ON public.user_divisions
  FOR EACH ROW EXECUTE FUNCTION public.check_max_user_divisions();


-- =====================================================
-- FUNCTION HELPER: Cek apakah user memiliki permission tertentu
-- =====================================================
-- Digunakan di RLS policies dan application code.
-- Contoh: SELECT public.user_has_permission(auth.uid(), 'member:read');

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_permission IS 'Mengecek apakah user memiliki permission tertentu via role-nya';


-- =====================================================
-- FUNCTION HELPER: Cek apakah user memiliki role tertentu
-- =====================================================
-- Contoh: SELECT public.user_has_role(auth.uid(), 'super_admin');

CREATE OR REPLACE FUNCTION public.user_has_role(
  p_user_id UUID,
  p_role_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.name = p_role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_role IS 'Mengecek apakah user memiliki role tertentu';


-- =====================================================
-- SEED: Data awal departemen
-- =====================================================

-- Departemen utama (tanpa parent)
INSERT INTO public.departments (name, slug) VALUES
  ('Ketua Umum',                          'ketua-umum'),
  ('Wakil Ketua',                         'wakil-ketua'),
  ('Sekretaris',                          'sekretaris'),
  ('Bendahara',                           'bendahara'),
  ('Komisi Disiplin',                     'komisi-disiplin'),
  ('Open Recruitment',                    'open-recruitment'),
  ('Kesekretariatan',                     'kesekretariatan'),
  ('Informasi dan Komunikasi',            'infokom'),
  ('Penelitian dan Pengembangan',         'litbang'),
  ('Mekanik Elektronika Lapangan',        'mekanikal');

-- Sub-departemen Informasi dan Komunikasi
INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Hubungan Masyarakat', 'infokom-humas'
FROM public.departments WHERE slug = 'infokom';

INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Publikasi dan Dokumentasi', 'infokom-pubdok'
FROM public.departments WHERE slug = 'infokom';

-- Sub-departemen Penelitian dan Pengembangan
INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Komisi Pemberdayaan Sumber Daya Manusia', 'litbang-psdm'
FROM public.departments WHERE slug = 'litbang';

INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Riset Teknologi', 'litbang-ristek'
FROM public.departments WHERE slug = 'litbang';

-- Sub-departemen Mekanik Elektronika Lapangan
INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Maintenance', 'mekanikal-maintenance'
FROM public.departments WHERE slug = 'mekanikal';

INSERT INTO public.departments (parent_id, name, slug)
SELECT id, 'Produksi', 'mekanikal-produksi'
FROM public.departments WHERE slug = 'mekanikal';


-- =====================================================
-- SEED: Data awal divisi kontes
-- =====================================================

INSERT INTO public.divisions (name, slug) VALUES
  ('Kontes Robot ABU Indonesia',                   'krai'),
  ('Kontes Robot Sepak Bola Indonesia Beroda',     'krsbi-beroda'),
  ('Kontes Robot Sepak Bola Indonesia Humanoid',   'krsbi-humanoid'),
  ('Kontes Robot SAR Indonesia',                   'krsri'),
  ('Kontes Robot Seni Tari Indonesia',             'krsti');


-- =====================================================
-- SEED: Data awal roles sistem
-- =====================================================

INSERT INTO public.roles (name, description) VALUES
  ('super_admin',   'Akses penuh ke seluruh fitur sistem'),
  ('admin',         'Administrasi umum — kelola anggota dan konten'),
  ('pengurus',      'Pengurus aktif — akses fitur kepengurusan'),
  ('anggota',       'Anggota tetap — akses fitur umum'),
  ('caang',          'Calon anggota (caang) — akses terbatas saat proses seleksi');


-- =====================================================
-- SEED: Data awal permissions
-- =====================================================

INSERT INTO public.permissions (name, description) VALUES
  -- Manajemen anggota
  ('member:read',         'Melihat daftar dan detail anggota'),
  ('member:create',       'Mendaftarkan anggota baru'),
  ('member:update',       'Mengubah data anggota'),
  ('member:delete',       'Menghapus/menonaktifkan anggota'),

  -- Open Recruitment
  ('or:manage',           'Mengelola proses open recruitment'),
  ('or:verify_payment',   'Verifikasi pembayaran pendaftaran'),
  ('or:grade_test',       'Menilai hasil tes/wawancara calon anggota'),

  -- Departemen & Divisi
  ('department:manage',   'Mengelola data departemen dan jabatan'),
  ('division:manage',     'Mengelola data divisi dan assignment'),

  -- Konten & Publikasi
  ('content:read',        'Melihat konten internal'),
  ('content:create',      'Membuat konten / artikel / dokumentasi'),
  ('content:update',      'Mengubah konten yang sudah ada'),
  ('content:delete',      'Menghapus konten'),

  -- Keuangan
  ('finance:read',        'Melihat laporan keuangan'),
  ('finance:manage',      'Mengelola pemasukan dan pengeluaran'),

  -- Blacklist & Disiplin
  ('blacklist:manage',    'Mengelola daftar hitam anggota'),

  -- Role & Permission (khusus super_admin)
  ('rbac:manage',         'Mengelola role dan permission sistem');


-- =====================================================
-- SEED: Mapping default role → permissions
-- =====================================================

-- Super Admin: semua permission
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin';

-- Admin: semua kecuali rbac:manage
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.name != 'rbac:manage';

-- Pengurus: member, content, OR, department, division
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'pengurus'
  AND p.name IN (
    'member:read', 'member:update',
    'content:read', 'content:create', 'content:update',
    'or:manage', 'or:verify_payment', 'or:grade_test',
    'department:manage', 'division:manage',
    'finance:read'
  );

-- Anggota: akses baca
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'anggota'
  AND p.name IN ('member:read', 'content:read');

-- Caang (Calon Anggota): akses minimal
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'caang'
  AND p.name IN ('content:read');


-- =====================================================
-- SEED: Assign role default 'caang' ke user baru
-- =====================================================
-- Trigger otomatis memberikan role 'caang' (calon anggota)
-- saat user baru masuk ke public.users.

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id
  FROM public.roles r
  WHERE r.name = 'caang';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_assign_role
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();
