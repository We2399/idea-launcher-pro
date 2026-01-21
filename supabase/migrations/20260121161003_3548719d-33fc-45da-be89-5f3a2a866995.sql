-- Fix overly permissive RLS policies

-- 1. Fix audit_logs INSERT policy - only authenticated users can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Fix payroll_notifications INSERT policy - only HR admin or administrator can create
DROP POLICY IF EXISTS "System can create notifications" ON public.payroll_notifications;
CREATE POLICY "Management can create payroll notifications" 
ON public.payroll_notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_hr_admin(auth.uid()) OR is_administrator(auth.uid())
);