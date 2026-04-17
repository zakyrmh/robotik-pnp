-- ================================================
-- Migration: RPC regenerate_piket_schedule
-- Atomik: hapus jadwal lama + insert jadwal baru
-- dalam satu transaction
-- ================================================

CREATE OR REPLACE FUNCTION public.regenerate_piket_schedule(
  p_period_id   uuid,
  p_assignments jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hapus semua jadwal lama untuk periode ini
  DELETE FROM public.piket_assignments
  WHERE period_id = p_period_id;

  -- Insert jadwal baru dari array JSON
  INSERT INTO public.piket_assignments (period_id, user_id, assigned_week)
  SELECT
    p_period_id,
    (item->>'user_id')::uuid,
    (item->>'assigned_week')::int
  FROM jsonb_array_elements(p_assignments) AS item;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_piket_schedule(uuid, jsonb)
  TO authenticated;