-- Migration: Sertakan pendapatan tanpa rekening tujuan pada ringkasan keuangan
-- per rekening bank, dan jaga presisi nilai.
--
-- LATAR BELAKANG
-- Kartu "Ringkasan Keuangan Per Rekening Bank" pada dashboard admin event
-- menampilkan total pendapatan per rekening panitia. Sumber atribusi rekening
-- adalah snapshot manual `event_registrations.payment_bank_*` yang diisi oleh
-- panitia-pendaftaran (lihat `setRegistrationPaymentBankAction`).
--
-- MASALAH
-- Versi sebelumnya hanya mengembalikan baris dengan
-- `payment_bank_account_number IS NOT NULL`. Karena penetapan rekening tujuan
-- bersifat MANUAL dan OPSIONAL, tim yang sudah `paid` tetapi belum ditetapkan
-- rekeningnya HILANG dari rincian per rekening — padahal uangnya tetap dihitung
-- pada `totalIncome` kartu dashboard. Akibatnya total persentase < 100% dan
-- pendapatan per rekening tampak kurang dari yang sebenarnya.
-- Selain itu `SUM(total_amount)::BIGINT` memotong bagian desimal dari
-- `NUMERIC(12,2)`.
--
-- SOLUSI
-- 1. Tambah satu baris agregat "belum ditetapkan rekening" (`is_unassigned`)
--    untuk semua `paid` dengan `payment_bank_account_number IS NULL`, sehingga
--    jumlah seluruh baris = total pendapatan paid (rekonsiliasi 100%).
-- 2. Kembalikan `total_amount` sebagai NUMERIC (bukan BIGINT) agar nilai
--    desimal tidak terpotong.
-- 3. Baris "belum ditetapkan" selalu diletakkan paling akhir, rekening nyata
--    diurutkan abjad berdasarkan nama bank.
--
-- Return type berubah, jadi fungsi lama harus di-DROP terlebih dahulu
-- (`CREATE OR REPLACE` tidak dapat mengubah daftar kolom OUT).

DROP FUNCTION IF EXISTS public.get_event_finance_summary_by_bank();

CREATE OR REPLACE FUNCTION public.get_event_finance_summary_by_bank()
RETURNS TABLE (
  account_number TEXT,
  bank_name TEXT,
  account_holder TEXT,
  total_amount NUMERIC,
  transaction_count BIGINT,
  is_unassigned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- 1. Pendapatan yang sudah ditetapkan rekening tujuannya (per rekening).
  --    Kolom sumber bertipe VARCHAR, sedangkan OUT param bertipe TEXT; cast
  --    eksplisit diperlukan agar RETURN QUERY tidak gagal dengan
  --    "structure of query does not match function result type".
  SELECT
    er.payment_bank_account_number::TEXT AS account_number,
    er.payment_bank_name::TEXT AS bank_name,
    er.payment_bank_account_holder::TEXT AS account_holder,
    COALESCE(SUM(er.total_amount), 0)::NUMERIC AS total_amount,
    COUNT(er.id)::BIGINT AS transaction_count,
    FALSE AS is_unassigned
  FROM public.event_registrations er
  WHERE er.payment_status = 'paid'
    AND er.payment_bank_account_number IS NOT NULL
  GROUP BY
    er.payment_bank_account_number,
    er.payment_bank_name,
    er.payment_bank_account_holder

  UNION ALL

  -- 2. Pendapatan yang BELUM ditetapkan rekeningnya (baris agregat tunggal).
  --    Hanya muncul bila memang ada, agar tidak menambah baris kosong.
  SELECT
    NULL::TEXT AS account_number,
    NULL::TEXT AS bank_name,
    NULL::TEXT AS account_holder,
    COALESCE(SUM(er.total_amount), 0)::NUMERIC AS total_amount,
    COUNT(er.id)::BIGINT AS transaction_count,
    TRUE AS is_unassigned
  FROM public.event_registrations er
  WHERE er.payment_status = 'paid'
    AND er.payment_bank_account_number IS NULL
  HAVING COUNT(er.id) > 0

  ORDER BY is_unassigned ASC, bank_name ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Perbarui komentar dokumentasi fungsi.
COMMENT ON FUNCTION public.get_event_finance_summary_by_bank() IS
'Agregasi total pendapatan per rekening bank dari pendaftaran event yang sudah
dibayar (payment_status = paid). Menyertakan satu baris agregat is_unassigned
untuk pendapatan yang belum ditetapkan rekeningnya, sehingga jumlah seluruh
baris merekonsiliasi total pendapatan paid (100%). Dipakai oleh dashboard admin
event. Returns: account_number, bank_name, account_holder, total_amount,
transaction_count, is_unassigned.';
