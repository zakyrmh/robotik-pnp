-- Migration: Ringkasan keuangan mengikuti DAFTAR REKENING PANITIA (event_settings)
-- sehingga setiap rekening resmi selalu tampil — termasuk yang belum menerima
-- pendapatan (Rp 0) — bukan hanya rekening yang kebetulan sudah dipakai.
--
-- LATAR BELAKANG
-- Fungsi `get_event_finance_summary_by_bank()` sebelumnya (versi 20261001)
-- hanya meng-GROUP BY snapshot `event_registrations.payment_bank_*`, sehingga:
--   * Rekening yang sudah dikonfigurasi panitia di `event_settings.bank_accounts`
--     TIDAK muncul sama sekali bila belum ada tim yang transfer ke rekening itu.
--   * Kartu "Ringkasan Keuangan Per Rekening Bank" jadi tidak sesuai harapan:
--     rekening resmi (mis. "Bank BRI") hilang dari daftar.
--
-- SOLUSI
-- Sumber daftar rekening = `event_settings.bank_accounts` (JSONB array), dengan
-- fallback ke kolom tunggal `bank_name`/`bank_account_number`/
-- `bank_account_holder` bila array kosong. Untuk setiap rekening dihitung total
-- pendapatan dari pendaftaran `paid` yang snapshot rekeningnya cocok
-- (berdasarkan nomor rekening). Tambahan:
--   1. Rekening terkonfigurasi selalu tampil, walau total = 0.
--   2. Rekening dari snapshot yang sudah TIDAK ada di konfigurasi tetap
--      ditampilkan (jejak historis) agar uang tidak "hilang" dari rincian.
--   3. Satu baris agregat `is_unassigned` untuk pendapatan `paid` yang belum
--      ditetapkan rekeningnya, sehingga Σ rincian = total pendapatan `paid`.
--   4. `total_amount` tetap NUMERIC (tidak memotong desimal), dan kolom VARCHAR
--      di-cast ::TEXT agar RETURN QUERY tidak gagal.
--
-- CATATAN IMPLEMENTASI
-- Nama kolom internal CTE sengaja TIDAK memakai `total_amount`/`transaction_count`
-- karena pada PL/pgSQL nama OUT parameter diperlakukan sebagai variabel sehingga
-- memicu "column reference is ambiguous". Kolom dalam CTE diberi nama
-- `sum_amount`/`txn_count`, lalu di-alias ke nama OUT hanya di SELECT terluar.
--
-- Return type tidak berubah dari 20261001 (6 kolom), tetapi fungsi di-DROP
-- lebih dulu agar aman dan idempoten.

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
  WITH configured AS (
    -- Rekening resmi panitia dari event_settings.bank_accounts (JSONB array).
    SELECT DISTINCT
      acc->>'account_number' AS acct_no,
      acc->>'bank_name'      AS bank_nm,
      acc->>'account_holder' AS holder_nm
    FROM public.event_settings s
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(s.bank_accounts, '[]'::jsonb)
    ) AS acc
    WHERE NULLIF(acc->>'account_number', '') IS NOT NULL

    UNION

    -- Fallback ke kolom tunggal bila bank_accounts kosong/tidak ada.
    SELECT
      s.bank_account_number,
      s.bank_name,
      s.bank_account_holder
    FROM public.event_settings s
    WHERE COALESCE(jsonb_array_length(COALESCE(s.bank_accounts, '[]'::jsonb)), 0) = 0
      AND NULLIF(s.bank_account_number, '') IS NOT NULL
  ),
  paid AS (
    SELECT
      er.id,
      er.total_amount AS amt,
      er.payment_bank_account_number AS acct_no,
      er.payment_bank_name AS bank_nm,
      er.payment_bank_account_holder AS holder_nm
    FROM public.event_registrations er
    WHERE er.payment_status = 'paid'
  ),
  by_account AS (
    -- Total per nomor rekening (untuk dicocokkan ke rekening terkonfigurasi).
    SELECT
      p.acct_no::TEXT AS acct_no,
      SUM(p.amt)::NUMERIC AS sum_amount,
      COUNT(p.id)::BIGINT AS txn_count
    FROM paid p
    WHERE p.acct_no IS NOT NULL
    GROUP BY 1
  ),
  snapshot_extra AS (
    -- Rekening dari snapshot yang sudah tidak terkonfigurasi (jejak historis).
    SELECT
      p.acct_no::TEXT AS acct_no,
      p.bank_nm::TEXT AS bank_nm,
      p.holder_nm::TEXT AS holder_nm,
      SUM(p.amt)::NUMERIC AS sum_amount,
      COUNT(p.id)::BIGINT AS txn_count
    FROM paid p
    WHERE p.acct_no IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM configured c WHERE c.acct_no = p.acct_no
      )
    GROUP BY 1, 2, 3
  )

  -- 1) Setiap rekening terkonfigurasi (Rp 0 bila belum ada pendapatan).
  SELECT
    c.acct_no::TEXT,
    c.bank_nm::TEXT,
    c.holder_nm::TEXT,
    COALESCE(ba.sum_amount, 0)::NUMERIC,
    COALESCE(ba.txn_count, 0)::BIGINT,
    FALSE
  FROM configured c
  LEFT JOIN by_account ba ON ba.acct_no = c.acct_no

  UNION ALL

  -- 2) Rekening historis (snapshot) yang tidak lagi terkonfigurasi.
  SELECT
    se.acct_no,
    se.bank_nm,
    se.holder_nm,
    se.sum_amount,
    se.txn_count,
    FALSE
  FROM snapshot_extra se

  UNION ALL

  -- 3) Pendapatan yang belum ditetapkan rekeningnya (baris agregat tunggal).
  SELECT
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    COALESCE(SUM(p.amt), 0)::NUMERIC,
    COUNT(p.id)::BIGINT,
    TRUE
  FROM paid p
  WHERE p.acct_no IS NULL
  HAVING COUNT(p.id) > 0

  ORDER BY 6 ASC, 2 ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_event_finance_summary_by_bank() IS
'Ringkasan pendapatan per rekening bank untuk dashboard admin event. Daftar
rekening mengikuti konfigurasi panitia (event_settings.bank_accounts, fallback
kolom tunggal bank_*), sehingga setiap rekening resmi selalu tampil walau belum
menerima pendapatan (Rp 0). Menyertakan rekening historis dari snapshot yang
sudah tidak terkonfigurasi, serta satu baris agregat is_unassigned = true untuk
pendapatan paid yang belum ditetapkan rekeningnya — sehingga jumlah seluruh
baris merekonsiliasi total pendapatan paid (100%). Returns: account_number,
bank_name, account_holder, total_amount, transaction_count, is_unassigned.';
