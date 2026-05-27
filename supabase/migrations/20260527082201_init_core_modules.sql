-- ENUM TYPES EXTENSION
DO $$ BEGIN
    CREATE TYPE public.attendance_status AS ENUM ('hadir', 'izin', 'sakit', 'alfa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.piket_day AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM ('belum_selesai', 'diperiksa', 'selesai', 'revisi');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. TABEL: DIVISI (Untuk Keperluan Plotting Magang)
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: KELOMPOK CAANG (Untuk Pengelompokan Pembinaan / OR)
CREATE TABLE IF NOT EXISTS public.caang_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: ANGGOTA KELOMPOK (Relasi M-M Profiles ke Kelompok)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.caang_groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: PLOTTING MAGANG CAANG
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    task_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: ABSENSI KEGIATAN (Modul /absensi & /kegiatan)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    check_in_at TIMESTAMPTZ DEFAULT NOW(),
    status public.attendance_status NOT NULL DEFAULT 'alfa',
    notes TEXT,
    proof_url TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_activity UNIQUE (activity_id, profile_id)
);

-- 6. TABEL: JADWAL PIKET HARIAN (Modul /piket - Master Data)
CREATE TABLE IF NOT EXISTS public.piket_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day public.piket_day NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_day UNIQUE (day)
);

-- 7. TABEL: PLOTTING ANGGOTA PIKET (Relasi M-M Anggota ke Jadwal)
CREATE TABLE IF NOT EXISTS public.piket_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.piket_schedules(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_member_schedule UNIQUE (schedule_id, profile_id)
);

-- 8. TABEL: LOG BUKTI PIKET (Modul /piket - Transaksional harian)
CREATE TABLE IF NOT EXISTS public.piket_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.piket_schedules(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL,
    proof_image_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL: TUGAS PEMBINAAN CAANG (Modul /tugas)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL: PENGUMPULAN TUGAS CAANG
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_url TEXT,
    notes TEXT,
    status public.task_status DEFAULT 'belum_selesai',
    feedback TEXT,
    grade INTEGER CONSTRAINT chk_grade CHECK (grade >= 0 AND grade <= 100),
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_caang_task UNIQUE (task_id, profile_id)
);

-- ==========================================
-- INDEXING
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_internships_division_id ON public.internships(division_id);
CREATE INDEX IF NOT EXISTS idx_attendances_activity_id ON public.attendances(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendances_profile_id ON public.attendances(profile_id);
CREATE INDEX IF NOT EXISTS idx_piket_members_schedule_id ON public.piket_members(schedule_id);
CREATE INDEX IF NOT EXISTS idx_piket_logs_schedule_id ON public.piket_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_profile_id ON public.task_submissions(profile_id);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to handle updated_at on task_submissions
DROP TRIGGER IF EXISTS task_submissions_updated_at ON public.task_submissions;
CREATE TRIGGER task_submissions_updated_at
    BEFORE UPDATE ON public.task_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to auto-onboard profile when registration is verified
CREATE OR REPLACE FUNCTION public.handle_registration_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    UPDATE public.profiles
    SET is_onboarded = true
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_registration_approved ON public.registrations;
CREATE TRIGGER on_registration_approved
    AFTER UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_registration_approval();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) ENABLE
-- ==========================================
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caang_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piket_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Divisions Policies
CREATE POLICY "allow_select_divisions" ON public.divisions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_admin_write_divisions" ON public.divisions
    FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('super-admin', 'admin-or'))
    WITH CHECK (public.get_my_role() IN ('super-admin', 'admin-or'));

-- Caang Groups Policies
CREATE POLICY "allow_select_caang_groups" ON public.caang_groups
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_insert_caang_groups" ON public.caang_groups
    FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_update_caang_groups" ON public.caang_groups
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-or', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_delete_caang_groups" ON public.caang_groups
    FOR DELETE TO authenticated USING (public.get_my_role() = 'super-admin');

-- Group Members Policies
CREATE POLICY "allow_select_group_members" ON public.group_members
    FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_insert_group_members" ON public.group_members
    FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_update_group_members" ON public.group_members
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-or', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_delete_group_members" ON public.group_members
    FOR DELETE TO authenticated USING (public.get_my_role() IN ('admin-or', 'super-admin'));

-- Internships Policies
CREATE POLICY "allow_select_internships" ON public.internships
    FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_insert_internships" ON public.internships
    FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_update_internships" ON public.internships
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-or', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

CREATE POLICY "allow_delete_internships" ON public.internships
    FOR DELETE TO authenticated USING (public.get_my_role() IN ('admin-or', 'super-admin'));

-- Attendances Policies
CREATE POLICY "allow_select_attendances" ON public.attendances
    FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_insert_attendances" ON public.attendances
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "allow_update_attendances" ON public.attendances
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-komdis', 'admin-or', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-komdis', 'admin-or', 'super-admin'));

CREATE POLICY "allow_delete_attendances" ON public.attendances
    FOR DELETE TO authenticated USING (public.get_my_role() = 'super-admin');

