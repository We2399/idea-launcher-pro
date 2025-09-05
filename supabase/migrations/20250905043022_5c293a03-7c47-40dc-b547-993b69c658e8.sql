-- Fix the handle_new_user function to properly assign roles from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, employee_id, first_name, last_name, email, department, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'employee_id', 'EMP' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General'),
    COALESCE(NEW.raw_user_meta_data ->> 'position', 'Employee')
  );
  
  -- Insert user role from metadata, defaulting to 'employee'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee')::app_role
  );
  
  RETURN NEW;
END;
$$;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true);

-- Create storage policies for receipt uploads
CREATE POLICY "Anyone can view receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own receipts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);