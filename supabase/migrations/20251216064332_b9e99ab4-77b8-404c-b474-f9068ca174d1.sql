-- Drop the problematic FOR ALL policy
DROP POLICY IF EXISTS "Administrators full access" ON public.organizations;

-- Create separate admin policies for each operation
CREATE POLICY "Admins can select organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);

CREATE POLICY "Admins can insert organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);

CREATE POLICY "Admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);

CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);