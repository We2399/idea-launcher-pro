-- Allow employees to view profiles of HR admins and administrators for chat
CREATE POLICY "Employees can view admin profiles for chat"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role IN ('hr_admin', 'administrator')
  )
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'employee'
  )
);