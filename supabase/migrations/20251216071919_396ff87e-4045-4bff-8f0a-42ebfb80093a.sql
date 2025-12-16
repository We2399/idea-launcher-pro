-- Create security definer functions to avoid RLS recursion

-- Function to check if user is organization owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND owner_id = auth.uid()
  )
$$;

-- Function to check if user is organization member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  )
$$;

-- Function to get user's organization IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
$$;

-- Drop and recreate organization_members policies to use functions
DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Administrators can manage all members" ON public.organization_members;

CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_organization_owner(organization_id));

CREATE POLICY "Owners can manage org members"
ON public.organization_members
FOR ALL
TO authenticated
USING (is_organization_owner(organization_id));

CREATE POLICY "Admins manage all members"
ON public.organization_members
FOR ALL
TO authenticated
USING (is_administrator(auth.uid()));

-- Drop and recreate organizations policies to use functions
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;

CREATE POLICY "Members can view their org"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_organization_ids()));