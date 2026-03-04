-- ================================================
-- Migration: Sistem Piket Kesekretariatan
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Modul Kesekretariatan — Piket & Sanksi Denda
--
-- Flow:
--   1. Kestari generate jadwal piket per periode (masa jabatan)
--   2. Setiap anggota ditugaskan piket 1x/bulan pada minggu tertentu (1-4)
--   3. Anggota bebas piket hari apa saja di minggu yang ditentukan
--   4. Piket didokumentasikan dengan foto sebelum & sesudah (atau 1 foto)
--   5. Anggota kestari memverifikasi bukti piket
--   6. Tidak piket = otomatis kena denda
--   7. Denda dibayar dan diverifikasi oleh kestari
-- ================================================


-- =====================================================
-- ENUM: Status bukti piket
-- =====================================================

CREATE TYPE public.piket_submission_status AS ENUM (
  'pending',            -- Baru disubmit, belum diverifikasi
  'approved',           -- Diterima oleh kestari
  'rejected'            -- Ditolak — harus submit ulang atau kena sanksi
);


-- =====================================================
-- ENUM: Status denda
-- =====================================================

CREATE TYPE public.piket_fine_status AS ENUM (
  'unpaid',             -- Belum bayar
  'pending_verification', -- Sudah upload bukti bayar, menunggu verifikasi
  'paid',               -- Sudah dibayar dan terverifikasi
  'waived'              -- Dibebaskan (dispensasi kestari)
);


-- =====================================================
-- TABEL 1: PIKET_PERIODS (Periode piket / masa jabatan)
-- =====================================================
-- Satu periode = satu masa kepengurusan.
-- Setiap awal masa jabatan, kestari membuat period baru.

CREATE TABLE public.piket_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,           -- "Periode 2025/2026"
  start_date      DATE NOT NULL,                    -- Tanggal mulai periode
  end_date        DATE NOT NULL,                    -- Tanggal akhir periode
  fine_amount     INT NOT NULL DEFAULT 10000,        -- Nominal denda (rupiah)
  is_active       BOOLEAN NOT NULL DEFAULT true,     -- Hanya 1 periode aktif

  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_period_dates CHECK (end_date > start_date)
);

COMMENT ON TABLE  public.piket_periods              IS 'Periode piket — satu per masa jabatan kepengurusan';
COMMENT ON COLUMN public.piket_periods.fine_amount   IS 'Nominal denda dalam rupiah jika tidak piket';

CREATE TRIGGER piket_periods_updated_at
  BEFORE UPDATE ON public.piket_periods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 2: PIKET_ASSIGNMENTS (Jadwal piket per anggota)
-- =====================================================
-- Setiap anggota ditugaskan piket pada minggu tertentu (1-4) setiap bulan.
-- Anggota bebas piket hari apa saja di minggu tersebut.

CREATE TABLE public.piket_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id       UUID NOT NULL REFERENCES public.piket_periods(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_week   INT NOT NULL CHECK (assigned_week BETWEEN 1 AND 5),  -- Minggu ke-1 s/d ke-5

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 user hanya bisa punya 1 jadwal piket per periode
  CONSTRAINT uq_piket_assignment UNIQUE (period_id, user_id)
);

COMMENT ON TABLE  public.piket_assignments              IS 'Jadwal piket anggota — 1x/bulan di minggu yang ditentukan';
COMMENT ON COLUMN public.piket_assignments.assigned_week IS 'Minggu ke-1 s/d ke-5 setiap bulan (bisa 5 untuk bulan panjang)';

CREATE INDEX idx_piket_assignments_period_id ON public.piket_assignments(period_id);
CREATE INDEX idx_piket_assignments_user_id   ON public.piket_assignments(user_id);

CREATE TRIGGER piket_assignments_updated_at
  BEFORE UPDATE ON public.piket_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 3: PIKET_SUBMISSIONS (Bukti piket yang disubmit)
-- =====================================================
-- Setiap kali anggota piket, mereka submit bukti foto.
-- month_year menyimpan bulan+tahun piket ini berlaku.
-- Satu assignment bisa punya banyak submission (1 per bulan).

