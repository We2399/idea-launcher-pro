
-- 1. Fix: employee_invitations public email exposure
DROP POLICY IF EXISTS "Anyone can view invitation by code for joining" ON public.employee_invitations;
CREATE POLICY "Authenticated users can view valid invitations"
ON public.employee_invitations
FOR SELECT
TO authenticated
USING (status = 'pending'::invitation_status AND expires_at > now());

-- 2. Fix: audit_logs unauthenticated insert / null user_id
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Fix: user_roles all authenticated can view -> restrict to self + admins
DROP POLICY IF EXISTS "All authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and HR can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and HR can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_administrator(auth.uid()) OR public.is_hr_admin(auth.uid()));

-- 4. Fix: receipts bucket overly permissive upload
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

-- 5. Fix: chat_messages realtime authorization
DROP POLICY IF EXISTS "Users can subscribe to their own chat topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own chat topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'chat:%'
  AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
);

-- 6. Fix: SECURITY DEFINER view -> set security_invoker
DO $$
DECLARE v record;
BEGIN
  FOR v IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' AND n.nspname = 'public'
      AND EXISTS (
        SELECT 1 FROM pg_rewrite r
        WHERE r.ev_class = c.oid
          AND pg_get_viewdef(c.oid) IS NOT NULL
      )
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', v.nspname, v.relname);
  END LOOP;
END$$;

-- 7. Fix: Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated
-- Keep functions callable only by service_role and from within RLS policies (which run as definer regardless of execute grants).
REVOKE EXECUTE ON FUNCTION public.check_organization_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_approved_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_cash_receipt_to_storage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_document_to_storage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_from_auth(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_all_profiles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_payroll_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_non_admin_change_sensitive_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_document(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_replacement(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_replacement(uuid, text) FROM PUBLIC, anon;
