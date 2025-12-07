-- Allow all authenticated users to view user roles
-- This is needed for chat contact list functionality
CREATE POLICY "All authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);