-- ================================================
-- Migration: Sistem Pertandingan & Overlay MRC
-- ================================================
-- Tabel untuk mengelola grup, pertandingan, skor,
-- state live, dan konfigurasi overlay.
--
-- Alur pertandingan:
-- 1. Drawing: Bagi tim ke grup secara acak
-- 2. Fase Grup: Pertandingan round-robin dalam grup
-- 3. Eliminasi: Pemenang grup masuk bracket eliminasi
-- 4. Overlay: Ditampilkan di OBS via Browser Source
--
-- Struktur:
-- 1. mrc_groups        → Grup pertandingan
-- 2. mrc_group_teams   → Tim dalam grup + standing
-- 3. mrc_matches       → Pertandingan (grup & eliminasi)
-- 4. mrc_match_rounds  → Skor per babak
-- 5. mrc_live_state    → State overlay & timer per kategori
-- 6. mrc_overlay_configs → Konfigurasi visual overlay


-- =====================================================
-- ENUM: Stage pertandingan
-- =====================================================

CREATE TYPE public.mrc_match_stage AS ENUM (
  'group_stage',     -- Fase grup
  'round_of_16',     -- Babak 16 besar
  'quarterfinal',    -- Perempat final
  'semifinal',       -- Semi final
  'third_place',     -- Perebutan juara 3
  'final'            -- Final
);

-- =====================================================
-- ENUM: Status pertandingan
-- =====================================================

CREATE TYPE public.mrc_match_status AS ENUM (
  'upcoming',    -- Belum dimulai
  'live',        -- Sedang berlangsung
  'finished'     -- Selesai
);

-- =====================================================
-- ENUM: Status timer
-- =====================================================

CREATE TYPE public.mrc_timer_status AS ENUM (
  'stopped',   -- Timer berhenti / belum dimulai
  'running',   -- Timer sedang berjalan
  'paused'     -- Timer dijeda
);

-- =====================================================
-- ENUM: Scene overlay aktif
-- =====================================================

CREATE TYPE public.mrc_overlay_scene AS ENUM (
  'none',        -- Tidak ada overlay
  'match',       -- Pertandingan (nama tim + timer)
  'scoreboard',  -- Skor per babak
  'bracket',     -- Bracket eliminasi
  'standing',    -- Klasemen grup
  'coming_up',   -- Pertandingan selanjutnya
  'break'        -- Istirahat / jeda
);

-- =====================================================
-- ENUM: Mode timer overlay (utk coming_up & break)
-- =====================================================

CREATE TYPE public.mrc_timer_mode AS ENUM (
  'none',          -- Tanpa countdown
  'countdown',     -- Mundur berdasarkan durasi (X menit)
  'target_time'    -- Mundur ke jam target (HH:MM)
);


-- =====================================================
-- TABEL 1: MRC_GROUPS (Grup pertandingan)
-- =====================================================

CREATE TABLE public.mrc_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.mrc_categories(id) ON DELETE CASCADE,

  group_name    VARCHAR(50) NOT NULL,     -- "Grup A", "Grup B"

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mrc_groups IS 'Pembagian grup pertandingan MRC';

CREATE INDEX idx_mrc_groups_event    ON public.mrc_groups(event_id);
CREATE INDEX idx_mrc_groups_category ON public.mrc_groups(category_id);


-- =====================================================
-- TABEL 2: MRC_GROUP_TEAMS (Tim dalam grup + standing)
-- =====================================================

CREATE TABLE public.mrc_group_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES public.mrc_groups(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES public.mrc_teams(id) ON DELETE CASCADE,

  -- Statistik standing (diupdate setelah tiap pertandingan)
  played          INT NOT NULL DEFAULT 0,
  wins            INT NOT NULL DEFAULT 0,
  draws           INT NOT NULL DEFAULT 0,
  losses          INT NOT NULL DEFAULT 0,
  score_for       INT NOT NULL DEFAULT 0,  -- Total skor dicetak
  score_against   INT NOT NULL DEFAULT 0,  -- Total skor diterima
  points          INT NOT NULL DEFAULT 0,  -- Poin klasemen (diatur juri)
  rank            INT NULL,                -- Peringkat dalam grup

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_group_team UNIQUE (group_id, team_id)
);

COMMENT ON TABLE public.mrc_group_teams IS 'Tim dalam grup beserta statistik standing';

CREATE INDEX idx_mrc_group_teams_group ON public.mrc_group_teams(group_id);


-- =====================================================
-- TABEL 3: MRC_MATCHES (Pertandingan)
-- =====================================================

