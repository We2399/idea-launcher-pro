-- Fix RLS for leave_allocations
-- 1) Prevent HR admins from approving their own allocations
-- 2) Allow Administrators to view/manage all allocations so data shows up

-- Drop overly-broad HR admin policy if it exists
DROP POLICY IF EXISTS "HR Admins can manage all allocations" ON public.leave_allocations;

-- Allow Administrators to manage all allocations (view/create/update/delete)
CREATE POLICY "Administrators can manage all allocations"
ON public.leave_allocations
FOR ALL
TO authenticated
USING (is_administrator(auth.uid()))
WITH CHECK (is_administrator(auth.uid()));

-- HR admins granular permissions
-- View all allocations
CREATE POLICY "HR admins can view all allocations"
ON public.leave_allocations
FOR SELECT
TO authenticated
USING (is_hr_admin(auth.uid()));

-- Insert allocations
CREATE POLICY "HR admins can insert allocations"
ON public.leave_allocations
FOR INSERT
TO authenticated
WITH CHECK (is_hr_admin(auth.uid()));

-- Update allocations except their own (prevents self-approval)
CREATE POLICY "HR admins can update allocations except own"
ON public.leave_allocations
FOR UPDATE
TO authenticated
USING (is_hr_admin(auth.uid()) AND auth.uid() <> user_id)
WITH CHECK (is_hr_admin(auth.uid()) AND auth.uid() <> user_id);

-- Delete allocations except their own (consistency)
CREATE POLICY "HR admins can delete allocations except own"
ON public.leave_allocations
FOR DELETE
TO authenticated
USING (is_hr_admin(auth.uid()) AND auth.uid() <> user_id);
