-- Phase 1.2: Administrator Override RLS Policies

-- 1. Administrator can manage all leave requests
DROP POLICY IF EXISTS "Administrator can manage all requests" ON public.leave_requests;
CREATE POLICY "Administrator can manage all requests" 
ON public.leave_requests 
FOR ALL 
USING (is_administrator(auth.uid()));

-- 2. Administrator can manage all cash transactions
DROP POLICY IF EXISTS "Administrator can manage all cash transactions" ON public.cash_transactions;
CREATE POLICY "Administrator can manage all cash transactions" 
ON public.cash_transactions 
FOR ALL 
USING (is_administrator(auth.uid()));

-- 3. Administrator can manage all profiles (including position field)
DROP POLICY IF EXISTS "Administrator can update all profiles" ON public.profiles;
CREATE POLICY "Administrator can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_administrator(auth.uid()));

-- 4. Administrator can manage all profile change requests
DROP POLICY IF EXISTS "Administrator can manage all profile change requests" ON public.profile_change_requests;
CREATE POLICY "Administrator can manage all profile change requests" 
ON public.profile_change_requests 
FOR ALL 
USING (is_administrator(auth.uid()));

-- 5. Administrator can manage all tasks
DROP POLICY IF EXISTS "Administrator can manage all tasks explicitly" ON public.tasks;
CREATE POLICY "Administrator can manage all tasks explicitly" 
ON public.tasks 
FOR ALL 
USING (is_administrator(auth.uid()));

-- 6. Administrator can manage user_roles
DROP POLICY IF EXISTS "Administrator can manage user roles" ON public.user_roles;
CREATE POLICY "Administrator can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (is_administrator(auth.uid()));