-- Piket Schedules Policies
CREATE POLICY "allow_select_piket_schedules" ON public.piket_schedules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_admin_write_piket_schedules" ON public.piket_schedules
    FOR ALL TO authenticated
    USING (public.get_my_role() IN ('super-admin', 'admin-komdis', 'admin-or'))
    WITH CHECK (public.get_my_role() IN ('super-admin', 'admin-komdis', 'admin-or'));

-- Piket Members Policies
CREATE POLICY "allow_select_piket_members" ON public.piket_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_admin_write_piket_members" ON public.piket_members
    FOR ALL TO authenticated
    USING (public.get_my_role() IN ('super-admin', 'admin-komdis', 'admin-or'))
    WITH CHECK (public.get_my_role() IN ('super-admin', 'admin-komdis', 'admin-or'));

-- Piket Logs Policies
CREATE POLICY "allow_select_piket_logs" ON public.piket_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_insert_piket_logs" ON public.piket_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_my_role() = 'anggota' AND
        reported_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.piket_members pm
            JOIN public.piket_schedules ps ON pm.schedule_id = ps.id
            WHERE pm.profile_id = auth.uid()
              AND ps.day = CASE EXTRACT(ISODOW FROM duty_date)
                             WHEN 1 THEN 'Senin'::public.piket_day
                             WHEN 2 THEN 'Selasa'::public.piket_day
                             WHEN 3 THEN 'Rabu'::public.piket_day
                             WHEN 4 THEN 'Kamis'::public.piket_day
                             WHEN 5 THEN 'Jumat'::public.piket_day
                             WHEN 6 THEN 'Sabtu'::public.piket_day
                             WHEN 7 THEN 'Minggu'::public.piket_day
                           END
        )
    );

CREATE POLICY "allow_update_piket_logs" ON public.piket_logs
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-komdis', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-komdis', 'super-admin'));

CREATE POLICY "allow_delete_piket_logs" ON public.piket_logs
    FOR DELETE TO authenticated USING (public.get_my_role() = 'super-admin');

-- Tasks Policies
CREATE POLICY "allow_select_tasks" ON public.tasks
    FOR SELECT TO authenticated USING (public.get_my_role() IN ('caang', 'super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_insert_tasks" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('admin-or', 'admin-komdis', 'super-admin'));

CREATE POLICY "allow_update_tasks" ON public.tasks
    FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin-or', 'admin-komdis', 'super-admin'))
    WITH CHECK (public.get_my_role() IN ('admin-or', 'admin-komdis', 'super-admin'));

CREATE POLICY "allow_delete_tasks" ON public.tasks
    FOR DELETE TO authenticated USING (public.get_my_role() = 'super-admin');

-- Task Submissions Policies
CREATE POLICY "allow_select_task_submissions" ON public.task_submissions
    FOR SELECT TO authenticated USING (auth.uid() = profile_id OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_insert_task_submissions" ON public.task_submissions
    FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'caang' AND auth.uid() = profile_id);

CREATE POLICY "allow_update_task_submissions" ON public.task_submissions
    FOR UPDATE TO authenticated
    USING ((public.get_my_role() = 'caang' AND auth.uid() = profile_id) OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'))
    WITH CHECK ((public.get_my_role() = 'caang' AND auth.uid() = profile_id) OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));

CREATE POLICY "allow_delete_task_submissions" ON public.task_submissions
    FOR DELETE TO authenticated USING (public.get_my_role() = 'super-admin');


-- ==========================================
-- STORAGE BUCKETS CONFIGURATION (ST-01)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('piket-proofs', 'piket-proofs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', false) ON CONFLICT (id) DO NOTHING;

-- Piket Proofs Storage Policies
CREATE POLICY "Allow authenticated users to view piket proofs" ON storage.objects
    FOR SELECT TO authenticated USING ( bucket_id = 'piket-proofs' );

CREATE POLICY "Allow anggota to upload piket proofs" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'piket-proofs' AND public.get_my_role() = 'anggota' );

CREATE POLICY "Allow owner or admins to update piket proofs" ON storage.objects
    FOR UPDATE TO authenticated USING ( bucket_id = 'piket-proofs' AND (owner = auth.uid() OR public.get_my_role() IN ('super-admin', 'admin-komdis')) );

CREATE POLICY "Allow owner or super-admin to delete piket proofs" ON storage.objects
    FOR DELETE TO authenticated USING ( bucket_id = 'piket-proofs' AND (owner = auth.uid() OR public.get_my_role() = 'super-admin') );

-- Task Submissions Storage Policies
CREATE POLICY "Allow owner or admins to view task submissions" ON storage.objects
    FOR SELECT TO authenticated USING ( bucket_id = 'task-submissions' AND (owner = auth.uid() OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis')) );

CREATE POLICY "Allow caang to upload task submissions" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'task-submissions' AND public.get_my_role() = 'caang' );

CREATE POLICY "Allow owner or admins to update task submissions" ON storage.objects
    FOR UPDATE TO authenticated USING ( bucket_id = 'task-submissions' AND (owner = auth.uid() OR public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis')) );

CREATE POLICY "Allow owner or super-admin to delete task submissions" ON storage.objects
    FOR DELETE TO authenticated USING ( bucket_id = 'task-submissions' AND (owner = auth.uid() OR public.get_my_role() = 'super-admin') );
