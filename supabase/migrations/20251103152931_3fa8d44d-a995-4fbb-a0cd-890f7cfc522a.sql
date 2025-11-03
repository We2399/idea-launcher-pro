
-- Drop the existing SELECT policy that might be causing issues
DROP POLICY IF EXISTS "Users can view comments on their documents" ON document_comments;

-- Create a simpler, more direct policy for viewing comments
-- Allow users to view comments if they own the document OR if they are admin/hr_admin
CREATE POLICY "view_document_comments" ON document_comments
FOR SELECT
TO authenticated
USING (
  -- Admins and HR admins can see all comments
  is_administrator(auth.uid()) OR is_hr_admin(auth.uid())
  OR
  -- Users can see comments on documents they own
  EXISTS (
    SELECT 1 FROM document_storage ds
    WHERE ds.id = document_comments.document_id
    AND ds.user_id = auth.uid()
  )
);

-- Also ensure the INSERT policies are correct
-- Drop existing insert policies
DROP POLICY IF EXISTS "Admins can add comments on any document" ON document_comments;
DROP POLICY IF EXISTS "Users can add comments on their documents" ON document_comments;

-- Recreate INSERT policies with clearer logic
CREATE POLICY "admins_insert_comments" ON document_comments
FOR INSERT
TO authenticated
WITH CHECK (
  (is_administrator(auth.uid()) OR is_hr_admin(auth.uid()))
  AND auth.uid() = user_id
);

CREATE POLICY "users_insert_comments" ON document_comments
FOR INSERT  
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM document_storage ds
    WHERE ds.id = document_comments.document_id
    AND ds.user_id = auth.uid()
  )
);
