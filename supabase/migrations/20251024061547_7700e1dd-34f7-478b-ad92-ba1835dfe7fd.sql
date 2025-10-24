-- Allow administrators to view all profiles
CREATE POLICY "Administrators can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_administrator(auth.uid()));