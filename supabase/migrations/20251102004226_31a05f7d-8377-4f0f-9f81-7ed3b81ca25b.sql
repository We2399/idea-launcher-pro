-- Fix cash receipt upload duplicate key error
-- Drop the existing constraint that causes issues with multiple cash receipts
ALTER TABLE document_storage DROP CONSTRAINT IF EXISTS unique_version_per_document;

-- Create new conditional unique index: only enforce versioning for profile documents
-- This allows multiple cash receipts (which don't need versioning) while maintaining
-- version uniqueness for profile documents
CREATE UNIQUE INDEX unique_version_per_profile_document 
ON document_storage(user_id, document_type, source, version)
WHERE source = 'profile' AND deleted_at IS NULL;

-- Update the sync_cash_receipt_to_storage trigger to ensure it works correctly
-- with the new constraint (this is mostly for clarity, existing trigger should work)
CREATE OR REPLACE FUNCTION public.sync_cash_receipt_to_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.receipt_url IS NOT NULL AND (OLD.receipt_url IS NULL OR OLD.receipt_url <> NEW.receipt_url) THEN
    -- Each cash receipt is unique per transaction (cash_transaction_id)
    -- No versioning needed for receipts, always version=1, always active
    INSERT INTO public.document_storage (
      user_id, document_type, document_name, file_path,
      file_size, mime_type, source, version, uploaded_by,
      cash_transaction_id, replacement_status, is_latest_version
    )
    VALUES (
      NEW.employee_id, 
      'receipt', 
      COALESCE(NEW.description, 'Cash Receipt') || ' - ' || NEW.created_at::DATE,
      NEW.receipt_url,
      0, 
      'image/jpeg', 
      'cash_control', 
      1, 
      NEW.employee_id,
      NEW.id,
      'active',
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$function$;