-- Drop the existing insert policy and create a new one that allows administrators and HR admins
DROP POLICY IF EXISTS "Only org owners can create invitations" ON public.employee_invitations;
DROP POLICY IF EXISTS "Org admins and HR can create invitations" ON public.employee_invitations;

-- Create a new policy that allows org owners, administrators, and HR admins to create invitations
CREATE POLICY "Org admins and HR can create invitations"
ON public.employee_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
  AND (
    -- Is the organization owner
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id 
      AND o.owner_id = auth.uid()
    )
    OR 
    -- Is an administrator
    public.is_administrator(auth.uid())
    OR
    -- Is an HR admin
    public.is_hr_admin(auth.uid())
  )
);

-- Also update the UPDATE policy to allow admins/HR to cancel invitations
DROP POLICY IF EXISTS "Only org owners can update invitations" ON public.employee_invitations;
DROP POLICY IF EXISTS "Org admins and HR can update invitations" ON public.employee_invitations;

CREATE POLICY "Org admins and HR can update invitations"
ON public.employee_invitations
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
  AND (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id 
      AND o.owner_id = auth.uid()
    )
    OR 
    public.is_administrator(auth.uid())
    OR
    public.is_hr_admin(auth.uid())
  )
);