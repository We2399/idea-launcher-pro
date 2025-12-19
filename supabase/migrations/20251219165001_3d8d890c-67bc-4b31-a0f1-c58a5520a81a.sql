-- Drop and recreate the administrator storage policy with simpler conditions
DROP POLICY IF EXISTS "Administrators can view all profile documents" ON storage.objects;

-- Create a simpler policy for administrators
CREATE POLICY "Administrators can view all profile documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'profile-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'administrator'
  )
);

-- Also add a SELECT-only policy for HR admins since ALL might not work correctly for SELECT
DROP POLICY IF EXISTS "HR admins can view profile documents" ON storage.objects;

CREATE POLICY "HR admins can view profile documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'hr_admin'
  )
);