CREATE TABLE public.piket_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES public.piket_assignments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Kapan piket dilakukan
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  piket_date      DATE NOT NULL,                      -- Tanggal piket dilakukan
  month_year      VARCHAR(7) NOT NULL,                -- "2026-03" (bulan berlaku)

  -- Foto bukti
  photo_before_url VARCHAR(500) NULL,                 -- URL foto sebelum
  photo_after_url  VARCHAR(500) NULL,                 -- URL foto sesudah
  notes           TEXT NULL,                           -- Catatan opsional dari anggota

  -- Verifikasi
  status          public.piket_submission_status NOT NULL DEFAULT 'pending',
  verified_by     UUID NULL REFERENCES public.users(id),
  verified_at     TIMESTAMPTZ NULL,
  reject_reason   TEXT NULL,                           -- Alasan ditolak

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 submission per assignment per bulan
  CONSTRAINT uq_piket_submission_month UNIQUE (assignment_id, month_year)
);

COMMENT ON TABLE  public.piket_submissions                 IS 'Bukti piket — dokumen foto sebelum & sesudah';
COMMENT ON COLUMN public.piket_submissions.month_year      IS 'Format YYYY-MM — menentukan bulan piket berlaku';
COMMENT ON COLUMN public.piket_submissions.photo_before_url IS 'URL foto keadaan sebelum piket di R2/storage';
COMMENT ON COLUMN public.piket_submissions.photo_after_url  IS 'URL foto keadaan sesudah piket di R2/storage';

CREATE INDEX idx_piket_submissions_assignment_id ON public.piket_submissions(assignment_id);
CREATE INDEX idx_piket_submissions_user_id       ON public.piket_submissions(user_id);
CREATE INDEX idx_piket_submissions_month_year    ON public.piket_submissions(month_year);
CREATE INDEX idx_piket_submissions_status        ON public.piket_submissions(status);

CREATE TRIGGER piket_submissions_updated_at
  BEFORE UPDATE ON public.piket_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 4: PIKET_FINES (Denda piket)
-- =====================================================
-- Denda dibuat otomatis saat anggota tidak piket di bulan yang ditentukan.
-- Atau dibuat manual oleh kestari.

CREATE TABLE public.piket_fines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES public.piket_assignments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  month_year      VARCHAR(7) NOT NULL,                -- "2026-03"
  amount          INT NOT NULL,                        -- Nominal denda (rupiah)
  reason          TEXT NOT NULL DEFAULT 'Tidak melaksanakan piket',

  -- Pembayaran
  status          public.piket_fine_status NOT NULL DEFAULT 'unpaid',
  payment_proof_url VARCHAR(500) NULL,                 -- URL bukti pembayaran
  paid_at         TIMESTAMPTZ NULL,
  verified_by     UUID NULL REFERENCES public.users(id),
  verified_at     TIMESTAMPTZ NULL,

  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 denda per assignment per bulan
  CONSTRAINT uq_piket_fine_month UNIQUE (assignment_id, month_year)
);

COMMENT ON TABLE  public.piket_fines               IS 'Denda piket — dibuat otomatis atau manual oleh kestari';
COMMENT ON COLUMN public.piket_fines.amount         IS 'Nominal denda dalam rupiah';
COMMENT ON COLUMN public.piket_fines.payment_proof_url IS 'URL bukti pembayaran di R2/storage';

CREATE INDEX idx_piket_fines_assignment_id ON public.piket_fines(assignment_id);
CREATE INDEX idx_piket_fines_user_id       ON public.piket_fines(user_id);
CREATE INDEX idx_piket_fines_status        ON public.piket_fines(status);
CREATE INDEX idx_piket_fines_month_year    ON public.piket_fines(month_year);

CREATE TRIGGER piket_fines_updated_at
  BEFORE UPDATE ON public.piket_fines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.piket_periods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_fines       ENABLE ROW LEVEL SECURITY;

-- Pengurus/super_admin: full access
CREATE POLICY "pengurus_full_piket_periods" ON public.piket_periods
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "pengurus_full_piket_assignments" ON public.piket_assignments
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "pengurus_full_piket_submissions" ON public.piket_submissions
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "pengurus_full_piket_fines" ON public.piket_fines
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Anggota: baca jadwal sendiri, submit piket sendiri
CREATE POLICY "anggota_read_own_assignment" ON public.piket_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "anggota_read_own_submission" ON public.piket_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "anggota_insert_own_submission" ON public.piket_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "anggota_read_own_fine" ON public.piket_fines
  FOR SELECT USING (user_id = auth.uid());


-- =====================================================
-- REALTIME (untuk update live di dashboard)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.piket_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.piket_fines;
