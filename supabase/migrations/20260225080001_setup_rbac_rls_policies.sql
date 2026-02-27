-- ================================================
-- Migration: RLS Policies untuk RBAC, Departemen, dan Divisi
-- ================================================


-- =====================================================
-- AKTIFKAN RLS
-- =====================================================

ALTER TABLE public.departments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_divisions   ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- POLICY: USERS — Admin bisa baca semua user
-- =====================================================
-- Policy "users: self read" (migration sebelumnya) hanya mengizinkan
-- user melihat datanya sendiri. Policy ini menambahkan akses baca
-- untuk user yang memiliki permission 'member:read'.

CREATE POLICY "users: admin read" ON public.users
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'member:read')
  );


-- =====================================================
-- POLICY: PROFILES — Admin bisa baca semua profil
-- =====================================================

CREATE POLICY "profiles: admin read" ON public.profiles
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'member:read')
  );

-- Admin bisa update profil anggota
CREATE POLICY "profiles: admin update" ON public.profiles
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'member:update')
  );


-- =====================================================
-- POLICY: DEPARTMENTS (publik baca, admin kelola)
-- =====================================================

CREATE POLICY "departments: public read" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "departments: admin manage" ON public.departments
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'department:manage')
  );


-- =====================================================
-- POLICY: DIVISIONS (publik baca, admin kelola)
-- =====================================================

CREATE POLICY "divisions: public read" ON public.divisions
  FOR SELECT USING (true);

CREATE POLICY "divisions: admin manage" ON public.divisions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'division:manage')
  );


-- =====================================================
-- POLICY: ROLES (publik baca, rbac:manage kelola)
-- =====================================================

CREATE POLICY "roles: authenticated read" ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "roles: rbac admin manage" ON public.roles
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'rbac:manage')
  );


-- =====================================================
-- POLICY: PERMISSIONS (publik baca, rbac:manage kelola)
-- =====================================================

CREATE POLICY "permissions: authenticated read" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions: rbac admin manage" ON public.permissions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'rbac:manage')
  );


-- =====================================================
-- POLICY: ROLE_PERMISSIONS (publik baca, rbac:manage kelola)
-- =====================================================

CREATE POLICY "role_permissions: authenticated read" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions: rbac admin manage" ON public.role_permissions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'rbac:manage')
  );


-- =====================================================
-- POLICY: USER_ROLES (baca sendiri + admin kelola)
-- =====================================================

-- User bisa melihat role-nya sendiri
CREATE POLICY "user_roles: self read" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admin bisa melihat semua user roles
CREATE POLICY "user_roles: admin read" ON public.user_roles
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'member:read')
  );

-- Hanya rbac:manage yang bisa assign/revoke role
CREATE POLICY "user_roles: rbac admin manage" ON public.user_roles
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'rbac:manage')
  );


-- =====================================================
-- POLICY: USER_DEPARTMENTS (baca sendiri + admin kelola)
-- =====================================================

CREATE POLICY "user_departments: self read" ON public.user_departments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_departments: admin read" ON public.user_departments
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'member:read')
  );

CREATE POLICY "user_departments: admin manage" ON public.user_departments
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'department:manage')
  );


-- =====================================================
-- POLICY: USER_DIVISIONS (baca sendiri + admin kelola)
-- =====================================================

CREATE POLICY "user_divisions: self read" ON public.user_divisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_divisions: admin read" ON public.user_divisions
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'member:read')
  );

CREATE POLICY "user_divisions: admin manage" ON public.user_divisions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'division:manage')
  );


-- =====================================================
-- UPDATE: Perbaiki policy blacklist menggunakan RBAC
-- =====================================================

DROP POLICY IF EXISTS "blacklist: admin only" ON public.user_blacklist;

CREATE POLICY "blacklist: admin manage" ON public.user_blacklist
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'blacklist:manage')
  );

-- User bisa melihat blacklist-nya sendiri
CREATE POLICY "blacklist: self read" ON public.user_blacklist
  FOR SELECT USING (auth.uid() = user_id);
