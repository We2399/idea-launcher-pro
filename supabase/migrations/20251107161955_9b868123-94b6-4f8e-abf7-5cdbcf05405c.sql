-- Drop the existing policy that allows all authenticated users to view system settings
DROP POLICY IF EXISTS "All authenticated users can view system settings" ON public.system_settings;

-- Create new policy that only allows HR Admin and Administrator to view system settings
CREATE POLICY "Only HR Admin and Administrator can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  is_hr_admin(auth.uid()) OR is_administrator(auth.uid())
);