CREATE TABLE public.mrc_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.mrc_categories(id) ON DELETE CASCADE,

  -- Stage & posisi
  stage           public.mrc_match_stage NOT NULL DEFAULT 'group_stage',
  group_id        UUID NULL REFERENCES public.mrc_groups(id) ON DELETE SET NULL,
  bracket_position INT NULL,              -- Posisi di bracket eliminasi
  match_number    INT NOT NULL DEFAULT 0, -- Urutan di jadwal

  -- Tim bertanding
  team_a_id       UUID NULL REFERENCES public.mrc_teams(id) ON DELETE SET NULL,
  team_b_id       UUID NULL REFERENCES public.mrc_teams(id) ON DELETE SET NULL,
  team_a_label    VARCHAR(255) NULL,      -- "Pemenang Grup A" (jika tim belum ditentukan)
  team_b_label    VARCHAR(255) NULL,

  -- Skor total
  score_a         INT NOT NULL DEFAULT 0,
  score_b         INT NOT NULL DEFAULT 0,

  -- Babak
  current_round   INT NOT NULL DEFAULT 1,
  total_rounds    INT NOT NULL DEFAULT 2, -- 2 atau 3 babak

  -- Posisi tim (tukar setiap babak genap)
  is_swapped      BOOLEAN NOT NULL DEFAULT false,

  -- Pemenang & status
  winner_id       UUID NULL REFERENCES public.mrc_teams(id) ON DELETE SET NULL,
  status          public.mrc_match_status NOT NULL DEFAULT 'upcoming',

  -- Timer pertandingan
  timer_duration  INT NOT NULL DEFAULT 120,  -- Durasi dalam detik (default 2 menit)
  timer_remaining INT NOT NULL DEFAULT 120,  -- Sisa detik
  timer_status    public.mrc_timer_status NOT NULL DEFAULT 'stopped',
  timer_started_at TIMESTAMPTZ NULL,

  -- Bracket progression
  next_match_id   UUID NULL REFERENCES public.mrc_matches(id) ON DELETE SET NULL,
  next_match_slot VARCHAR(10) NULL CHECK (next_match_slot IN ('team_a', 'team_b')),

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.mrc_matches             IS 'Pertandingan MRC (fase grup & eliminasi)';
COMMENT ON COLUMN public.mrc_matches.team_a_label IS 'Label display jika tim belum ditentukan';
COMMENT ON COLUMN public.mrc_matches.is_swapped  IS 'True = posisi tim ditukar (babak genap)';
COMMENT ON COLUMN public.mrc_matches.next_match_slot IS 'Slot pemenang di match selanjutnya';

CREATE INDEX idx_mrc_matches_event    ON public.mrc_matches(event_id);
CREATE INDEX idx_mrc_matches_category ON public.mrc_matches(category_id);
CREATE INDEX idx_mrc_matches_status   ON public.mrc_matches(status);
CREATE INDEX idx_mrc_matches_group    ON public.mrc_matches(group_id);


-- =====================================================
-- TABEL 4: MRC_MATCH_ROUNDS (Skor per babak)
-- =====================================================

CREATE TABLE public.mrc_match_rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES public.mrc_matches(id) ON DELETE CASCADE,

  round_number    INT NOT NULL,           -- 1, 2, 3
  score_a         INT NOT NULL DEFAULT 0, -- Skor tim A babak ini (0-100)
  score_b         INT NOT NULL DEFAULT 0,
  notes           TEXT NULL,              -- Catatan juri
  judged_by       UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_match_round UNIQUE (match_id, round_number),
  CONSTRAINT chk_score_a CHECK (score_a >= 0 AND score_a <= 100),
  CONSTRAINT chk_score_b CHECK (score_b >= 0 AND score_b <= 100)
);

COMMENT ON TABLE public.mrc_match_rounds IS 'Skor per babak dalam pertandingan MRC';

CREATE INDEX idx_mrc_rounds_match ON public.mrc_match_rounds(match_id);


-- =====================================================
-- TABEL 5: MRC_LIVE_STATE (State overlay per kategori)
-- =====================================================
-- Satu baris per kategori per event.
-- Dikontrol oleh operator via dashboard.

CREATE TABLE public.mrc_live_state (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,
  category_id         UUID NOT NULL REFERENCES public.mrc_categories(id) ON DELETE CASCADE,

  -- Scene overlay aktif
  active_scene        public.mrc_overlay_scene NOT NULL DEFAULT 'none',
  current_match_id    UUID NULL REFERENCES public.mrc_matches(id) ON DELETE SET NULL,

  -- Coming Up overlay
  coming_up_match_id  UUID NULL REFERENCES public.mrc_matches(id) ON DELETE SET NULL,
  coming_up_message   TEXT NULL,           -- Pesan kustom
  coming_up_timer_mode public.mrc_timer_mode NOT NULL DEFAULT 'none',
  coming_up_countdown INT NULL,            -- Durasi countdown (detik)
  coming_up_target    TIMESTAMPTZ NULL,    -- Jam target (mode alarm)
  coming_up_timer_status public.mrc_timer_status NOT NULL DEFAULT 'stopped',
  coming_up_started_at TIMESTAMPTZ NULL,

  -- Break overlay
  break_message       TEXT NULL DEFAULT 'Istirahat',
  break_timer_mode    public.mrc_timer_mode NOT NULL DEFAULT 'none',
  break_countdown     INT NULL,            -- Durasi countdown (detik)
  break_target        TIMESTAMPTZ NULL,    -- Jam target (mode alarm)
  break_timer_status  public.mrc_timer_status NOT NULL DEFAULT 'stopped',
  break_started_at    TIMESTAMPTZ NULL,

  -- Metadata
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_live_state UNIQUE (event_id, category_id)
);

