-- Create document_storage table with single approval workflow
CREATE TABLE IF NOT EXISTS public.document_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document Info
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  
  -- Source Tracking
  source TEXT NOT NULL CHECK (source IN ('profile', 'cash_control', 'other')),
  cash_transaction_id UUID REFERENCES public.cash_transactions(id) ON DELETE SET NULL,
  
  -- Version Control
  version INTEGER NOT NULL DEFAULT 1,
  replaces_document_id UUID REFERENCES public.document_storage(id) ON DELETE SET NULL,
  replacement_reason TEXT,
  is_latest_version BOOLEAN DEFAULT TRUE,
  
  -- SINGLE Approval Workflow (Either HR Admin OR Administrator)
  replacement_status TEXT DEFAULT 'active' CHECK (
    replacement_status IN (
      'pending_approval',
      'active',
      'rejected',
      'replaced'
    )
  ),
  
  -- Single Approval Tracking
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Tracking
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Soft Deletion (Administrator only)
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_version_per_document UNIQUE(user_id, document_type, source, version)
);

CREATE INDEX IF NOT EXISTS idx_doc_storage_user_id ON public.document_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_storage_source ON public.document_storage(source);
CREATE INDEX IF NOT EXISTS idx_doc_storage_status ON public.document_storage(replacement_status);
CREATE INDEX IF NOT EXISTS idx_doc_storage_latest ON public.document_storage(is_latest_version) WHERE is_latest_version = TRUE;
CREATE INDEX IF NOT EXISTS idx_doc_storage_deleted ON public.document_storage(deleted_at) WHERE deleted_at IS NULL;

-- Create document_comments table
CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_storage(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('employee_reply', 'admin_note', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_comments_document ON public.document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_comments_created ON public.document_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is administrator
CREATE OR REPLACE FUNCTION public.is_administrator(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_administrator.user_id
    AND role = 'administrator'
  );
$$;

-- Helper function to check if user is HR admin
CREATE OR REPLACE FUNCTION public.is_hr_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_hr_admin.user_id
    AND role = 'hr_admin'
  );
$$;

-- Document Storage Policies
CREATE POLICY "Administrators can manage all documents"
ON public.document_storage FOR ALL
TO authenticated
USING (is_administrator(auth.uid()))
WITH CHECK (is_administrator(auth.uid()));

CREATE POLICY "HR Admins can view all documents"
ON public.document_storage FOR SELECT
TO authenticated
USING (is_hr_admin(auth.uid()));

CREATE POLICY "HR Admins can approve/reject pending documents"
ON public.document_storage FOR UPDATE
TO authenticated
USING (
  is_hr_admin(auth.uid()) 
  AND replacement_status = 'pending_approval'
)
WITH CHECK (
  is_hr_admin(auth.uid()) 
  AND replacement_status IN ('active', 'rejected')
);

CREATE POLICY "Users can view their own documents"
ON public.document_storage FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = uploaded_by);

CREATE POLICY "Users can upload documents"
ON public.document_storage FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() = uploaded_by);

-- Document Comments Policies
CREATE POLICY "Users can view comments on their documents"
ON public.document_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.document_storage ds
    WHERE ds.id = document_comments.document_id
    AND (ds.user_id = auth.uid() OR is_administrator(auth.uid()) OR is_hr_admin(auth.uid()))
  )
);

CREATE POLICY "Users can add comments on their documents"
ON public.document_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.document_storage ds
    WHERE ds.id = document_comments.document_id
    AND ds.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can add comments on any document"
ON public.document_comments FOR INSERT
TO authenticated
WITH CHECK (
  (is_administrator(auth.uid()) OR is_hr_admin(auth.uid())) AND
  auth.uid() = user_id
);

