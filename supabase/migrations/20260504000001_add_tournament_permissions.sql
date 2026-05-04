-- ================================================
-- Migration: Add tournament:manage permission and assign to roles
-- ================================================

-- =====================================================
-- Add tournament:manage permission
-- =====================================================

INSERT INTO public.permissions (name, description)
VALUES ('tournament:manage', 'Mengelola setup turnamen — tim, grup, dan pertandingan')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Assign tournament:manage to super_admin (sudah punya semua)
-- Skip karena super_admin sudah punya CROSS JOIN semua permissions
-- =====================================================

-- Assign tournament:manage to admin (semua kecuali rbac:manage)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.name = 'tournament:manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign tournament:manage to pengurus (opsional, jika ingin delegate ke pengurus)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'pengurus'
  AND p.name = 'tournament:manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
