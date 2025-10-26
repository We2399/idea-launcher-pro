-- Reset leave and cash control data for a clean trial run
BEGIN;

-- 1) Clear cash control data
DELETE FROM public.cash_transactions;

-- 2) Clear leave requests data
DELETE FROM public.leave_requests;

-- 3) Reset leave balances (keep allocations and totals intact)
UPDATE public.leave_balances
SET used_days = 0,
    remaining_days = total_days,
    updated_at = now();

COMMIT;