-- Function: Approve replacement
CREATE OR REPLACE FUNCTION public.approve_replacement(doc_id UUID, approval_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_doc_id UUID;
BEGIN
  IF NOT (is_hr_admin(auth.uid()) OR is_administrator(auth.uid())) THEN
    RAISE EXCEPTION 'Only HR admins or administrators can approve replacements';
  END IF;
  
  SELECT replaces_document_id INTO old_doc_id
  FROM public.document_storage
  WHERE id = doc_id;
  
  IF old_doc_id IS NOT NULL THEN
    UPDATE public.document_storage
    SET 
      replacement_status = 'replaced',
      is_latest_version = FALSE,
      updated_at = NOW()
    WHERE id = old_doc_id;
  END IF;
  
  UPDATE public.document_storage
  SET 
    replacement_status = 'active',
    approved_by = auth.uid(),
    approved_at = NOW(),
    is_latest_version = TRUE,
    updated_at = NOW()
  WHERE id = doc_id
  AND replacement_status = 'pending_approval';
  
  IF approval_note IS NOT NULL THEN
    INSERT INTO public.document_comments (document_id, user_id, comment, comment_type)
    VALUES (doc_id, auth.uid(), approval_note, 'admin_note');
  END IF;
END;
$$;

-- Function: Reject replacement
CREATE OR REPLACE FUNCTION public.reject_replacement(doc_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_hr_admin(auth.uid()) OR is_administrator(auth.uid())) THEN
    RAISE EXCEPTION 'Only HR admins or administrators can reject replacements';
  END IF;
  
  UPDATE public.document_storage
  SET 
    replacement_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = NOW(),
    rejection_reason = reason,
    is_latest_version = FALSE,
    updated_at = NOW()
  WHERE id = doc_id
  AND replacement_status = 'pending_approval';
  
  INSERT INTO public.document_comments (document_id, user_id, comment, comment_type)
  VALUES (doc_id, auth.uid(), reason, 'admin_note');
END;
$$;

-- Function: Get document version history
CREATE OR REPLACE FUNCTION public.get_document_versions(original_doc_id UUID)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  document_name TEXT,
  file_path TEXT,
  replacement_status TEXT,
  replacement_reason TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE version_chain AS (
    SELECT * FROM document_storage WHERE id = original_doc_id
    UNION ALL
    SELECT ds.* 
    FROM document_storage ds
    INNER JOIN version_chain vc ON ds.replaces_document_id = vc.id
  )
  SELECT 
    id, version, document_name, file_path, replacement_status,
    replacement_reason, uploaded_by, created_at,
    approved_by, approved_at, rejection_reason
  FROM version_chain
  ORDER BY version ASC;
$$;

-- Function: Soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_document(doc_id UUID, deletion_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_administrator(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can delete documents';
  END IF;
  
  UPDATE public.document_storage
  SET 
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    is_latest_version = FALSE,
    updated_at = NOW()
  WHERE id = doc_id;
  
  IF deletion_reason IS NOT NULL THEN
    INSERT INTO public.document_comments (document_id, user_id, comment, comment_type)
    VALUES (doc_id, auth.uid(), 'Document deleted: ' || deletion_reason, 'system');
  END IF;
END;
$$;

-- Trigger: Auto-populate from profile_documents
CREATE OR REPLACE FUNCTION public.sync_profile_document_to_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.document_storage (
    user_id, document_type, document_name, file_path,
    file_size, mime_type, source, version, uploaded_by,
    replacement_status
  )
  VALUES (
    NEW.user_id, NEW.document_type, NEW.document_name, NEW.file_path,
    COALESCE(NEW.file_size, 0), NEW.mime_type, 'profile', 1, NEW.uploaded_by,
    'active'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_document_insert ON public.profile_documents;
CREATE TRIGGER on_profile_document_insert
AFTER INSERT ON public.profile_documents
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_document_to_storage();

-- Trigger: Auto-populate from cash_transactions
CREATE OR REPLACE FUNCTION public.sync_cash_receipt_to_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receipt_url IS NOT NULL AND (OLD.receipt_url IS NULL OR OLD.receipt_url <> NEW.receipt_url) THEN
    INSERT INTO public.document_storage (
      user_id, document_type, document_name, file_path,
      file_size, mime_type, source, version, uploaded_by,
      cash_transaction_id, replacement_status
    )
    VALUES (
      NEW.employee_id, 'receipt', 
      COALESCE(NEW.description, 'Cash Receipt') || ' - ' || NEW.created_at::DATE,
      NEW.receipt_url,
      0, 'image/jpeg', 'cash_control', 1, NEW.employee_id,
      NEW.id, 'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_cash_transaction_receipt ON public.cash_transactions;
CREATE TRIGGER on_cash_transaction_receipt
AFTER INSERT OR UPDATE ON public.cash_transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_cash_receipt_to_storage();

-- Migrate existing profile documents
INSERT INTO public.document_storage (
  user_id, document_type, document_name, file_path,
  file_size, mime_type, source, version, uploaded_by,
  created_at, replacement_status, is_latest_version
)
SELECT 
  user_id, document_type, document_name, file_path,
  COALESCE(file_size, 0), mime_type, 'profile', 1, uploaded_by,
  created_at, 'active', TRUE
FROM public.profile_documents
WHERE NOT EXISTS (
  SELECT 1 FROM public.document_storage ds
  WHERE ds.file_path = profile_documents.file_path
);

-- Migrate existing cash receipts
INSERT INTO public.document_storage (
  user_id, document_type, document_name, file_path,
  file_size, mime_type, source, version, uploaded_by,
  cash_transaction_id, created_at, replacement_status, is_latest_version
)
SELECT 
  employee_id, 'receipt',
  COALESCE(description, 'Cash Receipt') || ' - ' || created_at::DATE,
  receipt_url,
  0, 'image/jpeg', 'cash_control', 1, employee_id,
  id, created_at, 'active', TRUE
FROM public.cash_transactions
WHERE receipt_url IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.document_storage ds
  WHERE ds.file_path = cash_transactions.receipt_url
);