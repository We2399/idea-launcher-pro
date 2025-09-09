-- Phase 1: Extended Profile Fields and Document Storage
-- Add extended profile fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visa_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create profile_documents table for document storage
CREATE TABLE IF NOT EXISTS public.profile_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profile_documents
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_documents
CREATE POLICY "Users can view their own documents" 
ON public.profile_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" 
ON public.profile_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents" 
ON public.profile_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.profile_documents 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "HR admins can view all documents" 
ON public.profile_documents 
FOR SELECT 
USING (is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can manage all documents" 
ON public.profile_documents 
FOR ALL 
USING (is_hr_admin(auth.uid()));

CREATE POLICY "Managers can view team documents" 
ON public.profile_documents 
FOR SELECT 
USING (is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = profile_documents.user_id 
  AND profiles.manager_id = auth.uid()
));

-- Create storage bucket for profile documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile documents
CREATE POLICY "Users can upload their own profile documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR admins can manage all profile documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'profile-documents' AND is_hr_admin(auth.uid()));

CREATE POLICY "Managers can view team profile documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-documents' AND is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id::text = (storage.foldername(name))[1]
  AND profiles.manager_id = auth.uid()
));

-- Add trigger for updating updated_at on profile_documents
CREATE TRIGGER update_profile_documents_updated_at
BEFORE UPDATE ON public.profile_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();