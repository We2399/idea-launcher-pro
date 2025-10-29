-- Strengthen RLS to prevent perceived self-approval by HR Admins and block approvals with 0 days
-- 1) Replace broad Administrator policy with per-command policies including approval guard
-- 2) Tighten HR Admin UPDATE to forbid approving records they created, and where the employee appears to be the same person (name match)
-- 3) Disallow approving allocations with allocated_days <= 0 for both Admin and HR Admin via WITH CHECK

-- Safety: remove previous overlapping policies if present
DROP POLICY IF EXISTS "Administrators can manage all allocations" ON public.leave_allocations;
DROP POLICY IF EXISTS "HR admins can update allocations except own" ON public.leave_allocations;

-- Administrators: granular permissions
CREATE POLICY "Administrators can select allocations"
ON public.leave_allocations
FOR SELECT
TO authenticated
USING (is_administrator(auth.uid()));

CREATE POLICY "Administrators can insert allocations"
ON public.leave_allocations
FOR INSERT
TO authenticated
WITH CHECK (is_administrator(auth.uid()));

CREATE POLICY "Administrators can update allocations"
ON public.leave_allocations
FOR UPDATE
TO authenticated
USING (is_administrator(auth.uid()))
WITH CHECK (
  is_administrator(auth.uid())
  AND (
    -- Prevent approving allocations with 0 days
    status <> 'approved' OR allocated_days > 0
  )
);

CREATE POLICY "Administrators can delete allocations"
ON public.leave_allocations
FOR DELETE
TO authenticated
USING (is_administrator(auth.uid()));

-- HR Admins: keep existing INSERT/SELECT/DELETE policies (not modified here)
-- Recreate UPDATE with stricter constraints to avoid self-approval patterns
CREATE POLICY "HR admins can update allocations except own"
ON public.leave_allocations
FOR UPDATE
TO authenticated
USING (
  is_hr_admin(auth.uid())
  AND auth.uid() <> user_id                     -- not their own user row
  AND allocated_by <> auth.uid()                -- cannot update allocations they created
  AND NOT EXISTS (
    -- Best-effort: block when employee appears to be same person by name
    SELECT 1
    FROM public.profiles p_self
    JOIN public.profiles p_emp ON TRUE
    WHERE p_self.user_id = auth.uid()
      AND p_emp.user_id = leave_allocations.user_id
      AND lower(p_self.first_name) = lower(p_emp.first_name)
      AND lower(p_self.last_name) = lower(p_emp.last_name)
  )
)
WITH CHECK (
  is_hr_admin(auth.uid())
  AND auth.uid() <> user_id
  AND allocated_by <> auth.uid()
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p_self
    JOIN public.profiles p_emp ON TRUE
    WHERE p_self.user_id = auth.uid()
      AND p_emp.user_id = leave_allocations.user_id
      AND lower(p_self.first_name) = lower(p_emp.first_name)
      AND lower(p_self.last_name) = lower(p_emp.last_name)
  )
  AND (
    -- Prevent approving allocations with 0 days
    status <> 'approved' OR allocated_days > 0
  )
);
