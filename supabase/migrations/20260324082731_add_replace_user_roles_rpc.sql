-- ================================================
-- Migration: RPC replace_user_roles
-- Atomik: hapus role lama + insert baru dalam satu transaksi
-- ================================================

CREATE OR REPLACE FUNCTION public.replace_user_roles(
  p_user_id     uuid,
  p_role_ids    uuid[],
  p_assigned_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hapus semua role lama
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id;

  -- Insert role baru
  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  SELECT p_user_id, unnest(p_role_ids), p_assigned_by;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_user_roles(uuid, uuid[], uuid)
  TO authenticated;