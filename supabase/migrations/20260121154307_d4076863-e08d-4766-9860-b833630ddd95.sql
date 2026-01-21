-- =====================================================
-- SECURITY FIX 1: Create secure view for chat contacts
-- Only expose name and role, not sensitive profile data
-- =====================================================

-- Create a secure view that only exposes chat-relevant fields
CREATE OR REPLACE VIEW public.profiles_chat_view
WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.first_name,
  p.last_name,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_chat_view TO authenticated;

-- Drop the overly permissive policy that exposed all profile fields
DROP POLICY IF EXISTS "Employees can view admin profiles for chat" ON public.profiles;

-- =====================================================
-- SECURITY FIX 2: Make receipts bucket private
-- Drop any conflicting policies and recreate properly
-- =====================================================

-- Make the receipts bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'receipts';

-- Drop all existing receipts policies to start fresh
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- Create proper restrictive policies for receipts
-- Users can only view their own receipts (files in their folder)
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- HR admins and administrators can view all receipts
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND (is_hr_admin(auth.uid()) OR is_administrator(auth.uid()))
);

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own receipts
CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own receipts
CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);