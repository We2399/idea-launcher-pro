-- Allow all authenticated users to SELECT from profiles_chat_view for chat functionality
-- This view only exposes minimal info: user_id, first_name, last_name, role

-- First, check if the view has security definer set, if not recreate it
DROP VIEW IF EXISTS public.profiles_chat_view;

-- Recreate view with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE VIEW public.profiles_chat_view
WITH (security_invoker = false)
AS
SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id;

-- Grant select access to all authenticated users
GRANT SELECT ON public.profiles_chat_view TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.profiles_chat_view IS 'Minimal profile view for chat contacts. Exposes only name and role, accessible by all authenticated users.';