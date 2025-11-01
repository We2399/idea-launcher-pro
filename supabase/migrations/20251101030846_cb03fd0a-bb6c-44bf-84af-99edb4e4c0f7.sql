-- Grant administrators read access to all profile-documents for signed URLs
DROP POLICY IF EXISTS "Administrators can view all profile documents" ON storage.objects;

CREATE POLICY "Administrators can view all profile documents"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'profile-documents' AND is_administrator(auth.uid()));
