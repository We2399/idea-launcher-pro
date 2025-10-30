-- Fix admin approval and prevent HR self-approval/0-day approvals. Add protective trigger.

-- 1) Drop and recreate UPDATE policies to ensure correct behavior
DROP POLICY IF EXISTS "Administrators can update allocations" ON public.leave_allocations;
DROP POLICY IF EXISTS "HR admins can update allocations except own" ON public.leave_allocations;

-- Administrator: can update any allocation; cannot approve when allocated_days <= 0
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

-- HR Admin: stricter constraints + cannot set final approved
CREATE POLICY "HR admins can update allocations except own"
ON public.leave_allocations
FOR UPDATE
TO authenticated
USING (
  is_hr_admin(auth.uid())
  AND auth.uid() <> user_id                     -- not their own row
  AND allocated_by <> auth.uid()                -- cannot update allocations they created
  AND NOT EXISTS (
    -- Block when employee appears to be same person by name
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
    SELECT 1 FROM public.profiles p_self
    JOIN public.profiles p_emp ON TRUE
    WHERE p_self.user_id = auth.uid()
      AND p_emp.user_id = leave_allocations.user_id
      AND lower(p_self.first_name) = lower(p_emp.first_name)
      AND lower(p_self.last_name) = lower(p_emp.last_name)
  )
  AND (
    -- HR admins cannot produce a row with final approved status
    status <> 'approved'
  )
  AND (
    -- Prevent any pathway to approving 0-day allocations
    status <> 'approved' OR allocated_days > 0
  )
);

-- 2) Protective trigger: non-admins cannot change sensitive fields previously set by admin
CREATE OR REPLACE FUNCTION public.prevent_non_admin_change_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow administrators to change anything
  IF is_administrator(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- For non-admins, prevent modifying sensitive columns
  IF NEW.allocated_days IS DISTINCT FROM OLD.allocated_days
     OR NEW.year IS DISTINCT FROM OLD.year
     OR NEW.leave_type_id IS DISTINCT FROM OLD.leave_type_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.allocated_by IS DISTINCT FROM OLD.allocated_by THEN
    RAISE EXCEPTION 'Only administrators can modify allocation core fields' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'protect_allocation_sensitives'
  ) THEN
    DROP TRIGGER protect_allocation_sensitives ON public.leave_allocations;
  END IF;
END$$;

CREATE TRIGGER protect_allocation_sensitives
BEFORE UPDATE ON public.leave_allocations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_change_sensitive_fields();