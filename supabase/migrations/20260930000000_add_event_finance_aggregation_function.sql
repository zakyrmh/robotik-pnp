-- Migration: Add SQL function to aggregate event finance by bank account
-- Purpose: Efficiently calculate total income per bank account without fetching all rows to client
-- Benefits: Reduces data transfer, faster query, better for Supabase Free Plan

-- Drop function if exists (for safe re-migration)
DROP FUNCTION IF EXISTS get_event_finance_summary_by_bank() CASCADE;

-- Create function to aggregate finance data by bank account
CREATE OR REPLACE FUNCTION get_event_finance_summary_by_bank()
RETURNS TABLE (
  account_number TEXT,
  bank_name TEXT,
  account_holder TEXT,
  total_amount BIGINT,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.payment_bank_account_number,
    er.payment_bank_name,
    er.payment_bank_account_holder,
    COALESCE(SUM(er.total_amount), 0)::BIGINT as total_amount,
    COUNT(er.id)::BIGINT as transaction_count
  FROM event_registrations er
  WHERE er.payment_status = 'paid'
    AND er.payment_bank_account_number IS NOT NULL
  GROUP BY 
    er.payment_bank_account_number,
    er.payment_bank_name,
    er.payment_bank_account_holder
  ORDER BY er.payment_bank_name ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION get_event_finance_summary_by_bank() IS 
'Aggregates total income per bank account from paid event registrations. 
Used by event admin dashboard to display financial summary efficiently.
Returns: account_number, bank_name, account_holder, total_amount, transaction_count';
