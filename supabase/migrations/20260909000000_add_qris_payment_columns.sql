-- Menambah kolom QRIS dinamis (Midtrans Core API, payment_type = 'qris').
-- Alur Snap popup dihapus; halaman /mrc/bayar/[token] membaca kolom ini.
-- Kolom legacy midtrans_snap_token dipertahankan untuk data historis.

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS midtrans_qr_url TEXT,
  ADD COLUMN IF NOT EXISTS midtrans_qr_expiry TIMESTAMPTZ;
