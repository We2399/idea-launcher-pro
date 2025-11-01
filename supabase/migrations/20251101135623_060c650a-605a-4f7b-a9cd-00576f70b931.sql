-- Fix sync_profile_document_to_storage to compute proper versions and prevent duplicate key errors
CREATE OR REPLACE FUNCTION public.sync_profile_document_to_storage()
RETURNS TRIGGER AS $$
DECLARE
  last_doc_id UUID;
  last_version INTEGER;
  new_version INTEGER;
BEGIN
  -- Find the latest document_storage record for this user/type/source
  SELECT id, version INTO last_doc_id, last_version
  FROM public.document_storage
  WHERE user_id = NEW.user_id
    AND document_type = NEW.document_type
    AND source = 'profile'
    AND deleted_at IS NULL
  ORDER BY version DESC
  LIMIT 1;
  
  -- Compute the new version
  new_version := COALESCE(last_version, 0) + 1;
  
  -- Insert with proper versioning
  INSERT INTO public.document_storage (
    user_id, document_type, document_name, file_path,
    file_size, mime_type, source, version, uploaded_by,
    replaces_document_id, replacement_status, is_latest_version
  )
  VALUES (
    NEW.user_id, 
    NEW.document_type, 
    NEW.document_name, 
    NEW.file_path,
    COALESCE(NEW.file_size, 0), 
    NEW.mime_type, 
    'profile', 
    new_version, 
    NEW.uploaded_by,
    last_doc_id,  -- Link to previous version if exists
    CASE 
      WHEN last_doc_id IS NULL THEN 'active'  -- First upload is active
      ELSE 'pending_approval'  -- Replacements need approval
    END,
    CASE 
      WHEN last_doc_id IS NULL THEN TRUE  -- First upload is latest
      ELSE FALSE  -- Replacements wait for approval
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;