COMMENT ON TABLE public.mrc_live_state IS 'State overlay realtime per kategori MRC';


-- =====================================================
-- TABEL 6: MRC_OVERLAY_CONFIGS (Konfigurasi visual)
-- =====================================================

CREATE TABLE public.mrc_overlay_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.mrc_categories(id) ON DELETE CASCADE,

  -- Background artwork (PNG transparan)
  background_url  VARCHAR(500) NULL,
  theme_color     VARCHAR(7) NOT NULL DEFAULT '#DC2626',  -- Hex warna utama

  -- Posisi elemen dinamis (JSONB: { x, y, fontSize, color })
  team_a_position JSONB NULL DEFAULT '{"x": 120, "y": 660, "fontSize": 24, "color": "#FFFFFF"}',
  team_b_position JSONB NULL DEFAULT '{"x": 720, "y": 660, "fontSize": 24, "color": "#FFFFFF"}',
  score_position  JSONB NULL DEFAULT '{"x": 480, "y": 660, "fontSize": 32, "color": "#FFFFFF"}',
  timer_position  JSONB NULL DEFAULT '{"x": 480, "y": 40, "fontSize": 48, "color": "#FFFFFF"}',

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_overlay_config UNIQUE (event_id, category_id)
);

COMMENT ON TABLE public.mrc_overlay_configs IS 'Konfigurasi visual overlay OBS per kategori';


-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================

CREATE TRIGGER trg_mrc_matches_updated
  BEFORE UPDATE ON public.mrc_matches
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();

CREATE TRIGGER trg_mrc_live_state_updated
  BEFORE UPDATE ON public.mrc_live_state
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();

CREATE TRIGGER trg_mrc_overlay_configs_updated
  BEFORE UPDATE ON public.mrc_overlay_configs
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();


-- =====================================================
-- AUDIT TRIGGER
-- =====================================================

CREATE TRIGGER trg_audit_mrc_matches
  AFTER INSERT OR UPDATE OR DELETE ON public.mrc_matches
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();


-- =====================================================
-- RLS POLICY
-- =====================================================

ALTER TABLE public.mrc_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_group_teams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_match_rounds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_live_state      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_overlay_configs ENABLE ROW LEVEL SECURITY;

-- Panitia: CRUD semua
CREATE POLICY "mrc_groups: admin manage" ON public.mrc_groups
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

CREATE POLICY "mrc_group_teams: admin manage" ON public.mrc_group_teams
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

CREATE POLICY "mrc_matches: admin manage" ON public.mrc_matches
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

CREATE POLICY "mrc_match_rounds: admin manage" ON public.mrc_match_rounds
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

CREATE POLICY "mrc_live_state: admin manage" ON public.mrc_live_state
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

CREATE POLICY "mrc_overlay_configs: admin manage" ON public.mrc_overlay_configs
  FOR ALL USING (public.user_has_permission(auth.uid(), 'mrc:manage'));

-- Public read untuk overlay (halaman publik tanpa auth)
CREATE POLICY "mrc_matches: public read" ON public.mrc_matches
  FOR SELECT USING (true);

CREATE POLICY "mrc_match_rounds: public read" ON public.mrc_match_rounds
  FOR SELECT USING (true);

CREATE POLICY "mrc_groups: public read" ON public.mrc_groups
  FOR SELECT USING (true);

CREATE POLICY "mrc_group_teams: public read" ON public.mrc_group_teams
  FOR SELECT USING (true);

CREATE POLICY "mrc_live_state: public read" ON public.mrc_live_state
  FOR SELECT USING (true);

CREATE POLICY "mrc_overlay_configs: public read" ON public.mrc_overlay_configs
  FOR SELECT USING (true);


-- =====================================================
-- REALTIME: Enable realtime untuk overlay
-- =====================================================
-- Aktifkan Supabase Realtime pada tabel yang perlu
-- di-subscribe oleh overlay pages.

ALTER PUBLICATION supabase_realtime ADD TABLE public.mrc_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mrc_match_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mrc_live_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mrc_group_teams;
