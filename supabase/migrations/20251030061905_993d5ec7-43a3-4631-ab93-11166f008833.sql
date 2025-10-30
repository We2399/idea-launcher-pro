-- 1) Ensure Administrators can manage leave_balances (fix RLS error on approval)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leave_balances' AND policyname = 'Administrator can manage all balances'
  ) THEN
    CREATE POLICY "Administrator can manage all balances"
    ON public.leave_balances
    FOR ALL
    USING (is_administrator(auth.uid()))
    WITH CHECK (is_administrator(auth.uid()));
  END IF;
END $$;

-- 2) Replace permissive HR admin policy on leave_requests with restrictive ones to prevent self-approval
DROP POLICY IF EXISTS "HR admins can manage all requests" ON public.leave_requests;

-- Keep admins full control (already exists per schema); ensure HR admins can read all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leave_requests' AND policyname = 'HR admins can view all requests'
  ) THEN
    CREATE POLICY "HR admins can view all requests"
    ON public.leave_requests
    FOR SELECT
    USING (is_hr_admin(auth.uid()));
  END IF;
END $$;

-- HR admins can update requests except their own (covers dual-account by name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leave_requests' AND policyname = 'HR admins can update requests except own'
  ) THEN
    CREATE POLICY "HR admins can update requests except own"
    ON public.leave_requests
    FOR UPDATE
    USING (
      is_hr_admin(auth.uid())
      AND auth.uid() <> user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p_self
        JOIN public.profiles p_emp ON TRUE
        WHERE p_self.user_id = auth.uid()
          AND p_emp.user_id = leave_requests.user_id
          AND lower(p_self.first_name) = lower(p_emp.first_name)
          AND lower(p_self.last_name) = lower(p_emp.last_name)
      )
    )
    WITH CHECK (
      is_hr_admin(auth.uid())
      AND auth.uid() <> user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p_self
        JOIN public.profiles p_emp ON TRUE
        WHERE p_self.user_id = auth.uid()
          AND p_emp.user_id = leave_requests.user_id
          AND lower(p_self.first_name) = lower(p_emp.first_name)
          AND lower(p_self.last_name) = lower(p_emp.last_name)
      )
    );
  END IF;
END $$;