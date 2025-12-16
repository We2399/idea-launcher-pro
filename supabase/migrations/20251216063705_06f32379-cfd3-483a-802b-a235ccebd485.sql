-- Drop all existing policies on organizations table to fix infinite recursion
DROP POLICY IF EXISTS "Administrators can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create simple, non-recursive policies
-- Allow anyone authenticated to insert (they must set owner_id to their own id)
CREATE POLICY "Users can create their own organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Allow owners to view their organization
CREATE POLICY "Owners can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Allow members to view their organization (using a simple subquery without recursion)
CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Allow owners to update their organization
CREATE POLICY "Owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow administrators to manage all organizations
CREATE POLICY "Administrators full access"
ON public.organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);